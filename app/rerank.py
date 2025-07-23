# app/rerank.py
from functools import lru_cache
from typing import List
import os
import logging
from sentence_transformers import CrossEncoder

MODEL_DIR = os.getenv("CROSS_ENCODER_DIR", "/app/models/cross_encoder")
DEVICE = os.getenv("CROSS_ENCODER_DEVICE", "cpu")

DEFAULT_TOP_K = int(os.getenv("RERANK_TOP_K", "3"))

#MODEL_NAME = "cross-encoder/ms-marco-MiniLM-L-6-v2"

@lru_cache(maxsize=1)
def _cross() -> CrossEncoder:
    """Return a cached cross-encoder instance."""
    try:
        logging.info("Loading cross-encoder from %s on %s", MODEL_DIR, DEVICE)
        return CrossEncoder(MODEL_DIR, device=DEVICE, local_files_only=True)
    except OSError as exc:
        logging.warning("Cross-encoder model missing at %s: %s", MODEL_DIR, exc)
        raise RuntimeError(f"cross-encoder model not found in {MODEL_DIR}") from exc

def rerank(query: str, docs: List[str], top_k: int = DEFAULT_TOP_K) -> List[str]:
    scores = _cross().predict([[query, d] for d in docs])
    ranked = sorted(zip(docs, scores), key=lambda x: x[1], reverse=True)
    return [d for d, _ in ranked[:top_k]]
