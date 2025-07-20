# OfflineLLM RAG App: Setup, Troubleshooting & Smoke Test Guide

A comprehensive step-by-step guide to reproducing, troubleshooting, and verifying the OfflineLLM RAG app setup—especially after moving to a new machine or reinstalling Docker.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Cloning & Building](#cloning--building)
3. [Docker Compose Configuration](#docker-compose-configuration)
4. [Pulling & Running Ollama](#pulling--running-ollama)
5. [Starting the RAG App](#starting-the-rag-app)
6. [Verifying Service Health](#verifying-service-health)
7. [Pulling Models in Ollama](#pulling-models-in-ollama)
8. [API Endpoints Overview](#api-endpoints-overview)
9. [PowerShell Smoke Tests](#powershell-smoke-tests)
10. [Common Pitfalls & Fixes](#common-pitfalls--fixes)
11. [Session Lifecycle](#session-lifecycle)
12. [Troubleshooting Tips](#troubleshooting-tips)

---

## Prerequisites

- **Docker Desktop** (ensure it’s installed and running)
- **Git** (to clone the repository)
- **Windows PowerShell** (tested syntax)
- Sufficient disk space for model downloads (~5 GB+)
- **ffmpeg** and the `openai-whisper` Python package (install manually via `pip install openai-whisper`) for speech-to-text

---

## Cloning & Building

```powershell
# 1. Clone the repo
git clone https://github.com/your-org/OfflineLLM.git
cd OfflineLLM

# 2. Switch to the main branch (if needed)
git checkout main
```

---

## Docker Compose Configuration

Your `compose.yaml` defines **three** services (`ollama`, `rag-app`, and `frontend`) on a shared network (`rag-net`).
It also declares a `chroma_persist` volume and environment variables for model tuning:

```yaml
services:
  ollama:
    image: ollama/ollama:latest
    container_name: ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_models:/root/.ollama
    networks:
      rag-net:
        aliases:
          - ollama

  rag-app:
    build:
      context: .
      dockerfile: docker/Dockerfile.backend
    container_name: rag-app
    depends_on:
      - ollama
    volumes:
      - chroma_data:/app/data/chroma
      - chroma_persist:/app/data/chroma_persist
        - ./data/persist:/app/data/persist
        # directory must exist and be writable for admin uploads
      - ./offline_llm_models/cross_encoder:/app/models/cross_encoder:ro
    ports:
      - "8000:8000"
    environment:
      - OLLAMA_BASE_URL=http://ollama:11434
      - OLLAMA_HOST=http://ollama:11434
      - LANGCHAIN_ENDPOINT=disabled
      - CHROMA_TELEMETRY=FALSE
      - CHUNK_SIZE=800
      - CHUNK_OVERLAP=100
      - RERANK_TOP_K=3
      - RAG_SEARCH_TOP_K=10
      - RAG_USE_MMR=0
      - RAG_DYNAMIC_K_FACTOR=0
      - PERSIST_CHROMA_DIR=/app/data/chroma_persist
      - ADMIN_PASSWORD=changeme
      - SKIP_BOOT_INDEXING=1   # skip boot-time PDF indexing
      - UVICORN_WORKERS=1
    networks:
      - rag-net

  frontend:
    build:
      context: .
      dockerfile: docker/Dockerfile.frontend
      args:
        - VITE_API_URL=/api
    environment:
      - VITE_API_URL=/api   # runtime fallback
    container_name: offline-llm-frontend
    ports:
      - "443:443"
    depends_on:
      - rag-app
    volumes:
      - ./certs:/etc/nginx/certs:ro
    networks:
      - rag-net

volumes:
  chroma_data:
  chroma_persist:
  ollama_models:

networks:
  rag-net:

```

If you loaded prebuilt images from `offline_stack.tar`, update `compose.yaml`
and replace the `build:` entries for `rag-app` and `frontend` with `image:` tags
(`offlinellm-rag-app:latest` and `offline-llm-frontend:latest`). See
[OFFLINE_DEPLOY.md](OFFLINE_DEPLOY.md) for a snippet.

---

## Pulling & Running Ollama

```powershell
docker compose down
docker pull ollama/ollama:latest
docker compose up -d ollama                 # start service to load models
docker exec ollama ollama pull nomic-embed-text  # without it embeddings are empt
docker compose up -d --build
```

---

## Starting the RAG App

```powershell
docker ps
```

---

## Verifying Service Health

```powershell
curl.exe http://localhost:11434/api/ping
Invoke-RestMethod http://localhost:8000/ping
```

---

## Pulling Models in Ollama

```powershell
docker exec -it ollama bash -lc "ollama pull nomic-embed-text && ollama pull llama3:8b-instruct-q3_K_L"
docker exec -it ollama bash -lc "ollama list"
```

Missing models will lead to empty embeddings and indexing failures during ingestion.

---

## API Endpoints Overview

| Endpoint        | Method | Description                                  |
|-----------------|--------|----------------------------------------------|
| `/ping`         | GET    | Health check                                 |
| `/chat`         | POST   | Stateful chat w/ session memory              |
| `/doc_qa`       | POST   | RAG over permanent KB (+ optional session)   |
| `/upload_pdf`   | POST   | Ingest PDF into ephemeral session store      |
| `/session/{id}` | DELETE | Purge session store                          |
| `/session_qa`   | POST   | RAG over ephemeral + persistent KB           |

---

## PowerShell Smoke Tests

1. **New chat session**

```powershell
$session = (Invoke-RestMethod `
  -Uri http://localhost:8000/chat `
  -Method Post `
  -ContentType 'application/json' `
  -Body (@{ user_msg = 'hello' }|ConvertTo-Json)
).session_id
```

2. **Upload PDF**

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:8000/upload_pdf?session_id=$session" `
  -Method Post `
  -Form @{ file = Get-Item '.\tests\demo.pdf' }
```

3. **Session-scoped QA**

```powershell
$resp = Invoke-RestMethod `
  -Uri http://localhost:8000/session_qa `
  -Method Post `
  -ContentType 'application/json' `
  -Body (@{ question='Give me a summary'; session_id=$session }|ConvertTo-Json)

$resp.answer
$resp.sources
```

4. **Delete session**

```powershell
Invoke-RestMethod `
  -Uri http://localhost:8000/session/$session `
  -Method Delete
```

5. **Verify 404**

```powershell
Invoke-RestMethod `
  -Uri http://localhost:8000/session_qa `
  -Method Post `
  -ContentType 'application/json' `
  -Body (@{ question='anything'; session_id=$session }|ConvertTo-Json)
```

---

## Common Pitfalls & Fixes

- **Name resolution errors**: use correct service alias `ollama` in Compose.
- **Model-not-found**: pull models inside Ollama container.
- **IsADirectoryError on DELETE**: use `shutil.rmtree()` for `purge_session_store`.
- **Invalid collection name**: use valid prefix (alphanumeric, underscores, hyphens).
- **Chroma settings mismatch**: `allow_reset` flags must align.
- **`sqlite3.OperationalError: no such column: collections.topic`**: remove the
  `chroma_persist` Docker volume (old schema) then start the stack again:
  `docker compose down -v && docker compose up -d rag-app`.

---

## Session Lifecycle

1. `/chat` → `session_id`  
2. `/upload_pdf` → ephemeral docs indexed  
3. `/session_qa` → RAG query  
4. `DELETE /session/{session_id}` → purge  
5. `/session_qa` → 404 or empty  

---

## Troubleshooting Tips

- Check logs:
  ```bash
  docker logs -f rag-app
  docker logs -f ollama
  ```
- Rebuild without cache:
  ```powershell
  docker compose build --no-cache rag-app
  ```
- Inspect network:
  ```bash
  docker network inspect offlinellm_rag-net
  ```
 "Connection refused" on `curl http://localhost:8000/...` usually means the
  backend is still waiting for Ollama. Check container status:
  ```bash
  docker compose ps
  docker logs rag-app
  ```
---

*Keep this guide updated with any new findings!*