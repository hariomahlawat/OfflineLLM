#!/usr/bin/env bash
set -euo pipefail

# Ensure any Docker volumes under /app/data are writable by llm
chown -R llm:llm /app/data || true     # ← add this line

exec gosu llm uvicorn app.api:app --host 0.0.0.0 --port 8000

