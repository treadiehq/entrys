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
NUXT_API_URL=http://<api-service>.railway.internal:3001
NUXT_PUBLIC_API_URL=https://<api-service>.up.railway.app
NUXT_ADMIN_KEY=<same-as-api-admin-key>
NODE_ENV=production
PORT=3000
```

## Deployment Steps

1. **Connect GitHub repo** to Railway project

2. **Add PostgreSQL** database service

3. **Create API service:**
   - Click "New Service" → "GitHub Repo"
   - Set root directory to `apps/api`
   - Add environment variables (see above)
   - Deploy

4. **Run database migrations** (one-time):
   ```bash
   # In Railway CLI or service shell
   pnpm exec prisma migrate deploy
   ```

5. **Create Web service:**
   - Click "New Service" → "GitHub Repo"  
   - Set root directory to `apps/web`
   - Add environment variables (see above)
   - Deploy

6. **Configure domains:**
   - Generate public domains for both services
   - Update `APP_URL` in API to point to web domain
   - Update `NUXT_PUBLIC_API_URL` in web to point to API domain

## Environment Variables Reference

### API (`apps/api`)
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `${{Postgres.DATABASE_URL}}` |
| `ADMIN_KEY` | Secret key for admin API access | `admin_prod_xxxx` |
| `APP_URL` | Public web app URL (for magic links) | `https://entrys.up.railway.app` |
| `RESEND_API_KEY` | Resend API key for emails | `re_xxxx` |
| `EMAIL_FROM` | From address for emails | `Entrys <noreply@entrys.co>` |
| `PORT` | Server port | `3001` |

### Web (`apps/web`)
| Variable | Description | Example |
|----------|-------------|---------|
| `NUXT_API_URL` | Internal API URL (Railway networking) | `http://api.railway.internal:3001` |
| `NUXT_PUBLIC_API_URL` | Public API URL | `https://api.entrys.up.railway.app` |
| `NUXT_ADMIN_KEY` | Same as API's ADMIN_KEY | `admin_prod_xxxx` |
| `PORT` | Server port | `3000` |

## Railway CLI Commands

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Deploy
railway up

# Run migrations
railway run pnpm --filter @entrys/api exec prisma migrate deploy

# View logs
railway logs
```

## Troubleshooting

### Database connection issues
- Ensure `DATABASE_URL` is correctly set from Railway Postgres
- Check if migrations have been run

### Magic links not working
- Verify `APP_URL` points to correct web domain
- Check `RESEND_API_KEY` is valid
- Check Railway logs for email errors

### API calls failing from web
- Ensure `NUXT_API_URL` uses Railway internal networking
- Verify `NUXT_ADMIN_KEY` matches `ADMIN_KEY`
