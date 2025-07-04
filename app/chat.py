# app/chat.py
"""
Session-based chat helper: keeps a ConversationBufferMemory per session_id
and calls Ollama inside the Docker network.
"""
from typing import Dict
from uuid import uuid4
import os

from langchain.memory import ConversationBufferMemory
from langchain_community.chat_models import ChatOllama

# ------------------------------------------------------------------
# Read the URL from the env var, fall back to the service name
# ------------------------------------------------------------------
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
MODEL_NAME = "llama3:8b-instruct-q3_K_L"        # model name 

_llm = ChatOllama(
    model=MODEL_NAME,
    temperature=0.2,
    base_url=OLLAMA_BASE_URL,      # ← critical change
)

_sessions: Dict[str, ConversationBufferMemory] = {}


def _get_memory(session_id: str) -> ConversationBufferMemory:
    if session_id not in _sessions:
        _sessions[session_id] = ConversationBufferMemory(return_messages=True)
    return _sessions[session_id]


def new_session_id() -> str:
    return str(uuid4())


def chat(session_id: str, user_msg: str) -> str:
    mem = _get_memory(session_id)

    # Build role/content list for Ollama
    messages = [m.to_dict() for m in mem.chat_memory.messages]
    messages.append({"role": "user", "content": user_msg})

    import ollama
    resp = ollama.chat(
        model="llama3:8b",
        #base_url=OLLAMA_BASE_URL,   # ← same here
        messages=messages,
        stream=False,
    )
    assistant_reply = resp["message"]["content"]

    # Persist
    mem.chat_memory.add_user_message(user_msg)
    mem.chat_memory.add_ai_message(assistant_reply)
    return assistant_reply
