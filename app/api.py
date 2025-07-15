from __future__ import annotations

import os
import asyncio
import logging
import tempfile
import shutil
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional

import ollama
from fastapi import FastAPI, File, HTTPException, Query, UploadFile, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
import secrets
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from app import boot

# ───────────────────────── Environment / Ollama client ───────────────────────
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://ollama:11434")
# tell python-ollama where to reach the HTTP API
os.environ["OLLAMA_BASE_URL"] = OLLAMA_HOST

# disable any LangChain telemetry
os.environ["LANGCHAIN_TELEMETRY_ENABLED"] = "false"

# this uses the above env var
client = ollama.Client()

# ───────────────────────── Constants ──────────────────────────
DEFAULT_MODEL       = os.getenv("OLLAMA_DEFAULT_MODEL", "llama3:8b-instruct-q3_K_L")
SESSION_TTL_MIN     = int(os.getenv("SESSION_TTL_MIN", 60))
TOK_TRUNCATE        = int(os.getenv("RAG_TOK_LIMIT", 2000))

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
security = HTTPBasic()

# retrieval tuning
SEARCH_TOP_K        = int(os.getenv("RAG_SEARCH_TOP_K", 10))
USE_MMR             = os.getenv("RAG_USE_MMR", "0") == "1"


def _parse_dynamic_k_factor(val: str | None) -> int:
    """Return positive integer value or 0 if disabled.

    Raises ValueError if the env var cannot be parsed as an integer."""
    if val is None or val == "":
        return 0
    try:
        parsed = int(val)
    except ValueError:
        raise ValueError("RAG_DYNAMIC_K_FACTOR must be an integer") from None
    if parsed <= 0:
        return 0
    return parsed


DYNAMIC_K_FACTOR    = _parse_dynamic_k_factor(os.getenv("RAG_DYNAMIC_K_FACTOR"))

log = logging.getLogger("api")
log.setLevel(logging.INFO)

