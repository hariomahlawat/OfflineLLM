# app/chat.py
"""
Session-based chat helper.
Keeps one ConversationBufferMemory per session_id and proxies to Ollama.
"""
from __future__ import annotations

import os
from typing import Dict
from uuid import uuid4

from langchain.memory import ConversationBufferMemory
# from langchain_community.chat_models import ChatOllama

# ------------------------------------------------------------------
# configuration
# ------------------------------------------------------------------
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
MODEL_NAME = "llama3:8b-instruct-q3_K_L"

# _llm = ChatOllama(
#     model=MODEL_NAME,
#     temperature=0.2,
#     base_url=OLLAMA_BASE_URL,
# )

_sessions: Dict[str, ConversationBufferMemory] = {}


def _get_memory(session_id: str) -> ConversationBufferMemory:
    if session_id not in _sessions:
        _sessions[session_id] = ConversationBufferMemory(return_messages=True)
    return _sessions[session_id]


def new_session_id() -> str:
    return str(uuid4())


# ------------------------------------------------------------------
# helper: translate LangChain chat history ⟶ Ollama schema
# ------------------------------------------------------------------
def _lc_to_ollama(msg) -> dict:
    role_map = {
        "human": "user",
        "ai": "assistant",
        "system": "system",
        # tool / function messages map to "assistant" by convention
    }
    role = role_map.get(msg.type, "assistant")
    return {"role": role, "content": msg.content}


# ------------------------------------------------------------------
# main entry
# ------------------------------------------------------------------
def chat(session_id: str, user_msg: str) -> str:
    mem = _get_memory(session_id)

    # build full history for Ollama
    messages = [_lc_to_ollama(m) for m in mem.chat_memory.messages]
    messages.append({"role": "user", "content": user_msg})

    import ollama

    resp = ollama.chat(
        model=MODEL_NAME,
        #base_url=OLLAMA_BASE_URL,
        messages=messages,
        stream=False,
    )
    assistant_reply = resp["message"]["content"]

    # persist to memory
    mem.chat_memory.add_user_message(user_msg)
    mem.chat_memory.add_ai_message(assistant_reply)
    return assistant_reply