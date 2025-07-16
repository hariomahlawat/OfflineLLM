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
- **Model listing** – `/models` enumerates available local LLMs.
- **Session‑based uploads + QA** – Upload a PDF via `/upload_pdf`, then query it with `/session_qa`.
- **Dynamic retrieval** – Number of retrieved chunks scales with question length (token based).
- **Offline speech-to-text** – Upload audio to `/speech_to_text` using OpenAI Whisper.

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
winget install ffmpeg   # for speech-to-text
pip install openai-whisper
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
logs a message if none are found. Ensure this directory exists and is
writable so that admin uploads can be saved.

### Air‑gap deployment

See **docs/OFFLINE_DEPLOY.md** for the full offline workflow. In short,
build/pull the images on a machine with internet access, export them to a
`offline_stack.tar` archive along with the `offline_llm_models/` and `data/`
directories, then load the archive on the server and run `docker compose up -d`.
## 🔒 Admin mode

Set an `ADMIN_PASSWORD` environment variable in the backend service. When defined, requests to any `/admin/*` endpoint must authenticate using HTTP Basic credentials with the `admin` username.

To permanently ingest a document, use:

```bash
curl -u "admin:$ADMIN_PASSWORD" -F file=@file.pdf \
     http://localhost:8000/admin/upload_pdf
```

When the frontend container is running, open `https://localhost/admin.html` and
log in with the same Basic credentials for a simple upload UI. The page now
matches the main site's styling and provides progress feedback along with any
error messages while uploading.

If you serve the backend directly (e.g. `uvicorn` during development) make sure
to build the React frontend with `npm run build` so that the compiled
`admin.html` and assets exist under `offline-llm-ui/dist`. Otherwise visiting
`/admin` will display a blank page. Running the `frontend` container handles the
build automatically.

## 🔎 Dynamic retrieval depth

Set `RAG_DYNAMIC_K_FACTOR` in the backend service to automatically increase the
number of retrieved chunks for longer questions. The value represents the number
of **tokens** per extra retrieved chunk. For example:

```bash
RAG_DYNAMIC_K_FACTOR=20  # adds one result for every 20 tokens
```

The default is `0`, which disables this behavior entirely.

---

## 📚 Docs

* **docs/DEV_SETUP.md** – full developer setup
* **docs/OFFLINE_DEPLOY.md** – deploy in an offline environment
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

MIT License – see [LICENSE](LICENSE) for details.

---

Made with 💻 & ☕ by @hariomahlawat
