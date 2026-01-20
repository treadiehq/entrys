# @entrys/client

TypeScript client SDK for Entrys.

## Installation

```bash
npm install @entrys/client
# or
pnpm add @entrys/client
```

## Usage

```typescript
import { Entry } from "@entrys/client";

const entry = new Entry({
  apiKey: process.env.AGENT_API_KEY,
  baseUrl: "https://api.yourproduct.com"
});

const customer = await entry.invoke("get_customer", {
  params: { id: "123" }
});

console.log(customer);
// { name: "Jane Doe", email: "[REDACTED]", ... }
```

## API

### `new Entry(options)`

Create a new entrys client.

**Options:**
- `apiKey` (string) - Your agent API key (starts with `ent_`)
- `baseUrl` (string) - Base URL of your entrys gateway
- `fetch` (optional) - Custom fetch implementation

### `agent.invoke(toolName, options?)`

Invoke a registered tool through the gateway. Returns the output directly.

**Parameters:**
- `toolName` (string) - Name of the tool to invoke
- `options.params` (object) - URL path parameters
- `options.input` (object) - Request body data
- `options.context` (object) - Additional context

**Returns:** `Promise<T>` - The tool output (with PII automatically redacted)

**Throws:** `EntryError` on failure

```typescript
const customer = await entry.invoke("get_customer", {
  params: { id: "123" }
});

const invoice = await entry.invoke("get_invoice", {
  params: { customerId: "123" }
});
```

### `agent.invokeWithMeta(toolName, options?)`

Same as `invoke` but also returns metadata including redaction info.

```typescript
const { output, meta } = await entry.invokeWithMeta("get_customer", {
  params: { id: "123" }
});

console.log(meta.requestId);   // Unique request ID
console.log(meta.latencyMs);   // Request latency
console.log(meta.redactions);  // [{ type: "email", count: 1 }]
```

### `agent.invokeRaw(toolName, options?)`

Returns the raw response without throwing on errors. Useful if you want to handle errors yourself.

## Error Handling

```typescript
import { Entry, EntryError } from "@entrys/client";

try {
  await entry.invoke("get_customer", { params: { id: "123" } });
} catch (err) {
  if (err instanceof EntryError) {
    console.log(err.code);      // 'TOOL_NOT_FOUND', 'UNAUTHORIZED', etc.
    console.log(err.message);   // Human-readable message
    console.log(err.requestId); // For debugging
  }
}
```

## Error Codes

- `TOOL_NOT_FOUND` - Tool doesn't exist in this environment
- `UNAUTHORIZED` - Agent not authorized for this tool
- `RATE_LIMITED` - Rate limit exceeded (60 req/min)
- `VALIDATION_ERROR` - Invalid parameters
- `UPSTREAM_ERROR` - The upstream API returned an error
