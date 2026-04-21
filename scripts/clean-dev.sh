#!/usr/bin/env bash
# clean-dev.sh
# Purges duplicate Bun/NPM caches that cause TS2769 / duplicate-React errors,
# then restarts the Vite dev server with a fresh dep-optimizer cache.
#
# Usage:
#   bash scripts/clean-dev.sh           # clean + start dev server
#   bash scripts/clean-dev.sh --no-dev  # just clean, don't start
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "🧹 Cleaning duplicate Bun/NPM caches in $ROOT ..."

# 1. Vite dep-optimizer cache (root + nested)
rm -rf node_modules/.vite node_modules/.vite-temp 2>/dev/null || true
find node_modules -type d -name ".vite" -prune -exec rm -rf {} + 2>/dev/null || true

# 2. Bun's hoisted duplicate of vite (the main TS2769 culprit)
rm -rf node_modules/.bun 2>/dev/null || true

# 3. Duplicate React installations under nested node_modules
find node_modules -mindepth 2 -type d \
  \( -name "react" -o -name "react-dom" \) \
  -prune -exec rm -rf {} + 2>/dev/null || true

# 4. TS / SWC build caches
rm -rf node_modules/.cache .swc tsconfig.tsbuildinfo 2>/dev/null || true

echo "✅ Cache purge complete."

if [[ "${1:-}" == "--no-dev" ]]; then
  echo "Skipping dev server start (--no-dev)."
  exit 0
fi

echo "🚀 Starting Vite dev server ..."
exec npm run dev
