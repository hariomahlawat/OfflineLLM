# app/boot.py
"""
Run *once* at process start-up:

• Walk through data/persist/ looking for *.pdf
• Skip any file that is already present in the persistent collection
• Ingest -> chunk -> embed -> store
"""

from pathlib import Path
import logging
from datetime import datetime

from app.vector_store import add_documents, persist_has_source
from app.ingestion import load_and_split   # existing helper

PERSIST_PDF_DIR = Path("data/persist")      # ‹--- put your long-lived PDFs here
PERSIST_PDF_DIR.mkdir(parents=True, exist_ok=True)

log = logging.getLogger("boot")
log.setLevel(logging.INFO)

def _index_file(pdf_path: Path) -> None:
    log.info("🔄  indexing %s", pdf_path.name)
    chunks = load_and_split(str(pdf_path))
    # attach metadata so we can later check persist_has_source()
    for c in chunks:
        c.metadata["source"] = pdf_path.name
        c.metadata["indexed_at"] = datetime.utcnow().isoformat()
    add_documents(chunks)
    log.info("✅  stored %s chunks for %s", len(chunks), pdf_path.name)

def run() -> None:
    pdfs = sorted(PERSIST_PDF_DIR.glob("*.pdf"))
    if not pdfs:
        log.info("📂  data/persist/ empty – nothing to index.")
        return

    for pdf in pdfs:
        if persist_has_source(pdf.name):
            log.debug("↪︎  already indexed: %s", pdf.name)
            continue
        try:
            _index_file(pdf)
        except Exception as exc:            # keep boot resilient
            log.exception("❌  failed to index %s: %s", pdf.name, exc)

# run immediately on import
run()
