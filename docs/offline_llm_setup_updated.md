
# 🧠 Offline LLM Setup with Docker Compose

This guide documents the setup steps and considerations for deploying a local LLM-powered RAG (Retrieval-Augmented Generation) system using Docker Compose.

## ✅ Initial Setup

```bash
# Make sure Docker and Docker Compose are installed
docker --version
docker compose version
```

## 📁 Project Structure

```
offline-llm/
│
├── docker/
│   ├── Dockerfile.backend
│   └── Dockerfile.frontend
│
├── app/
│   ├── main.py
│   ├── vector_store.py
│   └── api.py
│
├── compose.yaml
└── requirements.in
```

## ⚙️ Build & Run

```bash
docker compose build --no-cache
docker compose up -d
```

## 🛠️ Common Debugging Tips

- **RAG app fails to start due to permissions**:
  Ensure `data/chroma_sessions` and similar folders are writable or use volume mounts correctly.

- **Model errors like temperature or wrong format**:
  Ensure you are using compatible versions of the `ollama` and `langchain` libraries.

## 🧠 Embedding Model Required

The vector store (Chroma) uses the `nomic-embed-text` model from Ollama for embedding queries and documents.

### Why It Matters

If this model is missing, you will see a `500 Internal Server Error` when calling the `/doc_qa` or `/session_qa` endpoints. The logs will show:

```
ValueError: Error raised by inference API HTTP code: 404, {"error":"model \"nomic-embed-text\" not found, try pulling it first"}
```

### ✅ How to Fix

Manually pull the model **once**:

```bash
docker compose exec ollama ollama pull nomic-embed-text
```

Or automate the pull inside your `docker-compose.yaml`:

```yaml
command: >
  /bin/sh -c "
    ollama pull nomic-embed-text || true &&
    /bin/ollama serve
  "
```

Once pulled, the model is stored in the `ollama_models` volume and does not need to be pulled again unless volumes are deleted.
