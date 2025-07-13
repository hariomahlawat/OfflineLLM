#!/usr/bin/env bash
set -e

# ------------------------------------------------------------------
# create the two writable volumes (first run only)
# ------------------------------------------------------------------
mkdir -p /app/data/chroma            # vector-DB
mkdir -p /app/data/chroma_persist    # persisted RAG index

# hand ownership to the non-root user
chown -R llm:llm /app/data 2>/dev/null || true

# ------------------------------------------------------------------
# index PDFs (if any) before launching the app
# ------------------------------------------------------------------
until curl -sf "$OLLAMA_HOST/api/tags" >/dev/null; do
  echo "waiting for Ollama…"
  sleep 1
done
echo "Ollama is up!"

gosu llm python -m app.boot

# ------------------------------------------------------------------
# drop privileges and launch Uvicorn
# ------------------------------------------------------------------

exec gosu llm uvicorn app.api:app --host 0.0.0.0 --port 8000 --workers 1

