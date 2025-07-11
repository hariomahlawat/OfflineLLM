# Local Development – Windows 11 (PowerShell) & Linux

Follow these steps if you want to **hack on the code** outside Docker.

---

## 1. Prerequisites

| Tool | Version | Windows install |
|------|---------|-----------------|
| Python | 3.11.x | `winget install Python.Python.3.11` |
| Poetry or pip‑tools | latest | `pip install --user pip-tools` |
| Node JS | ≥ 20 | `winget install OpenJS.NodeJS.LTS` |
| pnpm   | ≥ 9   | `npm install -g pnpm` |
| PostgreSQL (optional) | 16 | for external ChromaDB |

---

## 2. Backend venv

```powershell
cd OfflineLLM
python -m venv .venv
. .venv\Scripts\Activate.ps1

# lockfile already pinned – fast install
pip install --upgrade pip
pip install -r requirements.lock

# dev extras
pip install -r requirements-dev.txt
```

Run:

```powershell
set OLLAMA_BASE_URL=http://localhost:11434
uvicorn app.main:app --reload --port 8000
```

---

## 3. Frontend dev server

```powershell
cd frontend
pnpm install
pnpm dev         # http://localhost:5173
```

In `vite.config.ts` the `/api`, `/chat`, `/models`, `/doc_qa` proxies already forward to `http://localhost:8000`.

---

## 4. Docs auto‑build

```powershell
pip install mkdocs-material
mkdocs serve  # http://127.0.0.1:8001
```
