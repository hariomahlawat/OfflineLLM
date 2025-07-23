from fastapi import APIRouter, HTTPException

from app.chat import safe_chat

router = APIRouter()

@router.post("/api/chat")
async def chat(payload: dict):
    try:
        model = payload.get("model")
        messages = payload.get("messages")
        if not isinstance(messages, list):
            raise ValueError("messages must be a list")

        kwargs = {k: v for k, v in payload.items() if k not in {"model", "messages"}}
        return safe_chat(model=model, messages=messages, stream=False, **kwargs)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
