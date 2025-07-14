# app/boot.py

"""
Run once at process start-up:
• Walk through /app/data/persist looking for *.pdf
• Skip any file already indexed
• Ingest → chunk → embed → store
"""

import asyncio
import logging
import time
from pathlib import Path
from datetime import datetime

from app.vector_store import new_persistent_store, persist_has_source
from app.ingestion import load_and_split

PERSIST_PDF_DIR = Path("/app/data/persist")
PERSIST_PDF_DIR.mkdir(parents=True, exist_ok=True)

log = logging.getLogger("boot")
log.setLevel(logging.INFO)

def _index_file(pdf_path: Path) -> None:
    log.info("🔄  indexing %s", pdf_path.name)
    start = time.perf_counter()
    store = new_persistent_store()
    chunks = load_and_split(str(pdf_path))
    if not chunks:
        log.warning("⚠️  no text extracted from %s – skipping", pdf_path.name)
        return
    for c in chunks:
        c.metadata["source"] = pdf_path.name
        c.metadata["indexed_at"] = datetime.utcnow().isoformat()
    try:
        store.add_documents(chunks)
        store.persist()
        dur = time.perf_counter() - start
        log.info("✅  stored %d chunks for %s in %.2fs", len(chunks), pdf_path.name, dur)
    except ValueError as exc:
        log.error("❌  failed to store embeddings for %s: %s", pdf_path.name, exc)
    finally:
        del store

async def run() -> None:
    pdfs = sorted(PERSIST_PDF_DIR.glob("*.pdf"))
    if not pdfs:
        log.info("📂  no PDFs found – skipping indexing")
        return

    async def worker(pdf: Path) -> None:
        if persist_has_source(pdf.name):
            log.debug("↪︎  already indexed: %s", pdf.name)
            return
        try:
            await asyncio.to_thread(_index_file, pdf)
        except Exception:
            log.exception("❌  failed to index %s", pdf.name)

    await asyncio.gather(*(worker(pdf) for pdf in pdfs))

if __name__ == "__main__":
    asyncio.run(run())
