# app/ingestion.py
# PDF ingestion and processing utilities

"""
PDF loader and text splitter utilities.
"""

from io import BytesIO
from typing import List
import os

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.schema import Document

DEFAULT_CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "800"))
DEFAULT_CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "100"))


# ────────────────────────────────────────────────────────────────────────────────
# Common splitter
# ────────────────────────────────────────────────────────────────────────────────
def _split(pages: List[Document], *, chunk_size: int, overlap: int) -> List[Document]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=overlap,
    )
    return splitter.split_documents(pages)


# ────────────────────────────────────────────────────────────────────────────────
# 1) Disk-based PDFs (unchanged)
# ────────────────────────────────────────────────────────────────────────────────
def load_and_split(
    file_path: str,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> List[Document]:
    """
    Load a PDF from *file_path* and return a list of LangChain Document
    chunks ready for embedding.

    Each Document has .page_content (text) and .metadata (page number, file).
    """
    pages = PyPDFLoader(file_path).load()  # one Document per page
    chunks = _split(pages, chunk_size=chunk_size, overlap=overlap)

    # augment metadata for easier tracing later
    for c in chunks:
        c.metadata["source_file"] = file_path
    return chunks


# ────────────────────────────────────────────────────────────────────────────────
# 2) In-memory PDFs (for /upload_pdf)
# ────────────────────────────────────────────────────────────────────────────────
def load_and_split_bytes(
    data: bytes,
    chunk_size: int = 800,
    overlap: int = 100,
) -> List[Document]:
    """
    Same as `load_and_split`, but accepts a PDF **byte stream**—handy for
    ephemeral uploads where we don’t want to write the file to disk.
    """
    try:
        pages = PyPDFLoader(BytesIO(data)).load()
    except Exception as e:
        raise ValueError(f"Pdf load failed: {e}") from e

    chunks = _split(pages, chunk_size=chunk_size, overlap=overlap)

    # metadata: mark these as “memory” so we can recognise the source later
    for c in chunks:
        c.metadata["source_file"] = "<uploaded-pdf>"
    return chunks
