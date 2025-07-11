"""
app.boot
────────
Runs **once** at FastAPI-startup:

• Walk through  PERSIST_PDF_DIR   (default: /app/data/persist)
• Skip any PDF already present in the persistent Chroma collection
• For new files →  load → chunk → embed → store  (metadata attached)
"""

from __future__ import annotations

import logging, os
from datetime import datetime
from pathlib import Path
from typing import List

from app.vector_store import add_documents, persist_has_source
from app.ingestion import load_and_split

# ───────────────────────── Config ──────────────────────────
PERSIST_PDF_DIR = Path(os.getenv("PERSIST_PDF_DIR", "/app/data/persist"))
PERSIST_PDF_DIR.mkdir(parents=True, exist_ok=True)

log = logging.getLogger("boot")
log.setLevel(logging.INFO)
log.addHandler(logging.StreamHandler())

# ───────────────────────── Helpers ─────────────────────────
def _index_file(pdf_path: Path) -> None:
    """Split, embed, and store one PDF."""
    log.info("🔄  indexing %s", pdf_path.name)
    chunks = load_and_split(str(pdf_path))

    # attach minimal metadata for re-ingest check & provenance
    now = datetime.utcnow().isoformat()
    for c in chunks:
        c.metadata |= {"source": pdf_path.name, "indexed_at": now}

    add_documents(chunks)
    log.info("✅  stored %-4d chunks for %s", len(chunks), pdf_path.name)


# ───────────────────────── Public entry ─────────────────────
def run() -> None:
    """Index any yet-unseen PDFs under PERSIST_PDF_DIR."""
    pdfs: List[Path] = sorted(PERSIST_PDF_DIR.glob("*.pdf"))
    if not pdfs:
        log.info("📂  %s empty – nothing to index.", PERSIST_PDF_DIR)
        return

    for pdf in pdfs:
        if persist_has_source(str(pdf)):
            log.debug("↪︎  already indexed: %s", pdf.name)
            continue

        try:
            _index_file(pdf)
        except Exception as exc:
            # do **not** abort boot – just record the failure
            log.exception("❌  failed to index %s: %s", pdf.name, exc)
