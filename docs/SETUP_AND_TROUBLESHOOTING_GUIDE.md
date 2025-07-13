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

---

## Cloning & Building

```powershell
# 1. Clone the repo
git clone https://github.com/your-org/OfflineLLM.git
cd OfflineLLM

# 2. Switch to the feature branch (if needed)
git checkout feature/ephemeral-session-rag
```

---

## Docker Compose Configuration

Your `docker-compose.yml` should define **two** services on a shared network (`rag-net`):

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
      dockerfile: docker/Dockerfile
    container_name: rag-app
    depends_on: [ollama]
    volumes:
      - chroma_data:/app/data/chroma
      - ./data/persist:/app/data/persist:ro
      - ./offline_llm_models/cross_encoder:/app/models/cross_encoder:ro
    ports:
      - "8000:8000"
    environment:
      - OLLAMA_BASE_URL=http://ollama:11434
      - LANGCHAIN_ENDPOINT=disabled
      - CHROMA_TELEMETRY=FALSE
    networks: [rag-net]

volumes:
  chroma_data:
  ollama_models:

networks:
  rag-net:
```

---

## Pulling & Running Ollama

```powershell
docker compose down
docker pull ollama/ollama:latest
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

---

*Keep this guide updated with any new findings!*