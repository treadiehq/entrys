import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ToolsService } from '../tools/tools.service';
import { PoliciesService } from '../policies/policies.service';
import { AuditService } from '../audit/audit.service';
import { ScrubberService } from './scrubber.service';
import { RateLimiterService } from './rate-limiter.service';
import { MCPClientService } from './mcp-client.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import type { AgentKey, Tool } from '@prisma/client';
import type { InvokeResponse, RedactionSummary, AuditWebhookPayload } from '@entrys/shared';

export interface InvokeParams {
  toolName: string;
  agentKey: AgentKey;
  input?: Record<string, unknown>;
  params?: Record<string, string>;
}

@Injectable()
export class InvokeService {
  private readonly logger = new Logger(InvokeService.name);

  constructor(
    private toolsService: ToolsService,
    private policiesService: PoliciesService,
    private auditService: AuditService,
    private scrubberService: ScrubberService,
    private rateLimiterService: RateLimiterService,
    private mcpClientService: MCPClientService,
    private webhooksService: WebhooksService,
  ) {}

  async invoke(params: InvokeParams): Promise<InvokeResponse> {
    const startTime = Date.now();
    const requestId = uuidv4();
    const { toolName, agentKey, input, params: urlParams } = params;

    // Resolve alias → logicalName → active version
    // This is the core "Segment moment" - agents call stable names, backends can change
    const tool = await this.toolsService.resolveActiveVersion(toolName, agentKey.envId, agentKey.teamId);
    
    if (!tool) {
      await this.logAudit({
        envId: agentKey.envId,
        requestId,
        agentKey,
        toolName,
        logicalName: null,
        toolVersion: null,
        backendType: null,
        decision: 'deny',
        statusCode: null,
        latencyMs: Date.now() - startTime,
        redactions: [],
      });
      return this.errorResponse(requestId, 'TOOL_NOT_FOUND', `Tool "${toolName}" not found or no active version`);
    }

    // Check policy (allowAllAgents or specific policy)
    const isAllowed = await this.policiesService.isAllowed(tool.id, agentKey.id);
    if (!isAllowed) {
      await this.logAudit({
        envId: agentKey.envId,
        requestId,
        agentKey,
        toolName,
        logicalName: tool.logicalName,
        toolVersion: tool.version,
        backendType: tool.type,
        decision: 'deny',
        statusCode: null,
        latencyMs: Date.now() - startTime,
        redactions: [],
      });
      return this.errorResponse(requestId, 'UNAUTHORIZED', 'Agent not authorized for this tool');
    }

    // Check rate limit
    const allowed = this.rateLimiterService.consume(agentKey.id, tool.id);
    if (!allowed) {
      await this.logAudit({
        envId: agentKey.envId,
        requestId,
        agentKey,
        toolName,
        logicalName: tool.logicalName,
        toolVersion: tool.version,
        backendType: tool.type,
        decision: 'deny',
        statusCode: null,
        latencyMs: Date.now() - startTime,
        redactions: [],
      });
      return this.errorResponse(requestId, 'RATE_LIMITED', 'Rate limit exceeded (60 req/min)');
    }

    // Route to appropriate backend based on tool type
    try {
      let output: unknown;
      let statusCode: number | null = null;

      if (tool.type === 'mcp') {
        // MCP backend
        const result = await this.mcpClientService.callTool(tool, input);
        output = result.output;
        
        if (result.isError) {
          const latencyMs = Date.now() - startTime;
          await this.logAudit({
            envId: agentKey.envId,
            requestId,
            agentKey,
            toolName,
            logicalName: tool.logicalName,
            toolVersion: tool.version,
            backendType: tool.type,
            decision: 'error',
            statusCode: null,
            latencyMs,
            redactions: [],
          });
          return this.errorResponse(requestId, 'MCP_ERROR', 'MCP tool call failed');
        }
      } else {
        // HTTP backend (default)
        let url: string;
        try {
          url = this.buildUrl(tool.urlTemplate, urlParams);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'URL template error';
          await this.logAudit({
            envId: agentKey.envId,
            requestId,
            agentKey,
            toolName,
            logicalName: tool.logicalName,
            toolVersion: tool.version,
            backendType: tool.type,
            decision: 'error',
            statusCode: null,
            latencyMs: Date.now() - startTime,
            redactions: [],
          });
          return this.errorResponse(requestId, 'VALIDATION_ERROR', message);
        }

        const result = await this.executeHttp(tool, url, input);
        output = result.output;
        statusCode = result.statusCode;
      }

      const latencyMs = Date.now() - startTime;

      // Scrub PII from output (if enabled for this tool)
      const { scrubbed, redactions } = tool.redactionEnabled 
        ? this.scrubberService.scrub(output)
        : { scrubbed: output, redactions: [] };

      await this.logAudit({
        envId: agentKey.envId,
        requestId,
        agentKey,
        toolName,
        logicalName: tool.logicalName,
        toolVersion: tool.version,
        backendType: tool.type,
        decision: 'allow',
        statusCode,
        latencyMs,
        redactions,
      });

      return {
        ok: true,
        tool: toolName,
        output: scrubbed,
        meta: {
          requestId,
          latencyMs,
          redactions,
          version: tool.version,
          backendType: tool.type,
        },
      };
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      const message = err instanceof Error ? err.message : 'Upstream error';
      
      await this.logAudit({
        envId: agentKey.envId,
        requestId,
        agentKey,
        toolName,
        logicalName: tool.logicalName,
        toolVersion: tool.version,
        backendType: tool.type,
        decision: 'error',
        statusCode: null,
        latencyMs,
        redactions: [],
      });

      return this.errorResponse(requestId, 'UPSTREAM_ERROR', message);
    }
  }

