# app/boot.py

"""
Run once at process start-up:
• Walk through /app/data/persist looking for *.pdf
• Skip any file already indexed
• Ingest → chunk → embed → store
"""

import logging
from pathlib import Path
from datetime import datetime

from app.vector_store import add_documents, persist_has_source
from app.ingestion import load_and_split

PERSIST_PDF_DIR = Path("/app/data/persist")
PERSIST_PDF_DIR.mkdir(parents=True, exist_ok=True)

log = logging.getLogger("boot")
log.setLevel(logging.INFO)

def _index_file(pdf_path: Path) -> None:
    log.info("🔄  indexing %s", pdf_path.name)
    chunks = load_and_split(str(pdf_path))
    if not chunks:
        log.warning("⚠️  no text extracted from %s – skipping", pdf_path.name)
        return
    for c in chunks:
        c.metadata["source"] = pdf_path.name
        c.metadata["indexed_at"] = datetime.utcnow().isoformat()

    if add_documents(chunks):
        log.info("✅  stored %d chunks for %s", len(chunks), pdf_path.name)
    else:
        log.warning("↪︎  skipped %s due to embedding failure", pdf_path.name)

def run() -> None:
    pdfs = sorted(PERSIST_PDF_DIR.glob("*.pdf"))
    if not pdfs:
        log.info("📂  no PDFs found – skipping indexing")
        return

    for pdf in pdfs:
        if persist_has_source(pdf.name):
            log.debug("↪︎  already indexed: %s", pdf.name)
            continue
        try:
            _index_file(pdf)
        except Exception:
            log.exception("❌  failed to index %s", pdf.name)

if __name__ == "__main__":
    run()
