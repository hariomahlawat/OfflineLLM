# app/vector_store.py
"""
Vector-store abstraction layer.

* `persistent_store`  – holds embeddings for PDFs placed in  data/persist/
* `new_session_store(session_id)` – returns a Chroma instance dedicated to
  one chat-session; delete the collection when the session is closed.
"""

from pathlib import Path
from typing import List

import chromadb
from chromadb.config import Settings
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document

# --------------------------------------------------------------------------
# configuration
# --------------------------------------------------------------------------
PERSIST_PATH   = Path("data/chroma_persist")
SESSIONS_ROOT  = Path("data/chroma_sessions")
EMBEDDINGS = OllamaEmbeddings(
    model="nomic-embed-text",
    base_url="http://ollama:11434",
)

# make sure directories exist
PERSIST_PATH.mkdir(parents=True, exist_ok=True)
SESSIONS_ROOT.mkdir(parents=True, exist_ok=True)

# --------------------------------------------------------------------------
# permanent store  (indexed at startup by app.boot)
# --------------------------------------------------------------------------
_persist_client = chromadb.PersistentClient(
    path=str(PERSIST_PATH),
    settings=Settings(allow_reset=False, anonymized_telemetry=False),
)

persistent_store = Chroma(
    client=_persist_client,
    collection_name="persistent_docs",
    embedding_function=EMBEDDINGS,
)

# convenience helper – was useful in boot-strap
def persist_has_source(src: str) -> bool:
    """True if *src* (usually the PDF filename) already indexed."""
    return any(md.get("source") == src for md in persistent_store.get()["metadatas"])

# --------------------------------------------------------------------------
# session-scoped store
# --------------------------------------------------------------------------
def new_session_store(session_id: str) -> Chroma:
    """
    Create (or reopen) a Chroma collection dedicated to a chat-session.
    Call `store._collection.delete_collection()` when the session ends.
    """
    sess_path = SESSIONS_ROOT / session_id
    sess_path.mkdir(parents=True, exist_ok=True)

    client = chromadb.PersistentClient(
        path=str(sess_path),
        settings=Settings(allow_reset=True, anonymized_telemetry=False),
    )
    return Chroma(
        client=client,
        collection_name=f"session_{session_id}",
        embedding_function=EMBEDDINGS,
    )

# --------------------------------------------------------------------------
# thin helper wrappers (for backwards-compat)
# --------------------------------------------------------------------------
def add_documents(chunks: List[Document]) -> None:
    persistent_store.add_documents(chunks)

def similarity_search(query: str, k: int = 10) -> List[Document]:
    return persistent_store.similarity_search(query, k=k)
