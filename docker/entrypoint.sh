#!/usr/bin/env bash
set -euo pipefail

echo "🟢 Entrypoint started"

# wait for Ollama
until curl -sf http://ollama:11434/ping >/dev/null; do
  echo "⏳ waiting for Ollama…"
  sleep 1
done

ls -l /app/app
gosu llm whoami
# …etc…

exec gosu llm uvicorn app.api:app --host 0.0.0.0 --port 8000
