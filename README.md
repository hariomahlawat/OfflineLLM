# OfflineLLM – Self‑Hosted RAG & Chat System

OfflineLLM is a **completely air‑gapped Retrieval‑Augmented Generation (RAG) stack** that lets you chat with private documents using local open‑weight LLMs.  
It ships as three Docker services:

| Service | Technology | Purpose | Key Ports |
|---------|------------|---------|-----------|
| **rag-app** | Python 3.11, FastAPI, LangChain, ChromaDB | REST /chat, /doc_qa, and file ingestion endpoints | 8000 |
| **ollama**  | Ollama 0.9.x | Runs Llama‑family LLMs and embedding models entirely on‑machine | 11434 |
| **offline-llm-frontend** | React 18 + Vite + Chakra‑UI | Clean chat UI with doc‑QA panel and model selector | 443 (HTTPS) |

All data, vectors, and model weights stay **inside your host**. No internet egress is required after the initial image pull.

---

## Quick Start (Docker Compose)

```powershell
cd OfflineLLM
# Build or pull images, then launch in detached mode
docker compose up -d --build

# Follow backend logs
docker compose logs -f rag-app
```

Then open <https://localhost> in your browser.

---

## Features

* **Multi‑file ingestion** – drop PDFs into `data/persist/`, they are auto‑chunked & indexed at container start.
* **Fast document QA** – cosine search + cross‑encoder rerank, streamed LLM answers with citations.
* **Model hot‑swap** – pick any model present in Ollama (`/models` endpoint).  
  Example: `ollama pull llama3:8b`.
* **Health‑check driven** – backend waits for Ollama or Compose health‑checks do the job.
* **CPU‑only by default** – tiny 600 MB backend image; GPU can be enabled by adding nvidia runtime & Torch + CUDA wheels.

See `docs/ARCHITECTURE.md` for full request flow.

---

## Project Layout

```
.
├── app/                   # FastAPI code (routers, services, ingestion, vector_store)
├── docker/
│   ├── Dockerfile.backend # builds rag-app
│   └── entrypoint.sh      # waits for Ollama then uvicorn
├── frontend/              # React client
├── data/
│   └── persist/           # long‑lived PDF store (bind‑mounted)
├── docker-compose.yml
└── README.md
```

---

## License

MIT – see `LICENSE`.
