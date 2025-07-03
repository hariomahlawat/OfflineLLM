# OfflineLLM

**Offline‑ready local‑LAN Large‑Language‑Model stack**

> Bring document‑QA, chat, and semantic search to any air‑gapped Windows or Linux network—no external APIs, no internet needed.

---

## ✨ Features

- **Self‑hosted RAG** – PDF ingestion → Chroma vector store → Cross‑encoder re‑rank → Ollama LLM.
- **Chat + Document QA** – Two endpoints: free‑form chat or retrieval‑augmented answers.
- **100 % offline reproducible build** – Pinned `requirements.lock`, pre‑pulled Ollama weights, Docker images can be exported/imported via `.tar`.
- **FastAPI backend** – ASGI‑native, easy to scale with multiple workers.
- **Modular codebase** – Clear separation: `ingestion.py`, `vector_store.py`, `rerank.py`, `chat.py`, `api.py`.
- **Cross‑platform** – Develop on Windows 11, deploy on Linux server or WSL2.

---

## 📂 Project layout

```text
OfflineLLM/
├─ app/
│   ├─ api.py              # FastAPI routes
│   ├─ ingestion.py        # PDF loader + splitter
│   ├─ vector_store.py     # Chroma wrapper
│   ├─ rerank.py           # Cross‑encoder cache
│   └─ chat.py             # Chat + memory
├─ docker/
│   ├─ Dockerfile
│   ├─ requirements.in
│   └─ entrypoint.sh
├─ compose.yaml
├─ requirements.lock
└─ docs/
    └─ DEV_SETUP.md
```

---

## 🚀 Quick‑start (local dev)

Follow **docs/DEV_SETUP.md** for the detailed workflow.  
Short version:

```powershell
git clone <your‑fork‑url> OfflineLLM
cd OfflineLLM
python -m venv .venv
& ".venv\Scripts\Activate.ps1"
python -m pip install --upgrade pip pip-tools
pip-compile docker\requirements.in -o requirements.lock
pip install -r requirements.lock
python -m uvicorn app.api:app --reload
```

Browse to:

* <http://127.0.0.1:8000/ping>
* <http://127.0.0.1:8000/docs>

---

## 🐳 Docker quick‑start

```bash
# build images (requires internet once)
docker compose build

# run both containers
docker compose up -d

# first time: seed models
curl http://localhost:11434/api/pull -d '{"name":"llama3:8b"}'
```

To migrate to an air‑gapped server:

```bash
docker save -o offline_stack.tar rag-app:latest ollama-offline:latest
# copy the tar, then
docker load -i offline_stack.tar
docker compose up -d
```

---

## 📚 Documentation

* **DOCS/DEV_SETUP.md** – developer environment  
* **TODO:** Add usage examples and API reference as modules stabilise.

---

## 🤝 Contributing

1. Fork the repo and create your branch: `git checkout -b feature/foo`.
2. Run `pip install -r requirements.lock && pytest -q`.
3. Submit a PR with a clear description of changes.

---

## 📝 License

*Pending – choose MIT or Apache‑2.0 before first public release.*

---

Made with 💻 & ☕ by the OfflineLLM project.
