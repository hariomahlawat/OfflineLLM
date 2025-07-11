"""
app.rerank
──────────
Lightweight cross-encoder reranker.

Env vars
────────
CROSS_ENCODER_DIR   →  on-disk model path  (default /app/models/cross_encoder)
RERANK_TOP_K        →  default K to return (int, default 3)
"""

from __future__ import annotations

import logging, os, time
from functools import lru_cache
from typing import List

from sentence_transformers import CrossEncoder

MODEL_DIR = os.getenv("CROSS_ENCODER_DIR", "/app/models/cross_encoder")
DEFAULT_TOP_K = int(os.getenv("RERANK_TOP_K", "3"))

log = logging.getLogger("rerank")
log.setLevel(logging.INFO)

# ───────────────────────── Lazy loader ───────────────────────────
@lru_cache(maxsize=1)
def _cross() -> CrossEncoder | None:
    """
    Load the cross-encoder once, cached.

    Returns None if the directory is missing → downstream caller will
    fall back to naive ranking instead of crashing.
    """
    if not os.path.exists(MODEL_DIR):
        log.warning("Cross-encoder dir %s not found – skipping rerank.", MODEL_DIR)
        return None

    t0 = time.perf_counter()
    try:
        model = CrossEncoder(MODEL_DIR, device="cpu", local_files_only=True)
        log.info("Cross-encoder loaded from %s (%.2f s)", MODEL_DIR, time.perf_counter() - t0)
        return model
    except Exception as exc:  # pragma: no cover
        log.error("Failed to load cross-encoder at %s: %s", MODEL_DIR, exc)
        return None

# ───────────────────────── Public API ────────────────────────────
def rerank(query: str, docs: List[str], top_k: int = DEFAULT_TOP_K) -> List[str]:
    """
    Return the top-k docs ranked by CrossEncoder score.

    If the model is unavailable, returns the first k docs unchanged.
    """
    model = _cross()
    k = min(top_k, len(docs))  # guard against >len(docs)

    if model is None or not docs:
        return docs[:k]

    scores = model.predict([[query, d] for d in docs])  # ndarray[float]
    ranked = sorted(zip(docs, scores), key=lambda x: x[1], reverse=True)
    return [d for d, _ in ranked[:k]]
