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

# Only remove cache folders. Do not delete Bun's package store or nested React
# packages directly, because package symlinks may point there.
rm -rf node_modules/.vite node_modules/.vite-temp .vite-temp node_modules/.cache .swc \
  tsconfig.tsbuildinfo tsconfig.app.tsbuildinfo tsconfig.node.tsbuildinfo 2>/dev/null || true
find node_modules -type d -name ".vite" -prune -exec rm -rf {} + 2>/dev/null || true

repair_cmd=()
if [[ -f package-lock.json ]]; then
  repair_cmd=(npm install --no-fund --no-audit)
elif [[ -f bun.lockb || -f bun.lock ]]; then
  repair_cmd=(bun install)
fi

if ! node -e "require.resolve('react'); require.resolve('react-dom'); require.resolve('react-dom/client')" >/dev/null 2>&1; then
  echo "🔧 Detected broken React dependency links. Restoring dependencies ..."
  rm -f node_modules/react node_modules/react-dom 2>/dev/null || true
  if [[ ${#repair_cmd[@]} -eq 0 ]]; then
    echo "❌ No lockfile found, so dependencies could not be restored automatically."
    exit 1
  fi
  "${repair_cmd[@]}"
fi

node -e "require.resolve('react'); require.resolve('react-dom'); require.resolve('react-dom/client')" >/dev/null

echo "✅ Cache purge complete."

if [[ "${1:-}" == "--no-dev" ]]; then
  echo "Skipping dev server start (--no-dev)."
  exit 0
fi

echo "🚀 Starting Vite dev server ..."
exec npm run dev
