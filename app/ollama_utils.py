from typing import Any, Dict
import types
import dataclasses

def finalize_ollama_chat(raw: Any) -> Dict:
    """
    Ollama.chat(stream=False) may return a generator of dicts.
    This will iterate through it and return the last dict.
    """
    if isinstance(raw, types.GeneratorType):
        last = None
        for chunk in raw:
            last = chunk
        if last is None:
            raise ValueError("No messages received from Ollama")
        raw = last

    if isinstance(raw, dict):
        return raw

    if dataclasses.is_dataclass(raw):
        return dataclasses.asdict(raw)

    if hasattr(raw, "dict") and callable(getattr(raw, "dict")):
        return raw.dict()

    if hasattr(raw, "model_dump") and callable(getattr(raw, "model_dump")):
        return raw.model_dump()

    raise ValueError(f"Unexpected Ollama.chat return type: {type(raw)}")
