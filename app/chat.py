"""
Session-based chat helper.
Keeps one ConversationBufferMemory per session_id and proxies to Ollama.
"""

from __future__ import annotations

import os
from typing import Dict, Optional
from uuid import uuid4

import ollama
from langchain.memory import ConversationBufferMemory
from app.ollama_utils import finalize_ollama_chat


# ------------------------------------------------------------------
# configuration
# ------------------------------------------------------------------
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
DEFAULT_MODEL = "llama3:8b-instruct-q3_K_L"

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
        "human": "user",
        "ai": "assistant",
        "system": "system",
        # tool / function messages map to assistant by default
    }
    return {"role": role_map.get(msg.type, "assistant"), "content": msg.content}


def chat(
    session_id: str,
    user_msg: str,
    model: Optional[str] = None,
    temperature: float = 0.4,
) -> str:
    """
    Send a turn of chat to Ollama, with session-based memory.

    Args:
        session_id: ID of the conversation.
        user_msg:   The user’s message.
        model:      (Optional) Ollama model to use; defaults to DEFAULT_MODEL.
        temperature: Sampling temperature.

    Returns:
        The assistant’s reply.
    """
    # 1) retrieve or create the session memory
    mem = _get_memory(session_id)

    # 2) build full chat history in Ollama format
    messages = [_lc_to_ollama(m) for m in mem.chat_memory.messages]
    messages.append({"role": "user", "content": user_msg})

    # 3) pick which model to use
    chosen_model = model or DEFAULT_MODEL

    # 4) call the Ollama API
    raw = ollama.chat(
        model=chosen_model,
        messages=messages,
        stream=False,
    )
    msg = finalize_ollama_chat(raw)
    assistant_reply = msg["message"]["content"]

    # 5) persist this turn in memory
    mem.chat_memory.add_user_message(user_msg)
    mem.chat_memory.add_ai_message(assistant_reply)

    return assistant_reply
