from __future__ import annotations
from typing import Any, Dict, Generator, List
import json, logging, types

log = logging.getLogger("ollama_utils")

def _last_dict(seq: List[dict] | Generator[dict, None, None]) -> dict:
    """Return the last element of an iterable of dicts or raise."""
    last: dict | None = None
    for chunk in seq:
        last = chunk
    if last is None:
        raise ValueError("Ollama chat yielded no objects")
    return last

def finalize_ollama_chat(raw: Any) -> Dict[str, Any]:
    """
    Normalize the eclectic return types of `ollama.chat(...)`
    into a **single dict** (the final assistant message).

    Accepts:
      • dict  – standard non-stream call
      • generator of dicts  – stream=True
      • list[dict] – some adapters yield a buffered list
      • str  – JSON string on rare error path
    """
    # 1) already a dict → done
    if isinstance(raw, dict):
        return raw

    # 2) generator of dicts
    if isinstance(raw, types.GeneratorType):
        return _last_dict(raw)

    # 3) list of dicts
    if isinstance(raw, list) and raw and isinstance(raw[0], dict):
        return raw[-1]

    # 4) JSON string (error wrapper)
    if isinstance(raw, str):
        try:
            jd = json.loads(raw)
            if isinstance(jd, dict):
                return jd
        except json.JSONDecodeError:
            pass  # fall through

    raise ValueError(f"Unexpected Ollama.chat return type: {type(raw)}  → {raw!r}")


