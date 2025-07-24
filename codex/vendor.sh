#!/usr/bin/env bash
# Pre-download Python and Node dependencies for offline use.
set -e

# download Python wheels
mkdir -p vendor/python
pip download -r requirements.lock -d vendor/python

# package frontend node_modules
if command -v npm >/dev/null 2>&1; then
  mkdir -p vendor/npm
  (
    cd offline-llm-ui
    npm ci --no-audit --progress=false
    tar -czf ../vendor/npm/offline-llm-ui_node_modules.tar.gz node_modules
  )

  if [ -f package-lock.json ]; then
    npm ci --no-audit --progress=false
    tar -czf vendor/npm/root_node_modules.tar.gz node_modules
  fi
fi

echo "Dependencies cached under vendor/"
