from typing import Any, Dict
import types

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
        return last
    elif isinstance(raw, dict):
        return raw
    else:
        raise ValueError(f"Unexpected Ollama.chat return type: {type(raw)}")
