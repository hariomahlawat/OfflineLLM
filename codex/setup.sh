#!/usr/bin/env bash
set -e
python -m pip install --upgrade pip
if [ -d vendor/python ] && [ "$(ls -A vendor/python)" ]; then
  echo "Installing Python packages from vendored wheels"
  pip install --no-index --find-links=vendor/python -r requirements.lock
else
  pip install -r requirements.lock
fi

# install frontend/node dependencies if npm is available
if command -v npm >/dev/null 2>&1; then
  echo "Installing frontend dependencies"
  (
    cd offline-llm-ui
    if [ -d node_modules ]; then
      echo "Found existing node_modules; skipping npm ci"
    else
      npm ci --no-audit --progress=false || \
        echo "npm install failed - ensure internet access or cached packages"
    fi
  )
  # root Node packages (used for tests/lint)
  if [ -f package-lock.json ]; then
    if [ -d node_modules ]; then
      echo "Found existing root node_modules; skipping npm ci"
    else
      npm ci --no-audit --progress=false || \
        echo "npm install failed - ensure internet access or cached packages"
    fi
  fi
else
  echo "npm not found; skipping frontend dependencies"
fi
