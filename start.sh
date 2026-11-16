#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
node bootstrap.mjs
exec node index.js
