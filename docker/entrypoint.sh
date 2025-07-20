#!/usr/bin/env bash
set -e

# ------------------------------------------------------------------
# create the two writable volumes (first run only)
# ------------------------------------------------------------------
mkdir -p /app/data/chroma
mkdir -p /app/data/chroma_persist

# hand ownership to the non-root user
chown -R llm:llm /app/data 2>/dev/null || true

# ------------------------------------------------------------------
# wait for Ollama to be ready
# ------------------------------------------------------------------
until curl -sf "$OLLAMA_HOST/api/tags" >/dev/null; do
  echo "⌛ waiting for Ollama…"
  sleep 1
done
echo "✅ Ollama is up!"

# ------------------------------------------------------------------
# optional boot indexing
# ------------------------------------------------------------------
SKIP_BOOT_INDEXING="${SKIP_BOOT_INDEXING:-0}"
if [ "$SKIP_BOOT_INDEXING" != "1" ]; then
  echo "📚  running boot indexing"
  # errors are caught inside app/boot.py, so this always returns zero
  gosu llm python -m app.boot
else
  echo "📚  boot indexing skipped via SKIP_BOOT_INDEXING=1"
fi

# ------------------------------------------------------------------
# drop privileges and launch Uvicorn
# ------------------------------------------------------------------
exec gosu llm uvicorn app.api:app --host 0.0.0.0 --port 8000 --workers 1