  private buildUrl(template: string, params?: Record<string, string>): string {
    let url = template;
    const placeholders = template.match(/\{\{(\w+)\}\}/g);
    
    if (placeholders) {
      for (const placeholder of placeholders) {
        const key = placeholder.slice(2, -2); // Remove {{ and }}
        const value = params?.[key];
        if (!value) {
          throw new Error(`Missing required parameter: ${key}`);
        }
        url = url.replace(placeholder, encodeURIComponent(value));
      }
    }
    
    return url;
  }

  private async executeHttp(
    tool: Tool,
    url: string,
    input?: Record<string, unknown>,
  ): Promise<{ output: unknown; statusCode: number }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'AgentToolGateway/1.0',
    };

    // Merge custom headers from tool config
    if (tool.headersJson) {
      try {
        const customHeaders = JSON.parse(tool.headersJson);
        Object.assign(headers, customHeaders);
      } catch {
        // Invalid JSON in headers, ignore
      }
    }

    const options: RequestInit = {
      method: tool.method,
      headers,
    };

    // Add body for non-GET requests
    if (tool.method !== 'GET' && input) {
      options.body = JSON.stringify(input);
    }

    const response = await fetch(url, options);
    const statusCode = response.status;

    // Try to parse as JSON, fall back to text
    const contentType = response.headers.get('content-type');
    let output: unknown;

    if (contentType?.includes('application/json')) {
      output = await response.json();
    } else {
      const text = await response.text();
      output = { raw: text };
    }

    return { output, statusCode };
  }

  private errorResponse(
    requestId: string,
    code: 'TOOL_NOT_FOUND' | 'UNAUTHORIZED' | 'UPSTREAM_ERROR' | 'RATE_LIMITED' | 'VALIDATION_ERROR' | 'MCP_ERROR',
    message: string,
  ): InvokeResponse {
    return {
      ok: false,
      error: { code, message },
      meta: { requestId },
    };
  }

  private async logAudit(params: {
    envId: string;
    requestId: string;
    agentKey: AgentKey;
    toolName: string;
    logicalName: string | null;
    toolVersion: string | null;
    backendType: string | null;
    decision: 'allow' | 'deny' | 'error';
    statusCode: number | null;
    latencyMs: number;
    redactions: RedactionSummary[];
  }): Promise<void> {
    try {
      await this.auditService.create({
        envId: params.envId,
        requestId: params.requestId,
        agentKeyId: params.agentKey.id,
        agentLabel: `${params.agentKey.name} (${params.agentKey.keyPrefix}...)`,
        toolName: params.toolName,
        logicalName: params.logicalName ?? undefined,
        toolVersion: params.toolVersion ?? undefined,
        backendType: params.backendType ?? undefined,
        decision: params.decision,
        statusCode: params.statusCode,
        latencyMs: params.latencyMs,
        redactions: params.redactions,
      });

      // Fan-out to webhooks (async, non-blocking)
      const webhookPayload: AuditWebhookPayload = {
        requestId: params.requestId,
        timestamp: new Date().toISOString(),
        environment: params.envId, // TODO: resolve to name
        agentName: params.agentKey.name,
        toolName: params.toolName,
        logicalName: params.logicalName,
        version: params.toolVersion,
        backendType: params.backendType,
        decision: params.decision,
        statusCode: params.statusCode,
        latencyMs: params.latencyMs,
        redactionCount: params.redactions.reduce((sum, r) => sum + r.count, 0),
      };

      // Fire and forget - never blocks invoke response
      this.webhooksService.fanOutAuditEvent(webhookPayload, params.agentKey.teamId).catch((err) => {
        this.logger.warn(`Webhook fan-out failed: ${err.message}`);
      });
    } catch (err) {
      this.logger.error('Failed to write audit log:', err);
    }
  }
}
