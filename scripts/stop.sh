#!/bin/bash

# entrys - Stop Script
# Stops all servers and Docker containers

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "🛑 Stopping entrys..."
echo ""

# Kill by ports FIRST (most reliable)
echo "🌐 Clearing port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

echo "🔧 Clearing port 3001..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Wait for ports to be released
sleep 2

# Kill any remaining node processes related to this project
echo "🔪 Killing remaining entrys processes..."
ps aux | grep -E "entrys.*(node|nuxt|nest)" | grep -v grep | grep -v "stop.sh" | grep -v "restart.sh" | awk '{print $2}' | while read pid; do
  kill -9 "$pid" 2>/dev/null || true
done

# Clean up PID files
rm -f /tmp/entrys-web.pid /tmp/entrys-api.pid

# Stop PostgreSQL
echo "📦 Stopping PostgreSQL (Docker)..."
docker compose down 2>/dev/null || true
echo "   ✓ PostgreSQL stopped"

# Clean up log files
rm -f /tmp/entrys-api.log /tmp/entrys-web.log

# Final check - wait and force kill if ports still in use
sleep 1
if lsof -ti:3000 >/dev/null 2>&1; then
  echo "⚠️  Port 3000 still in use, force killing..."
  lsof -ti:3000 | xargs kill -9 2>/dev/null || true
fi
if lsof -ti:3001 >/dev/null 2>&1; then
  echo "⚠️  Port 3001 still in use, force killing..."
  lsof -ti:3001 | xargs kill -9 2>/dev/null || true
fi

# Wait for final cleanup
sleep 1

echo ""
echo "============================================"
echo "✅ entrys stopped"
echo "============================================"
