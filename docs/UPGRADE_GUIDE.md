# Dependency & Model Upgrade Guide

## 1. Python packages

### Bump a library

```powershell
# edit docker/requirements.in
notepad docker\requirements.in   # e.g. fastapi==0.120.0

# regenerate lock
pip-compile docker\requirements.in -o requirements.lock

git add requirements.lock docker/requirements.in
git commit -m "chore(deps): fastapi 0.120"
```

### Rebuild

```powershell
docker compose build --no-cache rag-app
docker compose up -d
```

If the resolver complains about conflicts, delete the old lock first.

---

## 2. Ollama models

```powershell
# pull a newer Llama 3
docker compose exec ollama ollama pull llama3:70b

# make it the default for chat
Invoke-RestMethod -Uri http://localhost:11434/api/chat -Method POST `
  -Body (@{ model="llama3:70b"; messages=@(@{role="user";content="ping"}) } | ConvertTo-Json)
```

Add large models to a separate volume (`ollama_models:`) so re‑pulls aren’t required on rebuild.

---

## 3. Frontend deps

```powershell
cd frontend
pnpm up --latest
pnpm build
docker compose build frontend
```

---

## 4. Backward‑incompatible LangChain releases

LangChain occasionally renames classes. Pin `langchain-core`, `langchain-community`, and `langchain-text-splitters` together and upgrade in sync after reading the changelog.

---

## 5. Version matrix

| Stack part | Safe tested version |
|------------|--------------------|
| FastAPI    | 0.115.14 |
| Uvicorn    | 0.35.0 |
| LangChain Core | 0.3.68 |
| ChromaDB   | 0.5.23 |
| Ollama     | 0.9.6 |
| Llama3     | 8b‑instruct‑q4_K_M |
| torch (CPU) | 2.3.1 |
