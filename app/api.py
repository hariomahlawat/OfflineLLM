# app/api.py

"""
FastAPI routes
──────────────
* /ping                 – health-check
* /chat                 – chat w/ conversation memory
* /doc_qa               – RAG answer from permanent KB (+ session KB)
* /upload_pdf           – (multipart) add a PDF **only** to this session
* /session/{id} DELETE  – purge session vector-store
* /session_qa           – RAG over session + persistent KB
"""

import tempfile, shutil
from pathlib import Path
from uuid import uuid4
from typing import List, Optional

from fastapi import FastAPI, File, UploadFile, Query, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

import ollama

import app.boot                                # side‐effect: index /data/persist
from app.ingestion import load_and_split
from app.vector_store import (
    similarity_search,
    new_session_store,
    purge_session_store,
    get_session_store,
)
from app.rerank import rerank
from app.chat import chat as chat_fn, new_session_id, MODEL_NAME

# ────────────────────────────────────────────────────────────────────────────────
app = FastAPI(title="OfflineLLM API", version="0.2.0")
# in‐memory cache of live Chroma handles per session
_SESSION_STORES = {}


# ───────────────────────── ping ────────────────────────────
class PingResponse(BaseModel):
    status: str = "ok"

@app.get("/ping", response_model=PingResponse)
async def ping():
    return PingResponse()


# ───────────────────────── RAG (permanent + session KB) ────
class QARequest(BaseModel):
    question: str
    session_id: Optional[str] = None

class QAResponse(BaseModel):
    answer: str
    sources: List[str]

@app.post("/doc_qa", response_model=QAResponse)
async def doc_qa(req: QARequest):
    # 1️⃣ search permanent KB
    docs = similarity_search(req.question, k=10)

    # 2️⃣ optionally search session KB
    if req.session_id:
        store = _SESSION_STORES.get(req.session_id)
        if store:
            docs += store.similarity_search(req.question, k=10)

    if not docs:
        return QAResponse(answer="I don't know.", sources=[])

    # 3️⃣ rerank
    chunks = [d.page_content for d in docs]
    top_chunks = rerank(req.question, chunks, top_k=3)

    # 4️⃣ call Ollama
    sep = "\n---\n"
    prompt = (
        "You are a helpful assistant. Answer ONLY from the CONTEXT.\n"
        "If unsure, say 'I don't know.'\n\n"
        f"CONTEXT:\n{sep.join(top_chunks)}\n\n"
        f"QUESTION: {req.question}\nANSWER:"
    )
    try:
        reply = ollama.chat(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
            stream=False,
        )
        answer = reply["message"]["content"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return QAResponse(answer=answer, sources=top_chunks)


# ───────────────────────── Chat (unchanged) ────────────────
class ChatRequest(BaseModel):
    user_msg: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    session_id: str
    answer: str

@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    session_id = req.session_id or new_session_id()
    try:
        answer = chat_fn(session_id, req.user_msg)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return ChatResponse(session_id=session_id, answer=answer)


# ───────────────────────── Upload one PDF (ephemeral) ──────
class UploadPDFResponse(BaseModel):
    status: str
    session_id: str
    chunks_indexed: int

@app.post("/upload_pdf", response_model=UploadPDFResponse)
async def upload_pdf(
    session_id: str = Query(..., description="Tie this PDF to an existing session"),
    file: UploadFile = File(..., description="PDF to add only for this session"),
):
    # create session store lazily
    store = _SESSION_STORES.get(session_id)
    if store is None:
        store = new_session_store(session_id)
        _SESSION_STORES[session_id] = store

    # write to temp file, ingest, then delete
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = Path(tmp.name)

        chunks = load_and_split(str(tmp_path))
        store.add_documents(chunks)
        added = len(chunks)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to ingest PDF: {e}")
    finally:
        file.file.close()
        tmp_path.unlink(missing_ok=True)

    return UploadPDFResponse(status="ok", session_id=session_id, chunks_indexed=added)


# ───────────────────────── Delete / end session ────────────
@app.delete("/session/{session_id}")
async def end_session(session_id: str):
    purge_session_store(session_id)
    _SESSION_STORES.pop(session_id, None)
    return JSONResponse({"status": "purged", "session_id": session_id})


# ───────────────────────── Session-scoped RAG  ─────────────
class SessionQARequest(BaseModel):
    question: str
    session_id: str

class SessionQAResponse(BaseModel):
    answer: str
    sources: List[str]

@app.post("/session_qa", response_model=SessionQAResponse)
async def session_qa(req: SessionQARequest):
    # 1️⃣ gather session + persistent docs
    sess_store = get_session_store(req.session_id)
    sess_docs = sess_store.similarity_search(req.question, k=5)
    persist_docs = similarity_search(req.question, k=10)

    all_docs = sess_docs + persist_docs
    if not all_docs:
        return SessionQAResponse(answer="I don't know.", sources=[])

    # 2️⃣ rerank
    chunks = [d.page_content for d in all_docs]
    top_chunks = rerank(req.question, chunks, top_k=3)

    # 3️⃣ ask Ollama
    sep = "\n---\n"
    prompt = (
        "You are a helpful assistant. Answer ONLY from the CONTEXT.\n"
        "If unsure, say 'I don't know.'\n\n"
        f"CONTEXT:\n{sep.join(top_chunks)}\n\n"
        f"QUESTION: {req.question}\nANSWER:"
    )
    try:
        reply = ollama.chat(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
            stream=False,
        )
        answer = reply["message"]["content"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return SessionQAResponse(answer=answer, sources=top_chunks)
