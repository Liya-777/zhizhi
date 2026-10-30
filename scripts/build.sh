#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND="$ROOT/frontend"
BACKEND_STATIC="$ROOT/backend/app/static"

echo "==> Building frontend..."
cd "$FRONTEND"

# Install deps if needed
if [ ! -d "node_modules" ]; then
  echo "  -> Installing npm dependencies..."
  npm install
fi

echo "  -> Running vite build..."
npm run build

# Copy to backend static
echo "==> Copying to backend/app/static/"
rm -rf "$BACKEND_STATIC"
mkdir -p "$BACKEND_STATIC"
cp -r dist/* "$BACKEND_STATIC/"

# Move root-level image assets (logo.png, QR, favicon etc.) into assets/.
# Backend StaticFiles only mounts /assets/ — root-level files hit the SPA
# catch-all fallback and return index.html.
shopt -s nullglob
for f in "$BACKEND_STATIC"/*.png "$BACKEND_STATIC"/*.jpg "$BACKEND_STATIC"/*.jpeg "$BACKEND_STATIC"/*.svg "$BACKEND_STATIC"/*.ico "$BACKEND_STATIC"/*.webp; do
  mv "$f" "$BACKEND_STATIC/assets/" 2>/dev/null || true
done
shopt -u nullglob

echo ""
echo "✅ Build complete!"
echo "   Static files: $BACKEND_STATIC"
echo "   Run: uvicorn app.main:app --reload"
echo "   Open: http://localhost:8000"
