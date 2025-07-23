import httpx
from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.get("/api/models")
async def list_models():
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.get("http://ollama:11434/api/tags")
        r.raise_for_status()
        return r.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
