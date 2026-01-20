// ============================================================
// entrys - Shared Types
// ============================================================

// Enums
export type EnvironmentName = 'staging' | 'prod';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
export type ToolType = 'http' | 'mcp';
export type PolicyAction = 'allow' | 'deny';
export type AuditDecision = 'allow' | 'deny' | 'error';

// ============================================================
// Entity Types
// ============================================================

export interface Team {
  id: string;
  name: string;
  createdAt: Date;
}

export interface Environment {
  id: string;
  teamId: string;
  name: EnvironmentName;
  createdAt: Date;
}

export interface AgentKey {
  id: string;
  teamId: string;
  envId: string;
  name: string;
  keyPrefix: string;
  isRevoked: boolean;
  createdAt: Date;
  lastUsedAt: Date | null;
}

export interface Tool {
  id: string;
  teamId: string;
  envId: string;
  logicalName: string;
  version: string;
  displayName: string;
  type: ToolType;
  method: HttpMethod;
  urlTemplate: string;
  headersJson: string | null;
  mcpToolName: string | null;
  allowAllAgents: boolean;
  redactionEnabled: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ToolAlias {
  id: string;
  teamId: string;
  envId: string;
  alias: string;
  logicalName: string;
  createdAt: Date;
}

export interface AuditWebhook {
  id: string;
  teamId: string;
  name: string;
  url: string;
  isEnabled: boolean;
  createdAt: Date;
}

export interface ToolPolicy {
  id: string;
  toolId: string;
  agentKeyId: string | null;
  agentNamePattern: string | null;
  action: PolicyAction;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  teamId: string;
  envId: string;
  requestId: string;
  agentKeyId: string | null;
  agentLabel: string;
  toolName: string;
  logicalName: string | null;
  toolVersion: string | null;
  backendType: string | null;
  decision: AuditDecision;
  statusCode: number | null;
  latencyMs: number;
  redactionsJson: string;
  createdAt: Date;
}

// ============================================================
// API Request/Response Types
// ============================================================

// Invoke
export interface InvokeRequest {
  input?: Record<string, unknown>;
  params?: Record<string, string>;
  context?: Record<string, unknown>;
}

export interface RedactionSummary {
  type: string;
  count: number;
}

export interface InvokeSuccessResponse {
  ok: true;
  tool: string;
  output: unknown;
  meta: {
    requestId: string;
    latencyMs: number;
    redactions: RedactionSummary[];
    version?: string;
    backendType?: string;
  };
}

export interface InvokeErrorResponse {
  ok: false;
  error: {
    code: 'TOOL_NOT_FOUND' | 'UNAUTHORIZED' | 'UPSTREAM_ERROR' | 'RATE_LIMITED' | 'VALIDATION_ERROR' | 'MCP_ERROR';
    message: string;
  };
  meta: {
    requestId: string;
  };
}

export type InvokeResponse = InvokeSuccessResponse | InvokeErrorResponse;

export interface CreateToolDto {
  logicalName: string;
  version: string;
  displayName: string;
  type?: ToolType;
  method?: HttpMethod;
  urlTemplate: string;
  headersJson?: string;
  mcpToolName?: string;
  allowAllAgents?: boolean;
  allowedAgentIds?: string[];
  redactionEnabled?: boolean;
  isActive?: boolean;
}

export interface UpdateToolDto {
  displayName?: string;
  method?: HttpMethod;
  urlTemplate?: string;
  headersJson?: string;
  mcpToolName?: string;
  allowAllAgents?: boolean;
  allowedAgentIds?: string[];
  redactionEnabled?: boolean;
}

export interface ToolAgentAccess {
  id: string;
  agentKeyId: string;
  agentKeyName?: string;
}

export interface ToolResponse extends Omit<Tool, 'teamId'> {
  allowedAgents?: ToolAgentAccess[];
}

export interface CreateToolAliasDto {
  alias: string;
  logicalName: string;
}

export interface ToolAliasResponse extends Omit<ToolAlias, 'teamId'> {}

export interface CreateAuditWebhookDto {
  name: string;
  url: string;
  isEnabled?: boolean;
}

export interface AuditWebhookResponse extends Omit<AuditWebhook, 'teamId'> {}

// Agent Keys
export interface CreateAgentKeyDto {
  name: string;
}

export interface AgentKeyResponse extends Omit<AgentKey, 'teamId'> {}

export interface AgentKeyCreatedResponse extends AgentKeyResponse {
  plainKey: string; // Only shown once on creation
}

// Environment
export interface EnvironmentResponse extends Omit<Environment, 'teamId'> {}

export interface AuditLogResponse extends Omit<AuditLog, 'teamId' | 'redactionsJson'> {
  redactions: RedactionSummary[];
}

export interface AuditLogQuery {
  env?: string;
  tool?: string;
  logicalName?: string;
  decision?: AuditDecision;
  agentKeyId?: string;
  limit?: number;
}

// Tool Policy
export interface CreateToolPolicyDto {
  toolId: string;
  agentKeyId?: string;
  agentNamePattern?: string;
  action: PolicyAction;
}

export interface ToolPolicyResponse extends ToolPolicy {}

// ============================================================
// MCP Types
// ============================================================

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface MCPCallRequest {
  method: 'tools/call';
  params: {
    name: string;
    arguments: Record<string, unknown>;
  };
}

export interface MCPCallResponse {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

// ============================================================
// Utility Types
// ============================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export interface AuditWebhookPayload {
  requestId: string;
  timestamp: string;
  environment: string;
  agentName: string;
  toolName: string;
  logicalName: string | null;
  version: string | null;
  backendType: string | null;
  decision: AuditDecision;
  statusCode: number | null;
  latencyMs: number;
  redactionCount: number;
}
