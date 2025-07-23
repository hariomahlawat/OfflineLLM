from fastapi import APIRouter, HTTPException

from app.chat import safe_chat, chat as chat_fn, new_session_id

router = APIRouter()

@router.post("/api/chat")
async def chat(payload: dict):
    try:
        model = payload.get("model")
        messages = payload.get("messages")

        if isinstance(messages, list):
            kwargs = {k: v for k, v in payload.items() if k not in {"model", "messages"}}
            return safe_chat(model=model, messages=messages, stream=False, **kwargs)

        # fallback: behave like /chat for compatibility
        user_msg = payload.get("user_msg")
        if user_msg is not None:
            session_id = payload.get("session_id") or new_session_id()
            answer = chat_fn(session_id, user_msg, model=model)
            return {"session_id": session_id, "answer": answer}

        raise ValueError("messages must be a list or provide user_msg")
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
