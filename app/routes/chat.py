from fastapi import APIRouter, HTTPException
import httpx

router = APIRouter()

@router.post("/api/chat")
async def chat(payload: dict):
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            r = await client.post("http://ollama:11434/api/chat", json=payload)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
