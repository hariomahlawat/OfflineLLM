# Developer Setup – **OfflineLLM**

> **Last verified:** 03 Jul 2025  
> **Host OS:** Windows 11 (PowerShell 7)

---

## 0. Prerequisites
| Tool   | Version / Notes                             |
|--------|---------------------------------------------|
| Python | **3.11 × 64‑bit** (ensure `python` in PATH) |
| Git    | Latest                                      |
| VS Code| Python extension recommended                |

---

## 1. Clone & open

```powershell
git clone <your-fork-url> OfflineLLM
cd OfflineLLM
code .            # (optional) open folder in VS Code
```

---

## 2. Create & activate a virtual‑env

```powershell
python -m venv .venv
& ".venv\Scripts\Activate.ps1"      # prompt shows (.venv)
python -m pip install --upgrade pip
```

> **If activation is blocked:**  
> `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force`

---

## 3. Dependency‑locking workflow

1. **Install pip‑tools** (one‑time):

   ```powershell
   pip install pip-tools
   ```

2. **Generate** the lock file:

   ```powershell
   pip-compile docker\requirements.in -o requirements.lock
   ```

3. **Install** all runtime packages:

   ```powershell
   pip install -r requirements.lock
   ```

**Current `docker/requirements.in`**

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

---

## 4. Smoke‑test FastAPI

```powershell
python -m uvicorn app.api:app --reload
```

Browse to:

* <http://127.0.0.1:8000/ping> → `{"status":"ok"}`
* <http://127.0.0.1:8000/docs> → Swagger UI

Stop with **Ctrl‑C**.

---

## 5. Test PDF ingestion

Place **`sample.pdf`** in the project root, then run:

```powershell
python -c "from app.ingestion import load_and_split;chunks = load_and_split('sample.pdf');print(f'Chunks: {len(chunks)}');print('Preview:', chunks[0].page_content[:200])"
```

Expected output:

```
Chunks: 22
Preview: Lorem ipsum dolor…
```

---

## Updating dependencies later

```powershell
# 1. Edit docker\requirements.in
# 2. Regenerate & reinstall
pip-compile docker\requirements.in -o requirements.lock
pip install -r requirements.lock
```

---

*Happy hacking!*