import sys
import types
from pathlib import Path
import asyncio
import pytest
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

# ---- stub modules for dependencies ----
# minimal stubs for vector_store dependencies
chromadb = types.ModuleType("chromadb")
chromadb.PersistentClient = lambda *a, **k: None
sys.modules['chromadb'] = chromadb

config = types.ModuleType("chromadb.config")
class Settings:
    def __init__(self, *a, **k):
        pass
config.Settings = Settings
sys.modules['chromadb.config'] = config

emb = types.ModuleType("langchain_community.embeddings")
class OllamaEmbeddings:
    def __init__(self, *a, **k):
        pass
emb.OllamaEmbeddings = OllamaEmbeddings
sys.modules['langchain_community.embeddings'] = emb

vecstores = types.ModuleType("langchain_chroma")
class Chroma:
    def __init__(self, *a, **k):
        pass
    def similarity_search(self, *a, **k):
        return []
vecstores.Chroma = Chroma
sys.modules['langchain_chroma'] = vecstores

langcore = types.ModuleType("langchain_core.documents")
class Document:
    def __init__(self, text):
        self.page_content = text
        self.metadata = {}
langcore.Document = Document
sys.modules['langchain_core.documents'] = langcore

# ingestion stubs
lc_loader_mod = types.ModuleType("langchain_community.document_loaders")
class PyPDFLoader:
    def __init__(self, path):
        self.path = path
    def load(self):
        return [Document("page1"), Document("page2")]

lc_loader_mod.PyPDFLoader = PyPDFLoader
sys.modules['langchain_community.document_loaders'] = lc_loader_mod

lc_split_mod = types.ModuleType("langchain_text_splitters")
class RecursiveCharacterTextSplitter:
    def __init__(self, chunk_size, chunk_overlap):
        pass
    def split_documents(self, pages):
        return pages
lc_split_mod.RecursiveCharacterTextSplitter = RecursiveCharacterTextSplitter
sys.modules['langchain_text_splitters'] = lc_split_mod

lc_schema_mod = types.ModuleType("langchain.schema")
lc_schema_mod.Document = Document
sys.modules['langchain.schema'] = lc_schema_mod

# stub sentence-transformers
st_mod = types.ModuleType("sentence_transformers")
class CrossEncoder:
    def __init__(self, *a, **k):
        pass
st_mod.CrossEncoder = CrossEncoder
sys.modules['sentence_transformers'] = st_mod

# stub langchain.memory
lc_mem = types.ModuleType("langchain.memory")
class ConversationBufferMemory:
    def __init__(self, *a, **k):
        self.chat_memory = types.SimpleNamespace(messages=[])
lc_mem.ConversationBufferMemory = ConversationBufferMemory
sys.modules['langchain.memory'] = lc_mem

# stub python-multipart used by FastAPI
mp = types.ModuleType('multipart')
mp.__version__ = '0'
sub = types.ModuleType('multipart.multipart')
def parse_options_header(x):
    return {}
sub.parse_options_header = parse_options_header
sys.modules['multipart'] = mp
sys.modules['multipart.multipart'] = sub

# stub httpx.AsyncClient used in app.routes.models
httpx_mod = types.ModuleType('httpx')

class AsyncClient:
    def __init__(self, *a, **k):
        pass
    async def __aenter__(self):
        return self
    async def __aexit__(self, exc_type, exc, tb):
        pass
    async def get(self, url):
        class R:
            def raise_for_status(self):
                pass
            def json(self):
                return {}
        return R()

httpx_mod.AsyncClient = AsyncClient
sys.modules['httpx'] = httpx_mod

# minimal pydantic BaseModel stub
pydantic_mod = types.ModuleType('pydantic')
class BaseModel:
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)
    def dict(self):
        def conv(val):
            if isinstance(val, BaseModel):
                return val.dict()
            if isinstance(val, list):
                return [conv(v) for v in val]
            if isinstance(val, dict):
                return {k: conv(v) for k, v in val.items()}
            return val
        return {k: conv(v) for k, v in self.__dict__.items()}
    model_dump = dict
pydantic_mod.BaseModel = BaseModel
sys.modules['pydantic'] = pydantic_mod

# Minimal fastapi stubs to allow importing app.api without the real library
fastapi_stub = types.ModuleType('fastapi')

class FastAPI:
    def __init__(self, *a, **k):
        pass
    def add_middleware(self, *a, **k):
        pass
    def include_router(self, *a, **k):
        pass
    def on_event(self, *a, **k):
        def decorator(fn):
            return fn
        return decorator
    def get(self, *a, **k):
        def decorator(fn):
            return fn
        return decorator
    def post(self, *a, **k):
        def decorator(fn):
            return fn
        return decorator
    def delete(self, *a, **k):
        def decorator(fn):
            return fn
        return decorator

