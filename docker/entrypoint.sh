#!/usr/bin/env bash
set -euo pipefail

echo "🟢 Entrypoint started"
ls -l /app/app
whoami
gosu llm whoami
gosu llm ls -l /app/app

exec gosu llm uvicorn app.api:app --host 0.0.0.0 --port 8000
