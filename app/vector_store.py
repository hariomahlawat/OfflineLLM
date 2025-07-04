# app/vector_store.py
"""
Persistent Chroma wrapper with Ollama embeddings.
"""

from pathlib import Path
import os
import chromadb
from chromadb.config import Settings
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
from typing import List

CHROMA_DIR = Path("data/chroma")
CHROMA_DIR.mkdir(parents=True, exist_ok=True)

# ------------------------------------------------------------------
# Use the service name “ollama” instead of 127.0.0.1
# (override via OLLAMA_BASE_URL if you ever need a different host)
# ------------------------------------------------------------------
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")

_client = chromadb.PersistentClient(
    path=str(CHROMA_DIR),
    settings=Settings(allow_reset=True, anonymized_telemetry=False),
)
_ollama = OllamaEmbeddings(
    model="nomic-embed-text",
    base_url=OLLAMA_BASE_URL,
)
_vector_store = Chroma(
    client=_client,
    collection_name="docs",
    embedding_function=_ollama,
)


# ---------------- API helpers ----------------
def add_documents(chunks: List[Document]) -> None:
    """Add a list of LangChain Documents to the vector store."""
    _vector_store.add_documents(chunks)


def similarity_search(query: str, k: int = 10) -> List[Document]:
    """Return top-k similar chunks for *query*."""
    return _vector_store.similarity_search(query, k=k)


def as_retriever():
    """Expose a Retriever object (for later use in LLM chains)."""
    return _vector_store.as_retriever(search_kwargs={"k": 10})
