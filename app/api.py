# app/api.py

"""
FastAPI routes
──────────────
* /ping                 – health-check
* /chat                 – chat w/ conversation memory
* /doc_qa               – RAG answer from permanent KB (+ session KB)
* /upload_pdf           – (multipart) add a PDF **only** to this session
* /session/{id} DELETE  – purge session vector-store
"""

import app.boot                                  # side-effect: index /data/persist

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional

from app.ingestion import load_and_split
from app.vector_store import (
    similarity_search,
    new_session_store,
    purge_session_store,
)
from app.rerank import rerank
from app.chat import chat as chat_fn, new_session_id, MODEL_NAME

import ollama
from uuid import uuid4
from pathlib import Path
import tempfile
import shutil

# ────────────────────────────────────────────────────────────────────────────────
app = FastAPI(title="OfflineLLM API", version="0.2.0")
# in-memory cache of live Chroma handles per session
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
    # 1️⃣ retrieve from permanent KB
    docs_perm = similarity_search(req.question, k=10)

    # 2️⃣ also search the session KB if it exists
    docs_session = []
    if req.session_id and req.session_id in _SESSION_STORES:
        docs_session = _SESSION_STORES[req.session_id].similarity_search(
            req.question, k=10
        )

    merged = docs_perm + docs_session
    if not merged:
        return QAResponse(answer="I don't know.", sources=[])

    # 3️⃣ re-rank
    top_chunks = rerank(req.question, [d.page_content for d in merged], top_k=3)

    # 4️⃣ LLM call
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
        raise HTTPException(500, str(e))

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
        raise HTTPException(500, str(e))
    return ChatResponse(session_id=session_id, answer=answer)


# ───────────────────────── Upload one PDF (ephemeral) ──────
@app.post("/upload_pdf")
async def upload_pdf(
    session_id: str,
    file: UploadFile = File(..., description="PDF to add only for this session"),
):
    # lazily create a session store
    store = _SESSION_STORES.get(session_id)
    if store is None:
        store = _SESSION_STORES[session_id] = new_session_store(session_id)

    # save to tmp -> ingest -> delete
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = Path(tmp.name)

        chunks = load_and_split(str(tmp_path))
        store.add_documents(chunks)
        added = len(chunks)
    except Exception as e:
        raise HTTPException(400, f"Failed to ingest PDF: {e}")
    finally:
        file.file.close()
        tmp_path.unlink(missing_ok=True)

    return JSONResponse(
        {"status": "ok", "session_id": session_id, "chunks_indexed": added}
    )


# ───────────────────────── Delete / end session ────────────
@app.delete("/session/{session_id}")
async def end_session(session_id: str):
    # drop vector store
    purge_session_store(session_id)
    _SESSION_STORES.pop(session_id, None)
    # (chat memory lives only in RAM – will be GC’d)
    return JSONResponse({"status": "purged", "session_id": session_id})
