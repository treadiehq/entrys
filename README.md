# Entrys

Give your AI agents a single entry point to access internal APIs and tools. Redact PII by default, audit every request, and control access, without modifying your existing services.

## Quick Start

```bash
# Initial setup (one-time)
pnpm setup

# Run all services
pnpm up
```

- **Dashboard**: http://localhost:3000
- **API**: http://localhost:3001

## SDK

```typescript
import { Entry } from "@entrys/client";

const entry = new Entry({
  apiKey: process.env.AGENT_API_KEY,
  baseUrl: "http://localhost:3001"
});

const customer = await entry.invoke("get_customer", {
  params: { id: "123" }
});
// { name: "Jane Doe", email: "[REDACTED]", ... }
```

See [packages/client/README.md](packages/client/README.md) for full SDK docs.

## API

```bash
curl -X POST "http://localhost:3001/v1/invoke/echo_httpbin" \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_AGENT_KEY" \
  -d '{"input": {"message": "Hello", "email": "user@example.com"}}'
```

```json
{
  "ok": true,
  "output": { "message": "Hello", "email": "[REDACTED]" },
  "meta": { "latencyMs": 234, "redactions": [{ "type": "email", "count": 1 }] }
}
```

## Features

- **Tool Versioning** - Multiple versions per tool, activate/deactivate without changing agent code
- **PII Redaction** - Automatic scrubbing of emails, tokens, SSNs, API keys
- **Audit Log** - Full request history with redaction summaries
- **Access Control** - Per-agent tool permissions
- **Rate Limiting** - 60 req/min per agent/tool

## Environment

Create `.env` files:

**apps/api/.env**
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/entrys?schema=public"
ADMIN_KEY="your-admin-key"
```

**apps/web/.env**
```
NUXT_API_URL="http://localhost:3001"
NUXT_ADMIN_KEY="your-admin-key"
NUXT_PUBLIC_API_URL="http://localhost:3001"
```

## Scripts

```bash
pnpm setup    # Initial setup (database, dependencies, schema)
pnpm up       # Start all services (Docker + API + Web)
pnpm down     # Stop all services
pnpm reboot   # Restart all services
pnpm status   # Check service status
```

## License

MIT
