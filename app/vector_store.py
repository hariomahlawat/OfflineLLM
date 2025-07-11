"""
Vector-store abstraction layer
──────────────────────────────
• persistent_store         – embeddings for PDFs in  data/persist/
• new_session_store(id)    – Chroma handle dedicated to ONE chat session
• purge_session_store(id)  – drop the collection + files for that session
"""

from __future__ import annotations

import functools, logging, os, shutil
from pathlib import Path
from typing import List

import chromadb
from chromadb.config import Settings
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document

# ───────────────────────── Configuration ──────────────────────────
PERSIST_PATH   = Path(os.getenv("PERSIST_CHROMA_DIR",   "/app/data/chroma_persist"))
SESSIONS_ROOT  = Path(os.getenv("SESSION_CHROMA_DIR",   "/app/data/chroma_sessions"))
OLLAMA_URL     = os.getenv("OLLAMA_HOST",               "http://ollama:11434")

PERSIST_PATH.mkdir(parents=True, exist_ok=True)
SESSIONS_ROOT.mkdir(parents=True, exist_ok=True)

log = logging.getLogger("vector_store")
log.setLevel(logging.INFO)

# lazy embedding client – avoids ConnectionRefused if Ollama still boots
@functools.lru_cache(maxsize=1)
def _emb() -> OllamaEmbeddings:
    log.info("📐  loading embedding model 'nomic-embed-text'")
    return OllamaEmbeddings(model="nomic-embed-text", base_url=OLLAMA_URL)

# ───────────────────────── Permanent store ────────────────────────
try:
    _persist_cli = chromadb.PersistentClient(
        path=str(PERSIST_PATH),
        settings=Settings(allow_reset=False, anonymized_telemetry=False),
    )
    persistent_store: Chroma = Chroma(
        client=_persist_cli,
        collection_name="persistent_docs",
        embedding_function=_emb(),
    )
    log.info("📚  persistent Chroma opened at %s", PERSIST_PATH)
except Exception as exc:                      # pragma: no cover
    log.error("⚠️  failed to open Chroma at %s (%s) – using in-mem fallback", PERSIST_PATH, exc)
    persistent_store = Chroma(
        collection_name="fallback",
        embedding_function=_emb(),
    )

def persist_has_source(src: str) -> bool:
    """True if *src* already indexed in permanent KB."""
    return any(m.get("source_file") == src for m in persistent_store.get()["metadatas"])

# ───────────────────────── Session-scoped stores ──────────────────
def _session_path(session_id: str) -> Path:
    return SESSIONS_ROOT / session_id

def new_session_store(session_id: str) -> Chroma:
    path = _session_path(session_id)
    path.mkdir(parents=True, exist_ok=True)
    cli = chromadb.PersistentClient(
        path=str(path), settings=Settings(allow_reset=True, anonymized_telemetry=False)
    )
    log.info("💾  session store %s opened at %s", session_id, path)
    return Chroma(
        client=cli,
        collection_name=f"session_{session_id}",
        embedding_function=_emb(),
    )

def purge_session_store(session_id: str) -> None:
    path = _session_path(session_id)
    try:
        chromadb.PersistentClient(path=str(path)).reset()
    except Exception:
        pass
    shutil.rmtree(path, ignore_errors=True)
    log.info("🗑️  purged session store %s", session_id)

def get_session_store(session_id: str) -> Chroma:
    path = _session_path(session_id)
    if not path.exists():
        raise ValueError(f"Session '{session_id}' not found")
    cli = chromadb.PersistentClient(
        path=str(path), settings=Settings(allow_reset=False, anonymized_telemetry=False)
    )
    return Chroma(
        client=cli,
        collection_name=f"session_{session_id}",
        embedding_function=_emb(),
    )

# ───────────────────────── Thin wrappers (legacy) ─────────────────
def add_documents(chunks: List[Document]) -> None:
    persistent_store.add_documents(chunks)

def similarity_search(query: str, k: int = 10) -> List[Document]:
    if persistent_store._collection.count() == 0:
        raise ValueError("The vector store is empty. Please ingest documents first.")
    return persistent_store.similarity_search(query, k=k)


