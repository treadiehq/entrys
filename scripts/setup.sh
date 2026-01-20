#!/bin/bash

# entrys - Setup Script
# Initial setup: database, dependencies, and schema

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "🔧 Setting up entrys..."
echo ""

# Step 1: Start database
echo "📦 Starting PostgreSQL (Docker)..."
if ! command -v docker &> /dev/null; then
  echo "   ❌ Docker is not installed or not running"
  exit 1
fi
docker compose up -d
echo "   ✓ PostgreSQL started on port 5433"

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
  if docker exec entrys-postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "   ✓ PostgreSQL is ready"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "   ⚠️  PostgreSQL may not be ready, continuing anyway..."
    echo "   (This is OK if the container was already running)"
  fi
  sleep 1
done

# Step 2: Install dependencies
echo ""
echo "📥 Installing dependencies..."
if ! command -v pnpm &> /dev/null; then
  echo "   ❌ pnpm is not installed. Please install it first:"
  echo "      npm install -g pnpm"
  exit 1
fi
pnpm install
echo "   ✓ Dependencies installed"

# Step 3: Build shared package
echo ""
echo "🔨 Building shared package..."
pnpm --filter @entrys/shared build
echo "   ✓ Shared package built"

# Step 4: Setup database
echo ""
echo "🗄️  Setting up database..."
echo "   Generating Prisma client..."
pnpm db:generate
echo "   Pushing schema..."
pnpm db:push
echo "   Seeding database..."
pnpm db:seed
echo "   ✓ Database setup complete"

echo ""
echo "============================================"
echo "✅ Setup complete!"
echo "============================================"
echo ""
echo "   Next steps:"
echo "     pnpm up       # Start all services"
echo "     pnpm dev      # Start in development mode"
echo ""
echo "============================================"
