# app/vector_store.py

"""
Vector-store abstraction layer
──────────────────────────────
• persistent_store         – embeddings for PDFs in  data/persist/
• new_session_store(id)    – Chroma handle dedicated to ONE chat session
• purge_session(id)        – drop the collection + files for that session
"""

from __future__ import annotations

from pathlib import Path
from typing import List

import chromadb
from chromadb.config import Settings
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document

import shutil

# ────────────────────────────────────────────────────────────────────────────────
# Config ─ pick up dirs & Ollama URL from env if the defaults are wrong.
# ────────────────────────────────────────────────────────────────────────────────
from os import getenv

PERSIST_PATH = Path(getenv("PERSIST_CHROMA_DIR", "data/chroma_persist"))
SESSIONS_ROOT = Path(getenv("SESSION_CHROMA_DIR", "data/chroma_sessions"))

OLLAMA_URL = getenv("OLLAMA_BASE_URL", "http://ollama:11434")
EMBEDDINGS = OllamaEmbeddings(model="nomic-embed-text", base_url=OLLAMA_URL)

PERSIST_PATH.mkdir(parents=True, exist_ok=True)
SESSIONS_ROOT.mkdir(parents=True, exist_ok=True)

# ────────────────────────────────────────────────────────────────────────────────
# 1) 𝙿𝚎𝚛𝚖𝚊𝚗𝚎𝚗𝚝 𝚟𝚎𝚌𝚝𝚘𝚛 store  – indexed once at boot
# ────────────────────────────────────────────────────────────────────────────────
_persist_cli = chromadb.PersistentClient(
    path=str(PERSIST_PATH),
    settings=Settings(allow_reset=False, anonymized_telemetry=False),
)

persistent_store: Chroma = Chroma(
    client=_persist_cli,
    collection_name="persistent_docs",
    embedding_function=EMBEDDINGS,
)


def persist_has_source(src: str) -> bool:
    """Return *True* if the given PDF (metadata 'source_file') is already in the
    permanent collection – used during boot to avoid double-ingest."""
    return any(m.get("source_file") == src for m in persistent_store.get()["metadatas"])


# ────────────────────────────────────────────────────────────────────────────────
# 2) 𝚂𝚎𝚜𝚜𝚒𝚘𝚗-𝚜𝚌𝚘𝚙𝚎𝚍 stores  – one per chat tab / API session
# ────────────────────────────────────────────────────────────────────────────────
def _session_path(session_id: str) -> Path:
    """Return the on-disk folder for *session_id*."""
    return SESSIONS_ROOT / session_id


def new_session_store(session_id: str) -> Chroma:
    """
    Open (or create) a Chroma collection backed by its own SQLite+parquet files.

    ⚠️  IMPORTANT: Call `purge_session_store(session_id)` when the chat ends
    to delete both the collection and the cached embeddings on disk.
    """
    path = _session_path(session_id)
    path.mkdir(parents=True, exist_ok=True)

    cli = chromadb.PersistentClient(
        path=str(path),
        settings=Settings(allow_reset=True, anonymized_telemetry=False),
    )
    return Chroma(
        client=cli,
        collection_name=f"session_{session_id}",
        embedding_function=EMBEDDINGS,
    )


def purge_session_store(session_id: str) -> None:
    """Delete the on-disk DB for *session_id* – atomic and safe to call twice."""
    path = _session_path(session_id)
    if path.exists():
        # remove dir + everything inside in one go
        import shutil
        shutil.rmtree(path, ignore_errors=True)


def get_session_store(session_id: str) -> Chroma:
    """
    Re-open an existing session store WITHOUT resetting its contents.
    Raises if the session folder doesn’t exist.
    """
    path = SESSIONS_ROOT / session_id
    if not path.exists():
        raise ValueError(f"Session '{session_id}' not found")
    client = chromadb.PersistentClient(
        path=str(path),
        settings=Settings(allow_reset=False, anonymized_telemetry=False),
    )
    return Chroma(
        client=client,
        collection_name=f"session_{session_id}",
        embedding_function=EMBEDDINGS,
    )



# ────────────────────────────────────────────────────────────────────────────────
# Thin wrappers kept for older code paths
# ────────────────────────────────────────────────────────────────────────────────
def add_documents(chunks: List[Document]) -> None:
    """Add docs to the *persistent* store (legacy helper)."""
    persistent_store.add_documents(chunks)


def similarity_search(query: str, k: int = 10, *, use_mmr: bool = False) -> List[Document]:
    """Query the permanent knowledge base."""
    if use_mmr:
        return persistent_store.max_marginal_relevance_search(query, k=k)
    return persistent_store.similarity_search(query, k=k)



