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

`compose.yaml` uses `llama3:8b-instruct-q3_K_L` as the default chat model. Make
sure it is pulled (or change `OLLAMA_DEFAULT_MODEL`) before running the full
stack.

After the build completes edit `compose.yaml` so the offline server uses the
prebuilt images instead of trying to rebuild them. Replace each `build:` section
with the matching `image:` tag:

```yaml
rag-app:
  image: offlinellm-rag-app:latest
  # ...

frontend:
  image: offlinellm-frontend:latest
  # ...
```

## 2 Save images & copy assets

```bash
docker save -o offline_stack.tar \
  ollama/ollama:latest \
  offlinellm-rag-app:latest \
  offlinellm-frontend:latest

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

### Use pre-built images

`compose.yaml` contains `build:` directives for the backend and frontend. On an offline machine you can skip rebuilding them by changing those entries to use the pre-built images or by running `docker compose up --no-build`.

```yaml
services:
  rag-app:
    image: offlinellm-rag-app:latest
  frontend:
    image: offlinellm-frontend:latest
```

```bash
docker compose up --no-build
```

## 4 Verify models

```bash
docker exec ollama ollama list
```

The re-ranking **cross-encoder** model is stored under
`offline_llm_models/cross_encoder` and mounted directly into the
`rag-app` container. It will **not** appear in `ollama list` – the command
only shows LLM weights managed by Ollama.

## 5 Notes

- Set the `ADMIN_PASSWORD` environment variable in `compose.yaml` before
  running `docker compose up -d` if you want to enable the admin endpoints.
- Set `SKIP_BOOT_INDEXING=1` if you do **not** want PDFs under `./data/persist`
  indexed automatically at startup.
- PDFs placed under `./data/persist` are **not** indexed automatically.
  Upload via the admin API or run `python -m app.boot` inside the backend
  container to index them manually.
- Ensure the copied `data/` and `offline_llm_models/` directories are
  readable by Docker (e.g. `chown -R $USER:$USER data offline_llm_models`).
- Windows hosts need Docker Desktop installed ahead of time. Download the
  installer on an internet-connected machine and copy it over.
- For speech-to-text, manually install `ffmpeg` and the `openai-whisper`
  Python package.
