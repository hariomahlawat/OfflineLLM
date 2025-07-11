# Troubleshooting Handbook

| Symptom (logs / browser) | Root cause | Fix |
|--------------------------|------------|-----|
| `curl: command not found` in `rag-app` | `python:3.11-slim` image lacks curl | APT‑install curl or use Compose health‑checks |
| `GET /ping → 404` loop | Ollama 0.9 removed `/ping` | Poll `/api/tags` instead |
| `Error loading ASGI app. Could not import module "app.main"` | Wrong uvicorn target, missing `__init__.py`, or file renamed | Align command: `uvicorn app.<file>:<var>` |
| `Cannot install torch…` huge CUDA wheels | Torch 2.7 metapackage pulls GPU deps | Use `torch==2.7.1+cpu` with extra‑index or pin 2.3.1 |
| `pip conflicting dependencies (Starlette)` | Old lock pinned `starlette` | Regenerate `requirements.lock` after editing `.in` |
| `ERR_CONNECTION_REFUSED` from frontend | Backend not listening on :8000 | Check if `rag-app` exited; see previous rows |
| Docker build times out downloading cuDNN 571 MB | Flaky link & giant wheel | CPU‑only torch, or `pip download --retries 20` |

---

## Common Commands

```powershell
# Rebuild backend fast (skip model layers)
docker compose build --no-cache rag-app

# Drop into a shell to inspect code paths
docker compose run --rm rag-app bash -c "tree -L 2 /app"

# Reset Chroma vector store
Remove-Item -Recurse -Force data\chroma\*
```

---

## Log cheat‑sheet

```powershell
docker compose logs -f ollama | Select-String "Listening"
docker compose logs -f rag-app  # FastAPI / uvicorn
docker compose logs -f offline-llm-frontend
```
