# Offline Deployment Guide

This guide walks through preparing the Docker images on a machine with internet access and transferring them to an air‑gapped Ubuntu server.

## 1 Build images online

```bash
docker pull ollama/ollama:latest
# build backend and frontend images
docker compose build
```

## 2 Save images & copy assets

```bash
docker save -o offline_stack.tar \
  ollama/ollama:latest \
  offlinellm-rag-app:latest \
  offline-llm-frontend:latest
```

Copy `offline_stack.tar`, the `offline_llm_models/` directory and the `data/` directory to the target Ubuntu server.

## 3 Load on server & run

```bash
docker load -i offline_stack.tar
docker compose up -d
```

## 4 Verify models

```bash
docker exec ollama ollama list
```

## 5 Notes

- Set the `ADMIN_PASSWORD` environment variable in `compose.yaml` before
  running `docker compose up -d` if you want to enable the admin endpoints.
- The backend performs a boot indexing step if PDFs exist in
  `./data/persist`. Remove the mount or clear the directory to skip this.
- Ensure the copied `data/` and `offline_llm_models/` directories are
  readable by Docker (e.g. `chown -R $USER:$USER data offline_llm_models`).
