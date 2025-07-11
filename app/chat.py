"""
Session-based chat helper
──────────────────────────
• One ConversationBufferMemory per session_id
• Resilient call to Ollama with optional fallback model
• Idle sessions auto-purged to cap RAM
"""

from __future__ import annotations

import asyncio, logging, os
from datetime import datetime, timedelta
from typing import Dict, Optional
from uuid import uuid4

import ollama
from langchain.memory import ConversationBufferMemory

from app.ollama_utils import finalize_ollama_chat

# ───────────────────────── Configuration ──────────────────────────
DEFAULT_MODEL = os.getenv("OLLAMA_DEFAULT_MODEL", "llama3:8b-instruct-q4_K_M")
SESSION_TTL_MIN = int(os.getenv("SESSION_TTL_MIN", 60))  # purge after 1 h idle

log = logging.getLogger("chat")
log.setLevel(logging.INFO)

# ───────────────────────── In-memory stores ───────────────────────
_sessions: Dict[str, ConversationBufferMemory] = {}
_last_touch: Dict[str, datetime] = {}
_LOCK = asyncio.Lock()

def _get_memory(session_id: str) -> ConversationBufferMemory:
    if session_id not in _sessions:
        _sessions[session_id] = ConversationBufferMemory(return_messages=True)
    _last_touch[session_id] = datetime.utcnow()
    return _sessions[session_id]

def new_session_id() -> str:
    return str(uuid4())

# ───────────────────────── Utilities ──────────────────────────────
def _lc_to_ollama(msg) -> dict:
    """Convert a LangChain Message to Ollama chat schema."""
    role_map = {"human": "user", "ai": "assistant", "system": "system"}
    return {"role": role_map.get(msg.type, "assistant"), "content": msg.content}

import ollama
import logging

log = logging.getLogger("safe_chat")

def safe_chat(model: str, messages: list, stream: bool = False) -> dict:
    """
    A robust wrapper for ollama.chat that dynamically adjusts parameters
    based on the model's capabilities.
    """
    try:
        # Show model info
        model_info = ollama.show(model)
        mod_params = model_info.get("parameters", {})

        # Base arguments
        kwargs = {
            "model": model,
            "messages": messages,
            "stream": stream
        }

        # Dynamically include temperature only if supported
        if "temperature" in mod_params:
            kwargs["temperature"] = 0.7  # or read from config/env

        # Add other conditionally supported arguments here if needed
        # if "top_p" in mod_params:
        #     kwargs["top_p"] = 0.9

        return ollama.chat(**kwargs)

    except Exception as e:
        log.error(f"safe_chat failed for model={model}: {e}")
        raise



# ───────────────────────── Background GC task ─────────────────────
async def _gc_loop():
    while True:
        cutoff = datetime.utcnow() - timedelta(minutes=SESSION_TTL_MIN)
        async with _LOCK:
            for sid, ts in list(_last_touch.items()):
                if ts < cutoff:
                    _sessions.pop(sid, None)
                    _last_touch.pop(sid, None)
                    log.info("💬 purged idle session %s", sid)
        await asyncio.sleep(60)

# spawn at import time (safe in single-process uvicorn)
asyncio.create_task(_gc_loop())

# ───────────────────────── Public API ─────────────────────────────
def chat(
    session_id: str,
    user_msg: str,
    model: Optional[str] = None,
    temperature: float = 0.4,
) -> str:
    """
    One chat turn with session memory.

    Args:
        session_id: conversation UUID (create outside or call new_session_id()).
        user_msg:   user’s message.
        model:      optional override; falls back to DEFAULT_MODEL on failure.
        temperature: sampling temperature.

    Returns:
        assistant reply string.
    """
    mem = _get_memory(session_id)

    # Build full history in Ollama format
    messages = [_lc_to_ollama(m) for m in mem.chat_memory.messages]
    messages.append({"role": "user", "content": user_msg})

    chosen_model = model or DEFAULT_MODEL

    raw = safe_chat(
    model=chosen_model,
    messages=messages,
    stream=False,
    temperature=temperature,
    )

    reply = finalize_ollama_chat(raw)["message"]["content"]

    # Persist turn in memory
    mem.chat_memory.add_user_message(user_msg)
    mem.chat_memory.add_ai_message(reply)

    return reply
