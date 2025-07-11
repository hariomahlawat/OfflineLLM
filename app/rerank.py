# app/rerank.py
from functools import lru_cache
from typing import List
import os
from sentence_transformers import CrossEncoder

MODEL_DIR = os.getenv("CROSS_ENCODER_DIR", "/app/models/cross_encoder")

DEFAULT_TOP_K = int(os.getenv("RERANK_TOP_K", "3"))

#MODEL_NAME = "cross-encoder/ms-marco-MiniLM-L-6-v2"

@lru_cache(maxsize=1)
def _cross() -> CrossEncoder:
    return CrossEncoder(MODEL_DIR, device="cpu", local_files_only=True)

def rerank(query: str, docs: List[str], top_k: int = DEFAULT_TOP_K) -> List[str]:
    scores = _cross().predict([[query, d] for d in docs])
    ranked = sorted(zip(docs, scores), key=lambda x: x[1], reverse=True)
    return [d for d, _ in ranked[:top_k]]