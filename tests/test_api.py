import sys, types
import pytest
from pathlib import Path
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

vecstores = types.ModuleType("langchain_community.vectorstores")
class Chroma:
    def __init__(self, *a, **k):
        pass
    def similarity_search(self, *a, **k):
        return []
vecstores.Chroma = Chroma
sys.modules['langchain_community.vectorstores'] = vecstores

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
tc_mod.TestClient = ClientStub
sys.modules['fastapi.testclient'] = tc_mod

# stub ollama client
ollama = types.ModuleType("ollama")
ollama.Client = lambda: None
ollama.chat = lambda *a, **k: {"message": {"content": "dummy"}}
sys.modules['ollama'] = ollama

# ---- import target module ----
import app.api as api
from fastapi.testclient import TestClient

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


@pytest.mark.parametrize("question", ["one two", "many words here now"])
def test_calc_top_k_no_dynamic(monkeypatch, question):
    monkeypatch.setattr(api, "SEARCH_TOP_K", 5)
    monkeypatch.setattr(api, "DYNAMIC_K_FACTOR", 0)
    assert api._calc_top_k(question) == 5


@pytest.mark.parametrize(
    "question,expected",
    [
        ("one two", 5),
        ("one two three four five six", 7),
        ("1 2 3 4 5 6 7 8 9", 8),
    ],
)
def test_calc_top_k_dynamic(monkeypatch, question, expected):
    monkeypatch.setattr(api, "SEARCH_TOP_K", 5)
    monkeypatch.setattr(api, "DYNAMIC_K_FACTOR", 3)
    assert api._calc_top_k(question) == expected
