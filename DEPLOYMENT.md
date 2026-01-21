# Deploying to Railway

## Prerequisites

- Railway account (https://railway.app)
- GitHub repository connected to Railway

## Services to Create

Create 3 services in your Railway project:

### 1. PostgreSQL Database
- Add a PostgreSQL database from the Railway dashboard
- Railway automatically provides `DATABASE_URL`

### 2. API Service
- **Root Directory:** `/` (project root)
- **Dockerfile Path:** `Dockerfile.api`

**Environment Variables:**
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
ADMIN_KEY=<generate-a-secure-key>
APP_URL=https://<your-web-service>.up.railway.app
RESEND_API_KEY=<your-resend-api-key>
EMAIL_FROM=Entrys <noreply@entrys.co>
NODE_ENV=production
PORT=3001
```

### 3. Web Service
- **Root Directory:** `/` (project root)
- **Dockerfile Path:** `Dockerfile.web`

**Environment Variables:**
```
NUXT_API_URL=https://<api-service>.up.railway.app
NUXT_PUBLIC_API_URL=https://<api-service>.up.railway.app
NUXT_ADMIN_KEY=<same-as-api-admin-key>
NODE_ENV=production
PORT=3000
```