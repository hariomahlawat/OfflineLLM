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
│   ├─ Ollamafile
│   ├─ requirements.in
│   └─ entrypoint.sh
├─ compose.yaml
├─ requirements.lock
└─ docs/
    └─ DEV_SETUP.md
```

---

## 🚀 Quick‑start (local dev)

See **docs/DEV_SETUP.md** for the step‑by‑step guide.  
TL;DR:

```powershell
git clone https://github.com/<your‑fork>/OfflineLLM.git
cd OfflineLLM
python -m venv .venv
& ".venv\Scripts\Activate.ps1"
python -m pip install --upgrade pip pip-tools
pip-compile docker\requirements.in -o requirements.lock
pip install -r requirements.lock
python -m uvicorn app.api:app --reload
```

Open in browser:

* <http://127.0.0.1:8000/ping>
* <http://127.0.0.1:8000/docs>

---

## 🐳 Docker quick‑start

```bash
# build images (one‑time with internet)
docker compose build

# run the stack
docker compose up -d

# first time only – make sure models are present
docker exec ollama ollama pull llama3:8b-instruct-q3_K_L
```

On startup the backend container runs `python -m app.boot` as the `llm`
user. This indexes any PDFs mounted into `./data/persist` and simply
logs a message if none are found.

### Air‑gap deployment

```bash
# on build machine
docker save -o offline_stack.tar offlinellm-rag-app:latest ollama-offline:latest

# copy to server
docker load -i offline_stack.tar
docker compose up -d
```
## 🔒 Admin mode

Set an `ADMIN_PASSWORD` environment variable in the backend service. When defined, requests to any `/admin/*` endpoint must include the `Authorization: Bearer <ADMIN_PASSWORD>` header.

To permanently ingest a document, use:

```bash
curl -H "Authorization: Bearer $ADMIN_PASSWORD" \
     -F file=@file.pdf \
     http://localhost:8000/admin/upload_pdf
```

When the frontend container is running, open `https://localhost/admin.html` and log in with the same password for a simple upload UI.

---

## 📚 Docs

* **docs/DEV_SETUP.md** – full developer setup
* API usage examples coming soon

---

## 🤝 Contributing

```bash
git checkout -b feature/my-feature
pip install -r requirements.lock
pytest -q
# commit, push, open PR
```

---

## 📝 License

MIT … TBD before public release.

---

Made with 💻 & ☕ by @hariomahlawat
