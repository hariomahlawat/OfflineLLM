#!/usr/bin/env bash
set -euo pipefail

echo "📦 Setting up OfflineLLM development environment…"

# 1) Python
if [ ! -d ".venv" ]; then
  echo "🔧 Creating Python venv…"
  python3 -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.lock

# 2) Node (React frontend)
echo "🔧 Installing Node.js deps in ./offline-llm-ui…"
pushd offline-llm-ui >/dev/null
npm ci
popd >/dev/null

# 3) Optional: create HTTPS certs for Vite
if command -v mkcert >/dev/null 2>&1; then
  echo "🔐 Generating local certs with mkcert…"
  mkdir -p offline-llm-ui/certs
  mkcert -install
  mkcert -cert-file offline-llm-ui/certs/localhost.pem -key-file offline-llm-ui/certs/localhost-key.pem localhost 127.0.0.1 ::1
  echo "✅ Certs in offline-llm-ui/certs/"
else
  echo "⚠️  mkcert not found; skipping HTTPS cert generation"
fi

echo "🎉 Setup complete! Run 'source .venv/bin/activate' and then your usual npm / Docker commands."
