
# Developer Setup – **OfflineLLM**

> **Last verified:** 04 Jul 2025  
> **Host OS:** Windows 11 (PowerShell 7)

---

## 0 Prerequisites

| Tool | Minimum version | Install notes |
|------|-----------------|---------------|
| **Git** | any recent | <https://git-scm.com/download/win> – add **git.exe** to PATH |
| **Python** | 3.11 × 64‑bit | `python --version` ⇒ *3.11.x* |
| **Docker Desktop** | 4.42 + | enable **“Use the WSL 2 based engine”** |
| **Ollama** | 0.3.4 (inside container) | models pulled automatically |
| **VS Code** | optional | Python + Docker extensions help |

---

## 1 Clone & open

```powershell
git clone https://github.com/<your‑fork>/OfflineLLM.git
cd OfflineLLM
code .         # optional: open folder in VS Code
```

---

## 2 Local virtual‑env

```powershell
python -m venv .venv
& ".venv\Scripts\Activate.ps1"     # prompt shows (.venv)
python -m pip install --upgrade pip
```

> **Activation blocked?**  
> `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force`

---

## 3 Dependency locking (pip‑tools)

```powershell
# 1 – one‑time install
pip install pip-tools

# 2 – (re)generate lock file
pip-compile docker\requirements.in -o requirements.lock

# 3 – install everything
pip install -r requirements.lock
```

<details>
<summary>Current <code>docker/requirements.in</code></summary>

```
fastapi
uvicorn[standard]
langchain-community
chromadb==0.5.23
sentence-transformers
pydantic
pymupdf
pypdf
```
</details>

---

## 4 Run API locally (no Docker)

```powershell
python -m uvicorn app.api:app --reload
```

Browse to:

* <http://127.0.0.1:8000/ping> → `{"status":"ok"}`
* <http://127.0.0.1:8000/docs> → Swagger UI

Stop with **Ctrl‑C**.

---

## 5 Test PDF ingestion

```powershell
python - <<'PY'
from app.ingestion import load_and_split
chunks = load_and_split("sample.pdf")
print("Chunks:", len(chunks))
print("Preview:", chunks[0].page_content[:200])
PY
```

---

## 6 Docker workflow (production‑like)

### 6.1 Build Ollama image (one‑time)

```powershell
docker build -f docker/Ollamafile -t ollama-offline:latest .
```

Downloads & caches:

* **llama3:8b-instruct-q3_K_L** (~4 GB, fits in 4 GB RAM)
* **nomic-embed-text**

### 6.2 Build / run the RAG API

```powershell
docker compose build rag-app          # fast after first run
docker compose up -d                  # starts ollama + rag-app
```

### 6.3 Health checks

```powershell
Invoke-RestMethod http://localhost:8000/ping          # {"status":"ok"}

Invoke-RestMethod -Method POST `
  -Uri http://localhost:8000/chat `
  -ContentType application/json `
  -Body '{"user_msg":"Hello!"}'
```
### 6.4 React UI (Vite dev server)

```powershell
cd offline-llm-ui
npm install                    # first time only
npm run dev                    # http://localhost:5173/
```

The dev server proxies all `/api` calls to `http://localhost:8000`.
Use `VITE_API_URL=http://localhost:8000` while developing and keep
`VITE_API_URL=/api` for production builds (set in `offline-llm-ui/.env`).

---

## 7 Environment variables (inside container)

| Variable | Default | Purpose |
|----------|---------|---------|
| `OLLAMA_BASE_URL` | `http://ollama:11434` | internal URL used by rag‑app |
| `OLLAMA_HOST`     | same | fallback for *langchain‑ollama* |
| `CHUNK_SIZE`      | `800` | PDF text-splitter chunk size |
| `CHUNK_OVERLAP`   | `100` | overlap between chunks |
| `RERANK_TOP_K`    | `3` | number of chunks sent to the LLM |

---

## 8 Updating dependencies

```powershell
# edit docker/requirements.in
pip-compile docker\requirements.in -o requirements.lock
pip install -r requirements.lock
docker compose build rag-app
```

---

## 9 Troubleshooting cheatsheet

| Symptom | Fix |
|---------|-----|
| `winget` missing | install Git manually & ensure PATH |
| **400 – model requires more memory** | keep using quantised tag (`q3_K_L`) or set uvicorn workers to **1** |
| *Container name conflict* | `docker compose down` or `docker rm -f $(docker ps -aq)` |
| First chat call ≈ 40 s | model loading; subsequent calls ≈ 2 s |

---

*Happy hacking & offline RAG‑ing!* 🚀
