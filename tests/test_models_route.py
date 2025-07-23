import sys
import types
from pathlib import Path
import asyncio

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

# stub httpx.AsyncClient
httpx_mod = types.ModuleType("httpx")
class AsyncClient:
    def __init__(self, *a, **k):
        pass
    async def __aenter__(self):
        return self
    async def __aexit__(self, exc_type, exc, tb):
        pass
    async def get(self, url):
        assert url == "http://ollama:11434/api/tags"
        class R:
            def raise_for_status(self):
                pass
            def json(self):
                return {"models": [{"name": "a"}]}
        return R()
httpx_mod.AsyncClient = AsyncClient
sys.modules['httpx'] = httpx_mod

import app.routes.models as models  # noqa: E402
models.httpx = httpx_mod

def test_list_models_route():
    res = asyncio.get_event_loop().run_until_complete(models.list_models())
    assert res == {"models": [{"name": "a"}]}
