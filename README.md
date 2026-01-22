# Entrys

Give your AI agents a single entry point to access internal APIs and tools. Redact PII by default, audit every request, and control access, without modifying your existing services.

**[Try Entrys Cloud →](https://entrys.co)**

## Quick Start

```bash
# Initial setup (one-time)
pnpm setup

# Run all services
pnpm run up
```

- **Dashboard**: http://localhost:3000
- **API**: http://localhost:3001

## SDK

```bash
npm install @entrys/client
```

By default, the SDK connects to [entrys.co](https://entrys.co). For self-hosted deployments, see below.

```typescript
import Entry from "@entrys/client";

const entry = new Entry({
  apiKey: process.env.ENTRYS_API_KEY
});

const customer = await entry.invoke("get_customer", {
  params: { id: "123" }
});
// { name: "Jane Doe", email: "[REDACTED]", ... }
```

For self-hosted deployments, also pass `baseUrl`:

```typescript
const entry = new Entry({
  apiKey: process.env.ENTRYS_API_KEY,
  baseUrl: "http://localhost:3001"
});
```

See [packages/client/README.md](packages/client/README.md) for full SDK docs.

## API

```bash
curl -X POST "https://api.entrys.co/v1/invoke/get_customer" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $ENTRYS_API_KEY" \
  -d '{"params": {"id": "123"}}'
```

```json
{
  "ok": true,
  "output": { "name": "Jane Doe", "email": "[REDACTED]" },
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
pnpm setup      # Initial setup (database, dependencies, schema)
pnpm run up     # Start all services (Docker + API + Web)
pnpm run down   # Stop all services
pnpm run reboot # Restart all services
pnpm run status # Check service status
```

## License

[FSL-1.1-MIT](LICENSE)
