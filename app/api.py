"""
FastAPI routes
──────────────
* /models               – list all Ollama models (resilient to startup lag)
* /ping                 – lightweight health check
* /chat                 – chat with session memory   (model override optional)
* /doc_qa               – permanent-KB RAG           (model override optional)
* /upload_pdf           – add a PDF only to session
* /session/{id} DELETE  – purge session vector store
* /session_qa           – session-KB ± persistent-KB RAG
"""

from __future__ import annotations

import asyncio
import os
import shutil
import tempfile
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional

import ollama
from fastapi import (
    FastAPI,
    File,
    HTTPException,
    Query,
    UploadFile,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel


# ───────────────────────── Constants ──────────────────────────
DEFAULT_MODEL = os.getenv("OLLAMA_DEFAULT_MODEL", "llama3:8b-instruct-q4_K_M")
SESSION_TTL_MIN = int(os.getenv("SESSION_TTL_MIN", 60))  # purge after 1 h idle
TOK_TRUNCATE = int(os.getenv("RAG_TOK_LIMIT", 2000))  # pre-truncate prompt

# ───────────────────────── Lazy KB warm-up ────────────────────
app = FastAPI(title="OfflineLLM API", version="0.3.0")
ALLOWED_ORIGINS = os.getenv("CORS_ALLOW")

if ALLOWED_ORIGINS:
    origins = ALLOWED_ORIGINS.split(",")
else:
    origins = ["http://localhost", "http://localhost:5173", "https://localhost"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def _warm_kb() -> None:
    """
    Boot-time ingestion of files under /data/persist.
    Runs once; errors are logged but won’t kill uvicorn.
    """
    import app.boot  # side-effect indexing


# ───────────────────────── CORS (env override) ────────────────


# ───────────────────────── Session store helpers ──────────────
from app.ingestion import load_and_split
from app.vector_store import (
    SESSIONS_ROOT,
    get_session_store,
    new_session_store,
    purge_session_store,
    similarity_search,
)
from app.rerank import rerank
from app.chat import chat as chat_fn, new_session_id, safe_chat
from app.ollama_utils import finalize_ollama_chat

_SESSIONS: Dict[str, object] = {}
_SESSIONS_TOUCH: Dict[str, datetime] = {}
_SESSIONS_LOCK = asyncio.Lock()


async def _touch_sid(sid: str) -> None:
    async with _SESSIONS_LOCK:
        _SESSIONS_TOUCH[sid] = datetime.utcnow()


async def _purge_expired_sessions() -> None:
    cutoff = datetime.utcnow() - timedelta(minutes=SESSION_TTL_MIN)
    async with _SESSIONS_LOCK:
        for sid, ts in list(_SESSIONS_TOUCH.items()):
            if ts < cutoff:
                purge_session_store(sid)
                _SESSIONS.pop(sid, None)
                _SESSIONS_TOUCH.pop(sid, None)


# background task to purge old sessions
@app.on_event("startup")
async def _start_session_gc() -> None:
    async def gc_loop():
        while True:
            await _purge_expired_sessions()
            await asyncio.sleep(60)
    asyncio.create_task(gc_loop())

# ───────────────────────── Schemas ────────────────────────────
class ModelInfo(BaseModel):
    name: str
    description: Optional[str] = None

class PingResponse(BaseModel):
    status: str = "ok"

class QARequest(BaseModel):
    question: str
    session_id: Optional[str] = None
    model: Optional[str] = None

class QAResponse(BaseModel):
    answer: str
    sources: List[str]

class ChatRequest(BaseModel):
    user_msg: str
    session_id: Optional[str] = None
    model: Optional[str] = None

class ChatResponse(BaseModel):
    session_id: str
    answer: str

class UploadPDFResponse(BaseModel):
    status: str
    session_id: str
    chunks_indexed: int

class SessionQARequest(BaseModel):
    question: str
    session_id: str
    persistent: Optional[bool] = True
    model: Optional[str] = None

class SessionQAResponse(BaseModel):
    answer: str
    sources: List[str]

# ───────────────────────── /models ────────────────────────────
@app.get("/models", response_model=List[ModelInfo])
async def list_models():
    """
    List locally pulled Ollama models.

    Always returns **200 OK**.
    If Ollama isn’t up yet we return an empty list so the frontend keeps polling.
    """
    try:
        raw = ollama.list() # might raise ConnectionError
    except Exception:
        return []

    out: List[ModelInfo] = []
    for m in raw.get("models", []):
        details = m.get("details", {})
        desc = f"{details.get('family','')}, {details.get('parameter_size','')} {details.get('quantization_level','')}"
        out.append(ModelInfo(name=m["name"], description=desc.strip(", ")))
    return out

# ───────────────────────── /ping ──────────────────────────────
@app.get("/ping", response_model=PingResponse)
async def ping():
    return PingResponse()

# ───────────────────────── /doc_qa ────────────────────────────


@app.post("/doc_qa", response_model=QAResponse)
async def doc_qa(req: QARequest):
    model = req.model or DEFAULT_MODEL

    try:
        try:
            docs = similarity_search(req.question, k=10)
        except ValueError as e:
            if "nomic-embed-text" in str(e):
                return JSONResponse(
                    status_code=500, content={"detail": f"chat model failed: {str(e)}"
                    },
                )
            docs = []

        if req.session_id:
            store = _SESSIONS.get(req.session_id)
            if store:
                try:
                    docs += store.similarity_search(req.question, k=10)
                except ValueError as e:
                    if "nomic-embed-text" in str(e):
                        return JSONResponse(
                            status_code=503,
                            content={
                                "detail": "embedding model not found; run `ollama pull nomic-embed-text`"
                            },
                        )
                    raise

        if not docs:
            return QAResponse(answer="I don't know.", sources=[])

        chunks = [d.page_content for d in docs]
        top_chunks = rerank(req.question, chunks)
        ctx = "\n---\n".join(top_chunks)[:TOK_TRUNCATE]

        prompt = (
            "You are a helpful assistant. Answer ONLY from the CONTEXT.\n"
            "If unsure, say 'I don't know.'\n\n"
            f"CONTEXT:\n{ctx}\n\nQUESTION: {req.question}\nANSWER:"
        )

        raw = safe_chat(
            model=model, messages=[{"role": "user", "content": prompt}], stream=False
        )
        answer = finalize_ollama_chat(raw)["message"]["content"]

        return QAResponse(answer=answer, sources=top_chunks)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=500, content={"detail": f"Unexpected error: {str(e)}"}
        )

# ───────────────────────── /chat ──────────────────────────────
@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    session_id = req.session_id or new_session_id()
    model = req.model or DEFAULT_MODEL

    try:
        answer = chat_fn(session_id, req.user_msg, model=model)
        await _touch_sid(session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return ChatResponse(session_id=session_id, answer=answer)

# ───────────────────────── /upload_pdf ────────────────────────
@app.post("/upload_pdf", response_model=UploadPDFResponse)
async def upload_pdf(
    session_id: str = Query(..., description="Session ID this PDF belongs to"),
    file: UploadFile = File(..., description="PDF to ingest into session KB"),
):
    store = _SESSIONS.get(session_id)
    if store is None:
        store = new_session_store(session_id)
        _SESSIONS[session_id] = store

    tmp_path: Optional[Path] = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = Path(tmp.name)

        chunks = load_and_split(str(tmp_path))
        store.add_documents(chunks)
        added = len(chunks)
        await _touch_sid(session_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to ingest PDF: {e}")
    finally:
        file.file.close()
        if tmp_path:
            tmp_path.unlink(missing_ok=True)

    return UploadPDFResponse(status="ok", session_id=session_id, chunks_indexed=added)

# ───────────────────────── /session/{id} DELETE ───────────────
@app.delete("/session/{session_id}")
async def end_session(session_id: str):
    if (SESSIONS_ROOT / session_id).exists() or session_id in _SESSIONS:
        purge_session_store(session_id)
        _SESSIONS.pop(session_id, None)
        _SESSIONS_TOUCH.pop(session_id, None)
        return {"status": "purged", "session_id": session_id}
    raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found")

# ───────────────────────── /session_qa ────────────────────────
@app.post("/session_qa", response_model=SessionQAResponse)
async def session_qa(req: SessionQARequest):
    model = req.model or DEFAULT_MODEL

    sess_store = _SESSIONS.get(req.session_id)
    if sess_store is None:
        try:
            sess_store = get_session_store(req.session_id)
            _SESSIONS[req.session_id] = sess_store
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))

    sess_docs = sess_store.similarity_search(req.question, k=5)
    persist_docs = (
        [] if req.persistent is False else similarity_search(req.question, k=10)
    )
    all_docs = sess_docs + persist_docs

    if not all_docs:
        return SessionQAResponse(answer="I don't know.", sources=[])

    chunks = [d.page_content for d in all_docs]
    top_chunks = rerank(req.question, chunks)
    ctx = "\n---\n".join(top_chunks)[:TOK_TRUNCATE]

    prompt = (
        "You are a helpful assistant. Answer ONLY from the CONTEXT.\n"
        "If unsure, say 'I don't know.'\n\n"
        f"CONTEXT:\n{ctx}\n\nQUESTION: {req.question}\nANSWER:"
    )

    try:
        raw = safe_chat(
            model=model, messages=[{"role": "user", "content": prompt}], stream=False
        )
        answer = finalize_ollama_chat(raw)["message"]["content"]
        await _touch_sid(req.session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return SessionQAResponse(answer=answer, sources=top_chunks)
