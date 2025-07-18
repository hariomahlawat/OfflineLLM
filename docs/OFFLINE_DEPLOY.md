# Offline Deployment Guide

This guide walks through preparing the Docker images on a machine with internet access and transferring them to an air‑gapped server (Ubuntu, Windows 11 or Windows Server).

## 1 Build images online

```bash
docker pull ollama/ollama:latest
# build backend and frontend images
docker compose build
```

After the build completes edit `compose.yaml` so the offline server uses the
prebuilt images instead of trying to rebuild them. Replace each `build:` section
with the matching `image:` tag:

```yaml
rag-app:
  image: offlinellm-rag-app:latest
  # ...

frontend:
  image: offline-llm-frontend:latest
  # ...
```

## 2 Save images & copy assets

```bash
docker save -o offline_stack.tar \
  ollama/ollama:latest \
  offlinellm-rag-app:latest \
  offline-llm-frontend:latest
```

Copy `offline_stack.tar`, the `offline_llm_models/` directory and the `data/` directory to the target server.

## 3 Load on server & run

### Ubuntu

```bash
docker load -i offline_stack.tar
docker compose up -d
```

### Windows 11 / Windows Server

```powershell
docker load -i .\offline_stack.tar
docker compose up -d
```

### Use pre-built images

`compose.yaml` contains `build:` directives for the backend and frontend. On an offline machine you can skip rebuilding them by changing those entries to use the pre-built images or by running `docker compose up --no-build`.

```yaml
services:
  rag-app:
    image: offlinellm-rag-app:latest
  frontend:
    image: offline-llm-frontend:latest
```

```bash
docker compose up --no-build
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
