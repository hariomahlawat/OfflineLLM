from __future__ import annotations
import os
from pathlib import Path

try:
    import whisper
except Exception as exc:  # pragma: no cover - library may be missing during tests
    whisper = None
    _IMPORT_ERROR = exc
else:
    _IMPORT_ERROR = None

_MODEL = None


def _load_model() -> "whisper.Whisper":  # type: ignore[name-defined]
    global _MODEL
    if _MODEL is None:
        if whisper is None:
            raise RuntimeError(f"whisper library unavailable: {_IMPORT_ERROR}")
        name = os.getenv("WHISPER_MODEL", "base")
        _MODEL = whisper.load_model(name)
    return _MODEL


def transcribe_audio(path: str | Path) -> str:
    """Return transcribed text from audio file."""
    model = _load_model()
    result = model.transcribe(str(path))
    text = result.get("text", "").strip()
    return text
