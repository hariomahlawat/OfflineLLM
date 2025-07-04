# app/ingestion.py
"""
PDF loader and text splitter utilities.
"""

from typing import List
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.schema import Document


def load_and_split(
    file_path: str,
    chunk_size: int = 800,
    overlap: int = 100,
) -> List[Document]:
    """
    Load a PDF from *file_path* and return a list of LangChain Document
    chunks ready for embedding.

    Each Document has .page_content (text) and .metadata (page number, file).
    """
    pages = PyPDFLoader(file_path).load()          # one Document per page
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=overlap,
    )
    chunks = splitter.split_documents(pages)
    # augment metadata for easier tracing later
    for c in chunks:
        c.metadata["source_file"] = file_path
    return chunks
