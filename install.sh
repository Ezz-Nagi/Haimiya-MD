#!/bin/bash
set -e
cd "$(dirname "$0")"
echo "[Haimiya] Instalación completa…"
rm -rf node_modules package-lock.json 2>/dev/null || true
npm install --no-audit --no-fund
node bootstrap.mjs
echo "[Haimiya] Listo. Arranca con: npm start"
