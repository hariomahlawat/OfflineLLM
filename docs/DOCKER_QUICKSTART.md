# Docker Quick‑Start & Air‑Gap Guide

## Build images

```powershell
# fresh build (no cache) – about 3 min on 200 Mbps
docker compose build --no-cache rag-app
```

The backend image is CPU‑only; if you need GPU:

1. Switch base image to `nvidia/cuda:12.6.0-runtime-ubuntu22.04`.
2. Add `--gpus all` to `rag-app` service in compose file.
3. Pin `torch==2.7.1+cu126` in `docker/requirements.in`.

---

## Run

```powershell
docker compose up -d
```

### Health‑checks

```yaml
ollama:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
    interval: 5s
    retries: 20

rag-app:
  depends_on:
    ollama:
      condition: service_healthy
```

Remove the manual wait‑loop if you use this pattern.

---

## Air‑Gapped Deployment

```powershell
# on a machine that *does* have internet
docker compose pull        # pull all images
docker save ollama/ollama:latest | gzip > ollama.tgz
docker save offlinellm-rag-app:latest | gzip > rag-app.tgz
docker save offlinellm-frontend:latest | gzip > frontend.tgz
# copy *.tgz to the secure network
```

On the offline host:

```powershell
gzip -dc *.tgz | docker load
docker compose up -d
```

Persisted PDFs go in `data/persist/`; Chroma vectors in `data/chroma/`.
