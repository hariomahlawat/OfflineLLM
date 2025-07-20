"""
Session-based chat helper.
Keeps one ConversationBufferMemory per session_id and proxies to Ollama.
"""

from __future__ import annotations

import os
import logging
from typing import Dict, Optional
from uuid import uuid4

import ollama
from langchain.memory import ConversationBufferMemory
from app.ollama_utils import finalize_ollama_chat

# ------------------------------------------------------------------
# system prompts
# ------------------------------------------------------------------
DEFAULT_SYSTEM_PROMPT = os.getenv("SYSTEM_PROMPT", "You are a helpful assistant.")

# per-model system prompt overrides
SYSTEM_PROMPTS: Dict[str, str] = {
    "deepseek-r1": "You are a helpful assistant.",
    "codellama:7b": "You are a coding assistant.",
}


# ------------------------------------------------------------------
# configuration
# ------------------------------------------------------------------
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
DEFAULT_MODEL    = os.getenv("OLLAMA_DEFAULT_MODEL", "llama3:8b-instruct-q3_K_L")

# in-memory map session_id → ConversationBufferMemory
_sessions: Dict[str, ConversationBufferMemory] = {}


def _get_memory(session_id: str) -> ConversationBufferMemory:
    if session_id not in _sessions:
        _sessions[session_id] = ConversationBufferMemory(return_messages=True)
    return _sessions[session_id]


def new_session_id() -> str:
    return str(uuid4())


def _lc_to_ollama(msg) -> dict:
    """
    Convert a LangChain message to Ollama’s expected schema.
    """
    role_map = {
        "human":  "user",
        "ai":     "assistant",
        "system": "system",
    }
    return {"role": role_map.get(msg.type, "assistant"), "content": msg.content}


def safe_chat(*, model: str, messages: list, stream: bool = False, **kwargs):
    """
    Call ollama.chat and if it errors, retry once with the DEFAULT_MODEL.
    """
    try:
        return ollama.chat(model=model, messages=messages, stream=stream, **kwargs)
    except Exception as e:
        if model == DEFAULT_MODEL:
            raise
        logging.warning(
            "Model '%s' failed, falling back to '%s': %s", model, DEFAULT_MODEL, e
        )
        return ollama.chat(model=DEFAULT_MODEL, messages=messages, stream=stream, **kwargs)


def chat(
    session_id: str,
    user_msg:    str,
    model:       Optional[str] = None,
) -> str:
    """
    Send one turn of chat to Ollama, holding on to conversation memory.

    Args:
      session_id: UUID for your session.
      user_msg:   The user’s latest message.
      model:      Optional override (e.g. "mistral:latest").

    Returns:
      The assistant’s reply.
    """
    # 1) get or create the memory buffer
    mem = _get_memory(session_id)

    # 2) rebuild full history in Ollama schema
    messages = [_lc_to_ollama(m) for m in mem.chat_memory.messages]

    # 3) choose the model
    chosen_model = model or DEFAULT_MODEL
    
    # insert system prompt on first turn
    if not messages:
        system_prompt = SYSTEM_PROMPTS.get(chosen_model, DEFAULT_SYSTEM_PROMPT)
        messages.append({"role": "system", "content": system_prompt})

    messages.append({"role": "user", "content": user_msg})

    # 4) call Ollama (no temperature arg here)
    raw = safe_chat(model=chosen_model, messages=messages, stream=False)
    msg = finalize_ollama_chat(raw)
    assistant_reply = msg["message"]["content"]

    # 5) save this turn
    mem.chat_memory.add_user_message(user_msg)
    mem.chat_memory.add_ai_message(assistant_reply)

    return assistant_reply
