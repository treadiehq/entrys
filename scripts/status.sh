#!/bin/bash

# entrys - Status Script
# Shows the status of all services

echo "📊 entrys Status"
echo "============================================"
echo ""

# Check PostgreSQL
echo "📦 PostgreSQL (Docker):"
if docker ps --format "{{.Names}}" | grep -q "entrys-postgres"; then
  STATUS=$(docker ps --filter "name=entrys-postgres" --format "{{.Status}}")
  echo "   ✓ Running - $STATUS"
  echo "   → Port: 5433"
else
  echo "   ✗ Not running"
fi
echo ""

# Check API
echo "🔧 API Server:"
if curl -s http://localhost:3001/v1/envs -H "x-admin-key: admin_dev_secret_key_change_in_prod" > /dev/null 2>&1; then
  echo "   ✓ Running"
  echo "   → http://localhost:3001"
  if [ -f /tmp/entrys-api.pid ]; then
    echo "   → PID: $(cat /tmp/entrys-api.pid)"
  fi
else
  echo "   ✗ Not running"
fi
echo ""

# Check Web
echo "🌐 Web Server:"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo "   ✓ Running"
  echo "   → http://localhost:3000"
  if [ -f /tmp/entrys-web.pid ]; then
    echo "   → PID: $(cat /tmp/entrys-web.pid)"
  fi
else
  echo "   ✗ Not running"
fi
echo ""
echo "============================================"
