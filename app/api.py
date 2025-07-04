# app/api.py

import app.boot            # <-- this triggers the indexing side-effect

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List

from app.vector_store import similarity_search
from app.rerank import rerank

from uuid import uuid4
from langchain.schema import HumanMessage
from app.chat import chat as chat_fn, new_session_id, MODEL_NAME

from typing import Dict
from uuid import uuid4

from langchain.memory import ConversationBufferMemory
from langchain_community.chat_models import ChatOllama

import ollama

#MODEL_NAME = "llama3:8b-instruct-q3_K_L"         

app = FastAPI(title="OfflineLLM API", version="0.1.0")


class PingResponse(BaseModel):
    status: str = "ok"


@app.get("/ping", response_model=PingResponse)
async def ping():
    return PingResponse()


# ----------  RAG endpoint  ---------- #
class QARequest(BaseModel):
    question: str


class QAResponse(BaseModel):
    answer: str
    sources: List[str]


@app.post("/doc_qa", response_model=QAResponse)
async def doc_qa(req: QARequest):
    # 1) retrieve & re-rank context
    raw_docs = similarity_search(req.question, k=10)
    doc_texts = [d.page_content for d in raw_docs]
    top_chunks = rerank(req.question, doc_texts, top_k=3)

    # 2) build prompt
    sep = "\n---\n"
    prompt = (
        "You are a helpful assistant. Answer ONLY from the CONTEXT.\n"
        "If unsure, say 'I don't know.'\n\n"
        f"CONTEXT:\n{sep.join(top_chunks)}\n\n"
        f"QUESTION: {req.question}\nANSWER:"
    )


    # 3) call Ollama / Llama-3
    
    try:
        reply = ollama.chat(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
            stream=False
        )
        answer = reply["message"]["content"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


    return QAResponse(answer=answer, sources=top_chunks)



# ----------  Chat endpoint ---------- #
class ChatRequest(BaseModel):
    user_msg: str
    session_id: str | None = None

class ChatResponse(BaseModel):
    session_id: str
    answer: str


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    session_id = req.session_id or new_session_id()
    try:
        answer = chat_fn(session_id, req.user_msg)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return ChatResponse(session_id=session_id, answer=answer)