def File(*a, **k):
    return None

class HTTPException(Exception):
    def __init__(self, status_code: int, detail: str | None = None, headers=None):
        self.status_code = status_code
        self.detail = detail
        self.headers = headers

class Query:
    def __init__(self, default=None, description: str | None = None):
        self.default = default
        self.description = description

class UploadFile:
    def __init__(self, filename: str = ''):
        self.filename = filename
        self.file = types.SimpleNamespace(close=lambda: None)

class Depends:
    def __init__(self, dependency):
        self.dependency = dependency

class APIRouter:
    def get(self, *a, **k):
        def decorator(fn):
            return fn
        return decorator
    def post(self, *a, **k):
        def decorator(fn):
            return fn
        return decorator

class HTTPBasic:
    pass

class HTTPBasicCredentials:
    def __init__(self, username: str = '', password: str = ''):
        self.username = username
        self.password = password

class CORSMiddleware:
    pass

fastapi_stub.FastAPI = FastAPI
fastapi_stub.File = File
fastapi_stub.HTTPException = HTTPException
fastapi_stub.Query = Query
fastapi_stub.UploadFile = UploadFile
fastapi_stub.Depends = Depends
fastapi_stub.APIRouter = APIRouter
cors_mod = types.ModuleType('fastapi.middleware.cors')
cors_mod.CORSMiddleware = CORSMiddleware
security_mod = types.ModuleType('fastapi.security')
security_mod.HTTPBasic = HTTPBasic
security_mod.HTTPBasicCredentials = HTTPBasicCredentials
sys.modules['fastapi'] = fastapi_stub
sys.modules['fastapi.middleware.cors'] = cors_mod
sys.modules['fastapi.security'] = security_mod

# Provide a fake fastapi TestClient that calls the endpoint function directly
tc_mod = types.ModuleType('fastapi.testclient')
class FakeResponse:
    def __init__(self, data):
        self.status_code = 200
        self._data = data
    def json(self):
        return self._data

class ClientStub:
    __test__ = False
    def __init__(self, app):
        self.app = app
    def post(self, url, json=None):
        import asyncio
        if url == '/doc_qa':
            req = api.QARequest(**json)
            res = asyncio.get_event_loop().run_until_complete(api.doc_qa(req))
            return FakeResponse(res.dict())
        raise ValueError('unsupported url')
    def get(self, url):
        import asyncio
        if url == '/models':
            res = asyncio.get_event_loop().run_until_complete(api.list_models())
            return FakeResponse([m.dict() for m in res])
        raise ValueError('unsupported url')
tc_mod.TestClient = ClientStub
sys.modules['fastapi.testclient'] = tc_mod

# stub ollama client
ollama = types.ModuleType("ollama")
ollama.Client = lambda: None
ollama.chat = lambda *a, **k: {"message": {"content": "dummy"}}
sys.modules['ollama'] = ollama

# ---- import target module ----
import app.api as api  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

class DummyDoc:
    def __init__(self, text):
        self.page_content = text
        self.metadata = {}

def test_doc_qa(monkeypatch):
    docs = [DummyDoc("c1"), DummyDoc("c2")]

    monkeypatch.setattr(api, "similarity_search", lambda q, k=10, use_mmr=False: docs)
    monkeypatch.setattr(api, "rerank", lambda q, chunks: [chunks[0]])
    monkeypatch.setattr(api, "safe_chat", lambda model, messages, stream=False: {"message": {"content": "ans"}})
    monkeypatch.setattr(api, "finalize_ollama_chat", lambda raw: raw)

    client = TestClient(api.app)
    resp = client.post("/doc_qa", json={"question": "hi"})
    assert resp.status_code == 200
    assert resp.json() == {
        "answer": "ans",
        "sources": [{"page_number": None, "snippet": "c1"}],
    }


def test_calc_top_k(monkeypatch):
    monkeypatch.setattr(api, "DYNAMIC_K_FACTOR", 5)
    monkeypatch.setattr(api, "SEARCH_TOP_K", 2)
    q = "one two three four five six"
    k = api._calc_top_k(q)
    expected = 2 + api.count_tokens(q) // 5
    assert k == expected


@pytest.mark.parametrize(
    "val,expected,raises",
    [
        (None, 0, False),
        ("", 0, False),
        ("10", 10, False),
        ("-3", 0, False),
        ("abc", None, True),
    ],
)
def test_parse_dynamic_k_factor(val, expected, raises):
    if raises:
        with pytest.raises(ValueError):
            api._parse_dynamic_k_factor(val)
    else:
        assert api._parse_dynamic_k_factor(val) == expected






