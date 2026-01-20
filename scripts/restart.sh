#!/bin/bash

# entrys - Restart Script
# Stops and starts all servers

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔄 Restarting entrys..."
echo ""

# Stop all services
"$SCRIPT_DIR/stop.sh"

echo ""
echo "⏳ Waiting for cleanup..."
sleep 3

# Verify ports are free before starting
if lsof -ti:3000 >/dev/null 2>&1 || lsof -ti:3001 >/dev/null 2>&1; then
  echo "⚠️  Ports still in use, forcing cleanup..."
  lsof -ti:3000 | xargs kill -9 2>/dev/null || true
  lsof -ti:3001 | xargs kill -9 2>/dev/null || true
  sleep 2
fi

# Start all services
"$SCRIPT_DIR/start.sh"
