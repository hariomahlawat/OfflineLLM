# Offline Deployment Guide

This guide walks through preparing the Docker images on a machine with internet access and transferring them to an air‑gapped server (Ubuntu, Windows 11 or Windows Server).

## 1 Build images online

```bash
docker pull ollama/ollama:latest
# build backend and frontend images
docker compose build

# start Ollama so models can be pulled
docker compose up -d ollama
ollama pull llama3:8b-instruct-q3_K_L
ollama pull nomic-embed-text
```

## 2 Save images & copy assets

```bash
docker save -o offline_stack.tar \
  ollama/ollama:latest \
  offlinellm-rag-app:latest \
  offline-llm-frontend:latest

# export pulled Ollama models
docker run --rm -v ollama_models:/models -v $PWD:/backup \
  busybox tar cf /backup/ollama_models.tar /models
```
Copy `offline_stack.tar`, `ollama_models.tar`, the `offline_llm_models/` directory and the `data/` directory to the target server.

## 3 Load on server & run

### Ubuntu

```bash
docker load -i offline_stack.tar
docker volume create ollama_models
docker run --rm -v ollama_models:/models -v $PWD:/backup \
  busybox tar xf /backup/ollama_models.tar -C /
docker compose up -d
```

### Windows 11 / Windows Server

```powershell
docker load -i .\offline_stack.tar
docker volume create ollama_models
docker run --rm -v ollama_models:/models -v $PWD:/backup busybox tar xf \
  /backup/ollama_models.tar -C /
docker compose up -d
```

## 4 Verify models

```bash
docker exec ollama ollama list
```

## 5 Notes

- Set the `ADMIN_PASSWORD` environment variable in `compose.yaml` before
  running `docker compose up -d` if you want to enable the admin endpoints.
- PDFs placed under `./data/persist` are **not** indexed automatically.
  Upload via the admin API or run `python -m app.boot` inside the backend
  container to index them manually.
- Ensure the copied `data/` and `offline_llm_models/` directories are
  readable by Docker (e.g. `chown -R $USER:$USER data offline_llm_models`).
- Windows hosts need Docker Desktop installed ahead of time. Download the
  installer on an internet-connected machine and copy it over.
- For speech-to-text, manually install `ffmpeg` and the `openai-whisper`
  Python package.
