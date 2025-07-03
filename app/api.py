# app/api.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List

from app.vector_store import similarity_search
from app.rerank import rerank

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
    import ollama
    try:
        reply = ollama.chat(
            model="llama3:8b",
            messages=[{"role": "user", "content": prompt}],
            stream=False
        )
        answer = reply["message"]["content"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


    return QAResponse(answer=answer, sources=top_chunks)
