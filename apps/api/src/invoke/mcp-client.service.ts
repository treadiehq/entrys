import { Injectable, Logger } from '@nestjs/common';
import type { Tool } from '@prisma/client';

export interface MCPCallResult {
  output: unknown;
  isError: boolean;
}

/**
 * MCP Client Adapter
 * 
 * The gateway acts as an MCP client, forwarding tool calls to MCP servers.
 * This keeps the invoke contract stable while supporting MCP backends.
 * 
 * MCP Protocol:
 * - POST to server URL with JSON-RPC 2.0 format
 * - method: "tools/call"
 * - params: { name: string, arguments: object }
 */
@Injectable()
export class MCPClientService {
  private readonly logger = new Logger(MCPClientService.name);

  async callTool(
    tool: Tool,
    input?: Record<string, unknown>,
  ): Promise<MCPCallResult> {
    const serverUrl = tool.urlTemplate;
    const toolName = tool.mcpToolName || tool.logicalName;

    const requestBody = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: input || {},
      },
    };

    this.logger.debug(`Calling MCP server: ${serverUrl}, tool: ${toolName}`);

    try {
      const response = await fetch(serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AgentToolGateway/1.0',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`MCP server returned ${response.status}: ${errorText}`);
        return {
          output: { error: `MCP server error: ${response.status}` },
          isError: true,
        };
      }

      const result = await response.json();

      // Handle JSON-RPC error response
      if (result.error) {
        this.logger.error(`MCP call failed: ${JSON.stringify(result.error)}`);
        return {
          output: { 
            error: result.error.message || 'MCP call failed',
            code: result.error.code,
          },
          isError: true,
        };
      }

      // Handle MCP tool response format
      // MCP returns: { content: [{ type: 'text', text: '...' }, ...], isError?: boolean }
      const mcpResult = result.result;
      
      if (mcpResult?.isError) {
        return {
          output: this.extractContent(mcpResult.content),
          isError: true,
        };
      }

      return {
        output: this.extractContent(mcpResult?.content || mcpResult),
        isError: false,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown MCP error';
      this.logger.error(`MCP call exception: ${message}`);
      return {
        output: { error: message },
        isError: true,
      };
    }
  }

  /**
   * Extract content from MCP response format
   * Converts MCP content array to a simpler output format
   */
  private extractContent(content: unknown): unknown {
    if (!content) return null;

    if (Array.isArray(content)) {
      // If single text content, return the text directly
      if (content.length === 1 && content[0]?.type === 'text') {
        const text = content[0].text;
        // Try to parse as JSON
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      }

      // Multiple content items - return structured
      return content.map((item) => {
        if (item.type === 'text') {
          return { type: 'text', content: item.text };
        }
        if (item.type === 'image') {
          return { type: 'image', mimeType: item.mimeType, data: '[redacted]' };
        }
        if (item.type === 'resource') {
          return { type: 'resource', uri: item.uri };
        }
        return item;
      });
    }

    return content;
  }
}
