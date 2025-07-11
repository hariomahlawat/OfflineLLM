"""
app.ingestion
─────────────
PDF → text-chunk utilities, used by boot-time ingest and /upload_pdf.
"""

from __future__ import annotations

import logging, os, tempfile
from io import BytesIO
from pathlib import Path
from typing import List

from langchain_community.document_loaders import PyPDFLoader
from langchain.schema import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

# ───────────────────────── Configuration ──────────────────────────
def _clamped_int(env_key: str, default: int, lo: int, hi: int) -> int:
    try:
        val = int(os.getenv(env_key, default))
    except ValueError:
        return default
    return max(lo, min(val, hi))

DEFAULT_CHUNK_SIZE = _clamped_int("CHUNK_SIZE", 800, 100, 2000)
DEFAULT_CHUNK_OVERLAP = _clamped_int("CHUNK_OVERLAP", 100, 0, DEFAULT_CHUNK_SIZE - 1)

log = logging.getLogger("ingestion")
log.setLevel(logging.INFO)

# ───────────────────────── Split helper ───────────────────────────
def _split(
    pages: List[Document],
    chunk_size: int,
    overlap: int,
) -> List[Document]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=overlap,
    )
    return splitter.split_documents(pages)

# ───────────────────────── Disk-based PDFs ────────────────────────
def load_and_split(
    file_path: str | Path,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> List[Document]:
    """
    Read *file_path* (PDF), split into text chunks for embedding.

    Returns list[Document] with `.page_content` and `.metadata`.
    """
    try:
        pages = PyPDFLoader(str(file_path)).load()
    except Exception as exc:
        raise ValueError(f"Failed to load PDF '{file_path}': {exc}") from exc

    chunks = _split(pages, chunk_size, overlap)
    for c in chunks:
        c.metadata |= {"source_file": str(file_path)}
    log.info("📄  split %d chunks from %s", len(chunks), file_path)
    return chunks

# ───────────────────────── In-memory PDFs ─────────────────────────
def load_and_split_bytes(
    data: bytes,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> List[Document]:
    """
    Same as `load_and_split`, but takes a PDF byte string (used in /upload_pdf).
    """
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(data)
        tmp_path = Path(tmp.name)

    try:
        pages = PyPDFLoader(str(tmp_path)).load()
    except Exception as exc:
        tmp_path.unlink(missing_ok=True)
        raise ValueError(f"Failed to load PDF bytes: {exc}") from exc

    chunks = _split(pages, chunk_size, overlap)
    for c in chunks:
        c.metadata |= {"source_file": "<uploaded-pdf>"}

    tmp_path.unlink(missing_ok=True)
    log.info("📄  split %d chunks from uploaded PDF", len(chunks))
    return chunks
