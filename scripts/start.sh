#!/bin/bash

# entrys - Start Script
# Starts PostgreSQL (Docker), API, and Web servers

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "🚀 Starting entrys..."
echo ""

# First, ensure ports are free
echo "🔍 Checking ports..."
if lsof -ti:3000 >/dev/null 2>&1; then
  echo "   ⚠️  Port 3000 in use, killing process..."
  lsof -ti:3000 | xargs kill -9 2>/dev/null || true
  sleep 1
fi
if lsof -ti:3001 >/dev/null 2>&1; then
  echo "   ⚠️  Port 3001 in use, killing process..."
  lsof -ti:3001 | xargs kill -9 2>/dev/null || true
  sleep 1
fi
echo "   ✓ Ports 3000 and 3001 are free"

# Start PostgreSQL
echo "📦 Starting PostgreSQL (Docker)..."
docker compose up -d
echo "   ✓ PostgreSQL started on port 5433"

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
  if docker exec entrys-postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "   ✓ PostgreSQL is ready"
    break
  fi
  sleep 1
done

# Start API server in background
echo "🔧 Starting API server..."
cd "$PROJECT_ROOT/apps/api"
pnpm dev > /tmp/entrys-api.log 2>&1 &
API_PID=$!
echo $API_PID > /tmp/entrys-api.pid
echo "   ✓ API server starting (PID: $API_PID, logs: /tmp/entrys-api.log)"

# Wait for API to be ready
echo "⏳ Waiting for API to be ready..."
for i in {1..30}; do
  if curl -s http://localhost:3001/v1/envs -H "x-admin-key: admin_dev_secret_key_change_in_prod" > /dev/null 2>&1; then
    echo "   ✓ API is ready on http://localhost:3001"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "   ⚠️  API may not be ready, check logs: tail -f /tmp/entrys-api.log"
  fi
  sleep 1
done

# Start Web server in background
echo "🌐 Starting Web server..."
cd "$PROJECT_ROOT/apps/web"
pnpm dev > /tmp/entrys-web.log 2>&1 &
WEB_PID=$!
echo $WEB_PID > /tmp/entrys-web.pid
echo "   ✓ Web server starting (PID: $WEB_PID, logs: /tmp/entrys-web.log)"

# Wait for Web to be ready
echo "⏳ Waiting for Web to be ready..."
for i in {1..30}; do
  if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "   ✓ Web is ready on http://localhost:3000"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "   ⚠️  Web may not be ready, check logs: tail -f /tmp/entrys-web.log"
  fi
  sleep 1
done

echo ""
echo "============================================"
echo "🎉 entrys is running!"
echo "============================================"
echo ""
echo "   Frontend:  http://localhost:3000"
echo "   API:       http://localhost:3001"
echo "   Database:  postgresql://localhost:5433/entrys"
echo ""
echo "   Logs:"
echo "     API: tail -f /tmp/entrys-api.log"
echo "     Web: tail -f /tmp/entrys-web.log"
echo ""
echo "   Stop: ./scripts/stop.sh"
echo "============================================"
