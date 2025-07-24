#!/usr/bin/env bash
set -e
python -m pip install --upgrade pip
pip install -r requirements.lock

# install frontend/node dependencies if npm is available
if command -v npm >/dev/null 2>&1; then
  echo "Installing frontend dependencies"
  (
    cd offline-llm-ui
    # use npm ci for reproducible installs; fall back gracefully if offline
    npm ci --no-audit --progress=false || \
      echo "npm install failed - ensure internet access or cached packages"
  )
  # root Node packages (used for tests/lint)
  if [ -f package-lock.json ]; then
    npm ci --no-audit --progress=false || \
      echo "npm install failed - ensure internet access or cached packages"
  fi
else
  echo "npm not found; skipping frontend dependencies"
fi
