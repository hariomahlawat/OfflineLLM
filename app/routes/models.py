import os
import httpx
from fastapi import APIRouter, HTTPException
from typing import List, Dict

router = APIRouter()

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://ollama:11434")

@router.get("/api/models")
async def list_models() -> List[Dict[str, str | None]]:
    """Return locally available Ollama models filtered for chat usage."""
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.get(f"{OLLAMA_HOST}/api/tags")
        r.raise_for_status()
        raw = r.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

    out: List[Dict[str, str | None]] = []
    seen = set()
    for m in raw.get("models", []):
        md = (
            m.model_dump() if hasattr(m, "model_dump") else m.dict() if hasattr(m, "dict") else m
        )
        name = md.get("name") or ""
        if not name or name in seen or name.startswith("nomic-embed-text"):
            continue
        seen.add(name)
        details = md.get("details", {}) or {}
        desc = ", ".join(
            p for p in [
                details.get("family", ""),
                details.get("parameter_size", ""),
                details.get("quantization_level", ""),
            ] if p
        )
        out.append({"name": name, "description": desc or None})

    return out
