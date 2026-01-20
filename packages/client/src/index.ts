import type { InvokeResponse, InvokeSuccessResponse, InvokeErrorResponse } from '@entrys/shared';

// Re-export types for convenience
export type { InvokeResponse, InvokeSuccessResponse, InvokeErrorResponse } from '@entrys/shared';

/**
 * Configuration options for Entry
 */
export interface EntryOptions {
  /** API key for authentication (starts with "ent_") */
  apiKey: string;
  /** Base URL of the entrys gateway (e.g., "https://api.yourproduct.com") */
  baseUrl: string;
  /** Optional custom fetch implementation (for testing or custom environments) */
  fetch?: typeof fetch;
}

/**
 * Options for invoking a tool
 */
export interface InvokeOptions {
  /** URL path parameters (e.g., { id: "123" } for /customers/{{id}}) */
  params?: Record<string, string>;
  /** Request body/input data */
  input?: Record<string, unknown>;
  /** Additional context passed to the tool */
  context?: Record<string, unknown>;
}

/**
 * Metadata returned with successful invocations
 */
export interface InvokeMeta {
  requestId: string;
  latencyMs: number;
  redactions: Array<{ type: string; count: number }>;
}

/**
 * Error thrown when a tool invocation fails
 */
export class EntryError extends Error {
  code: string;
  requestId: string;

  constructor(code: string, message: string, requestId: string) {
    super(message);
    this.name = 'EntryError';
    this.code = code;
    this.requestId = requestId;
  }
}

/**
 * entrys client for invoking tools
 * 
 * @example
 * ```typescript
 * import { Entry } from "@entrys/client";
 * 
 * const entry = new Entry({
 *   apiKey: process.env.AGENT_API_KEY,
 *   baseUrl: "https://api.yourproduct.com"
 * });
 * 
 * const customer = await entry.invoke("get_customer", {
 *   params: { id: "123" }
 * });
 * ```
 */
export class Entry {
  private baseUrl: string;
  private apiKey: string;
  private fetchFn: typeof fetch;

  constructor(options: EntryOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = options.apiKey;
    this.fetchFn = options.fetch ?? fetch;
  }

  /**
   * Invoke a registered tool through the gateway
   * 
   * @param toolName - The name of the tool to invoke (e.g., "get_customer")
   * @param options - Parameters, input data, and context for the tool
   * @returns The tool output (with PII automatically redacted)
   * @throws {EntryError} If the tool invocation fails
   * 
   * @example
   * ```typescript
   * const customer = await agent.invoke("get_customer", {
   *   params: { id: "123" }
   * });
   * ```
   */
  async invoke<T = unknown>(
    toolName: string,
    options?: InvokeOptions
  ): Promise<T> {
    const result = await this.invokeWithMeta<T>(toolName, options);
    return result.output;
  }

  /**
   * Invoke a tool and return both output and metadata
   * 
   * @example
   * ```typescript
   * const { output, meta } = await agent.invokeWithMeta("get_customer", {
   *   params: { id: "123" }
   * });
   * console.log(meta.redactions); // PII that was scrubbed
   * ```
   */
  async invokeWithMeta<T = unknown>(
    toolName: string,
    options?: InvokeOptions
  ): Promise<{ output: T; meta: InvokeMeta }> {
    const url = `${this.baseUrl}/v1/invoke/${encodeURIComponent(toolName)}`;

    const body: Record<string, unknown> = {};
    if (options?.params) body.params = options.params;
    if (options?.input) body.input = options.input;
    if (options?.context) body.context = options.context;

    const response = await this.fetchFn(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json() as InvokeResponse;

    if (!data.ok) {
      const errorResult = data as InvokeErrorResponse;
      throw new EntryError(
        errorResult.error.code,
        errorResult.error.message,
        errorResult.meta.requestId
      );
    }

    const successResult = data as InvokeSuccessResponse;
    return {
      output: successResult.output as T,
      meta: successResult.meta,
    };
  }

  /**
   * Invoke a tool and return the raw response (including error responses)
   * Use this if you want to handle errors yourself instead of catching exceptions
   */
  async invokeRaw(
    toolName: string,
    options?: InvokeOptions
  ): Promise<InvokeResponse> {
    const url = `${this.baseUrl}/v1/invoke/${encodeURIComponent(toolName)}`;

    const body: Record<string, unknown> = {};
    if (options?.params) body.params = options.params;
    if (options?.input) body.input = options.input;
    if (options?.context) body.context = options.context;

    const response = await this.fetchFn(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
      },
      body: JSON.stringify(body),
    });

    return await response.json() as InvokeResponse;
  }
}

// Legacy aliases for backward compatibility
export const createClient = (options: EntryOptions) => new Entry(options);
export const AgentGateway = Entry; // Backward compatibility
export type AgentGatewayOptions = EntryOptions; // Backward compatibility
export const AgentGatewayError = EntryError; // Backward compatibility
export const ATGError = EntryError; // Legacy alias

// Default export
export default Entry;
