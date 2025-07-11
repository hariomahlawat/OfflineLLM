# /app/entrypoint.sh  (excerpt)

until curl -sf http://ollama:11434/api/tags >/dev/null; do
  echo "⏳ waiting for Ollama..."
  sleep 2
done

echo "✅ Ollama is up"
exec gosu llm uvicorn app.main:app --host 0.0.0.0 --port 8000