# ───────────────────────── FastAPI / CORS ──────────────────────────
app = FastAPI(title="OfflineLLM API", version="0.3.0")
origins = os.getenv("CORS_ALLOW", "")
allow = origins.split(",") if origins else [
    "http://localhost",
    "http://localhost:5173",
    "https://localhost",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def _verify_admin(creds: HTTPBasicCredentials = Depends(security)) -> None:
    """Simple HTTP Basic password check."""
    if ADMIN_PASSWORD is None:
        raise HTTPException(500, detail="ADMIN_PASSWORD not set")
    user_ok = secrets.compare_digest(creds.username, "admin")
    pass_ok = secrets.compare_digest(creds.password, ADMIN_PASSWORD)
    if not (user_ok and pass_ok):
        raise HTTPException(
            status_code=401,
            detail="Unauthorized",
            headers={"WWW-Authenticate": "Basic"},
        )

# ───────────────────────── Models endpoint ────────────────────────
class ModelInfo(BaseModel):
    name: str
    description: Optional[str] = None

@app.get("/models", response_model=List[ModelInfo])
async def list_models():
    """
    List all locally-pulled Ollama models.
    Returns [] if the daemon isn’t ready yet.
    """
    try:
        raw = client.list()
    except Exception as exc:
        log.warning("ollama.list failed: %s", exc)
        return []

    out: List[ModelInfo] = []
    seen = set()
    for m in raw.get("models", []):
        # normalize to dict
        md = m.model_dump() if hasattr(m, "model_dump") else m.dict() if hasattr(m, "dict") else m
        name = md.get("name") or ""
        # skip duplicates & the embedding model
        if not name or name in seen or name.startswith("nomic-embed-text"):
            continue
        seen.add(name)
        details = md.get("details", {}) or {}
        desc = ", ".join(
            p for p in [
                details.get("family",""),
                details.get("parameter_size",""),
                details.get("quantization_level",""),
            ] if p
        )
        out.append(ModelInfo(name=name, description=desc or None))

    return out

# ───────────────────────── Health check ─────────────────────────
class PingResponse(BaseModel):
    status: str = "ok"

@app.get("/ping", response_model=PingResponse)
async def ping():
    return PingResponse()

# ───────────────────────── Session store & RAG helpers ────────────────────
from app.ingestion      import load_and_split
from app.vector_store   import (
    SESSIONS_ROOT,
    get_session_store,
    new_session_store,
    purge_session_store,
    similarity_search,
)
from app.rerank         import rerank
from app.chat           import chat as chat_fn, new_session_id, safe_chat
from app.ollama_utils   import finalize_ollama_chat
from app.tokenizer      import count_tokens

_SESSIONS       : Dict[str, object]   = {}
_SESSIONS_TOUCH : Dict[str, datetime] = {}
_SESSIONS_LOCK  = asyncio.Lock()

def _calc_top_k(question: str) -> int:
    """Return retrieval K, optionally increased for longer questions."""
    base = SEARCH_TOP_K
    if DYNAMIC_K_FACTOR:
        base += count_tokens(question) // DYNAMIC_K_FACTOR
    return base

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

@app.on_event("startup")
async def _start_session_gc():
    async def _gc_loop():
        while True:
            await _purge_expired_sessions()
            await asyncio.sleep(60)
    asyncio.create_task(_gc_loop())

# ───────────────────────── RAG: permanent KB (+ session) ───────────────────
class QARequest(BaseModel):
    question:   str
    session_id: Optional[str] = None
    model:      Optional[str] = None

class SourceChunk(BaseModel):
    page_number: Optional[int] = None
    snippet: str


class QAResponse(BaseModel):
    answer: str
    sources: List[SourceChunk]

@app.post("/doc_qa", response_model=QAResponse)
async def doc_qa(req: QARequest):
    model = req.model or DEFAULT_MODEL

    try:
        k = _calc_top_k(req.question)
        docs = similarity_search(req.question, k=k, use_mmr=USE_MMR)
    except ValueError as e:
        # handle missing embed model
        raise HTTPException(503, detail=str(e))

    if req.session_id and (store := _SESSIONS.get(req.session_id)):
        docs += store.similarity_search(req.question, k=10)

    if not docs:
        return QAResponse(answer="I don't know.", sources=[])

    chunks     = [d.page_content for d in docs]
    try:
        top_chunks = rerank(req.question, chunks)
    except Exception as e:
        raise HTTPException(503, detail=str(e))
    ctx        = "\n---\n".join(top_chunks)[:TOK_TRUNCATE]

    sources: List[SourceChunk] = []
    for chunk in top_chunks:
        try:
            idx = chunks.index(chunk)
            doc = docs[idx]
            pg = doc.metadata.get("page_number") or doc.metadata.get("page")
        except ValueError:
            pg = None
        sources.append(SourceChunk(page_number=pg, snippet=chunk))

    prompt = (
        "You are EklavyaAI Mentor, a helpful assistant that answers by combining your knowledge with the provided document snippets.\n"
        "Always reference facts only if they appear in the context.\n"
        "Answer in English. If unsure, say 'I don't know.'\n\n"
        f"CONTEXT:\n{ctx}\n\nQUESTION: {req.question}\nANSWER:"
    )
    # prompt = (
    #     "You are a helpful assistant. Answer ONLY from the CONTEXT.\n"
    #     "Answer in English. If unsure, say 'I don't know.'\n\n"
    #     f"CONTEXT:\n{ctx}\n\nQUESTION: {req.question}\nANSWER:"
    # )

    raw    = safe_chat(model=model, messages=[{"role":"system","content":prompt}], stream=False)
    answer = finalize_ollama_chat(raw)["message"]["content"]

    return QAResponse(answer=answer, sources=sources)


# ───────────────────────── Chat w/ memory ──────────────────────────────
class ChatRequest(BaseModel):
    user_msg:   str
    session_id: Optional[str] = None
    model:      Optional[str] = None

class ChatResponse(BaseModel):
    session_id: str
    answer:     str

@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    session_id = req.session_id or new_session_id()
    model      = req.model or DEFAULT_MODEL

    try:
        # NOTE: chat_fn no longer passes temperature (python-ollama currently rejects it)
        answer = chat_fn(session_id, req.user_msg, model=model)
        await _touch_sid(session_id)
    except Exception as e:
        raise HTTPException(500, detail=str(e))

    return ChatResponse(session_id=session_id, answer=answer)


# ───────────────────────── Upload a PDF to session-only KB ─────────────────
class UploadPDFResponse(BaseModel):
    status:          str
    session_id:      str
    chunks_indexed:  int

@app.post("/upload_pdf", response_model=UploadPDFResponse)
async def upload_pdf(
    session_id: str = Query(..., description="Session ID to attach to"),
    file: UploadFile = File(..., description="PDF"),
):
    store = _SESSIONS.get(session_id) or new_session_store(session_id)
    _SESSIONS[session_id] = store

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = Path(tmp.name)

        chunks = load_and_split(str(tmp_path))
        store.add_documents(chunks)
        added = len(chunks)
        await _touch_sid(session_id)
    finally:
        file.file.close()
        tmp_path.unlink(missing_ok=True)

    return UploadPDFResponse(status="ok", session_id=session_id, chunks_indexed=added)


# ───────────────────────── End / purge session ─────────────────────────────
@app.delete("/session/{session_id}")
async def end_session(session_id: str):
    if (SESSIONS_ROOT/ session_id).exists() or session_id in _SESSIONS:
        purge_session_store(session_id)
        _SESSIONS.pop(session_id, None)
        _SESSIONS_TOUCH.pop(session_id, None)
        return {"status":"purged","session_id":session_id}
    raise HTTPException(404, detail=f"Session '{session_id}' not found")

# ───────────────────────── Session-scoped RAG ──────────────────────────────
class SessionQARequest(BaseModel):
    question:   str
    session_id: str
    persistent: Optional[bool] = True
    model:      Optional[str] = None

class SessionQAResponse(BaseModel):
    answer: str
    sources: List[SourceChunk]

@app.post("/session_qa", response_model=SessionQAResponse)
async def session_qa(req: SessionQARequest):
    model = req.model or DEFAULT_MODEL

    # re-open or create session store
    sess = _SESSIONS.get(req.session_id) or get_session_store(req.session_id)
    _SESSIONS[req.session_id] = sess

    k = _calc_top_k(req.question)
    if USE_MMR:
        sess_docs = sess.max_marginal_relevance_search(req.question, k=max(5, k // 2))
    else:
        sess_docs = sess.similarity_search(req.question, k=max(5, k // 2))
    persist_docs = [] if not req.persistent else similarity_search(req.question, k=k, use_mmr=USE_MMR)
    all_docs     = sess_docs + persist_docs

    if not all_docs:
        return SessionQAResponse(answer="I don't know.", sources=[])

    chunks     = [d.page_content for d in all_docs]
    try:
        top_chunks = rerank(req.question, chunks)
    except Exception as e:
        raise HTTPException(503, detail=str(e))
    ctx        = "\n---\n".join(top_chunks)[:TOK_TRUNCATE]

    sources: List[SourceChunk] = []
    for chunk in top_chunks:
        try:
            idx = chunks.index(chunk)
            doc = all_docs[idx]
            pg = doc.metadata.get("page_number") or doc.metadata.get("page")
        except ValueError:
            pg = None
        sources.append(SourceChunk(page_number=pg, snippet=chunk))

    prompt = (
        "You are EklavyaAI Mentor, a helpful assistant that answers by combining your knowledge with the provided document snippets.\n"
        "Always reference facts only if they appear in the context.\n"
        "Answer in English. If unsure, say 'I don't know.'\n\n"
        f"CONTEXT:\n{ctx}\n\nQUESTION: {req.question}\nANSWER:"
    )
    # prompt = (
    #     "You are a helpful assistant. Answer ONLY from the CONTEXT.\n"
    #     "Answer in English. If unsure, say 'I don't know.'\n\n"
    #     f"CONTEXT:\n{ctx}\n\nQUESTION: {req.question}\nANSWER:"
    # )

    raw    = safe_chat(model=model, messages=[{"role":"system","content":prompt}], stream=False)
    answer = finalize_ollama_chat(raw)["message"]["content"]
    await _touch_sid(req.session_id)

    return SessionQAResponse(answer=answer, sources=sources)


# ───────────────────────── Admin: upload persistent PDF ───────────────────
class AdminUploadResponse(BaseModel):
    status: str
    filename: str


@app.post("/admin/upload_pdf", response_model=AdminUploadResponse)
async def admin_upload_pdf(
    file: UploadFile = File(..., description="PDF"),
    _: None = Depends(_verify_admin),
):
    dest_dir = boot.PERSIST_PDF_DIR
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / file.filename

    try:
        with open(dest, "wb") as fh:
            shutil.copyfileobj(file.file, fh)
        boot._index_file(dest)
    finally:
        file.file.close()

    return AdminUploadResponse(status="ok", filename=file.filename)


# ───────────────────────── Proofread / Grammar check ────────────────────
class ProofreadRequest(BaseModel):
    text: str
    model: Optional[str] = None


class ProofreadResponse(BaseModel):
    corrected: str


@app.post("/proofread", response_model=ProofreadResponse)
async def proofread(req: ProofreadRequest):
    model = req.model or DEFAULT_MODEL
    prompt = (
        """You are a specialised grammar-checking assistant focused exclusively on verifying grammatical correctness as per British English standards. Your responsibilities include:

1. Checking all text provided by users strictly against British English grammar rules.
2. Correcting grammatical errors, punctuation mistakes, and minor stylistic inconsistencies.
3. Making only very slight adjustments to sentence structure when absolutely necessary for grammatical accuracy.
4. No use of em dashes.

Ensure your corrections are minimal, respecting the original wording and intent. You should maintain the user's original sentence style and meaning as closely as possible, providing a clear, grammatically correct text with minimal alterations.
"""
    )
    raw = safe_chat(model=model, messages=[{"role": "system", "content": prompt}, {"role": "user", "content": req.text}], stream=False)
    corrected = finalize_ollama_chat(raw)["message"]["content"].strip()
    return ProofreadResponse(corrected=corrected)

