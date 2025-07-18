import sys, types
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

# ---- stub modules for dependencies ----
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
emb_ollama = types.ModuleType("langchain_community.embeddings.ollama")
class OllamaEmbeddings:
    def __init__(self, *a, **k):
        pass
emb_ollama.OllamaEmbeddings = OllamaEmbeddings
emb.ollama = emb_ollama
sys.modules['langchain_community.embeddings'] = emb
sys.modules['langchain_community.embeddings.ollama'] = emb_ollama

vecstores = types.ModuleType("langchain_community.vectorstores")
vec_chroma = types.ModuleType("langchain_community.vectorstores.chroma")
class Chroma:
    def __init__(self, *a, **k):
        pass
    def similarity_search(self, *a, **k):
        return []
vec_chroma.Chroma = Chroma
vecstores.chroma = vec_chroma
sys.modules['langchain_community.vectorstores'] = vecstores
sys.modules['langchain_community.vectorstores.chroma'] = vec_chroma

langcore = types.ModuleType("langchain_core.documents")
class Document:
    def __init__(self, text):
        self.page_content = text
        self.metadata = {}
langcore.Document = Document
sys.modules['langchain_core.documents'] = langcore

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

st_mod = types.ModuleType("sentence_transformers")
class CrossEncoder:
    def __init__(self, *a, **k):
        pass
st_mod.CrossEncoder = CrossEncoder
sys.modules['sentence_transformers'] = st_mod

lc_mem = types.ModuleType("langchain.memory")
class ConversationBufferMemory:
    def __init__(self, *a, **k):
        self.chat_memory = types.SimpleNamespace(messages=[])
lc_mem.ConversationBufferMemory = ConversationBufferMemory
sys.modules['langchain.memory'] = lc_mem

mp = types.ModuleType('multipart')
mp.__version__ = '0'
sub = types.ModuleType('multipart.multipart')
def parse_options_header(x):
    return {}
sub.parse_options_header = parse_options_header
sys.modules['multipart'] = mp
sys.modules['multipart.multipart'] = sub

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
        if url == '/redraft':
            req = api.RedraftRequest(**json)
            res = asyncio.get_event_loop().run_until_complete(api.redraft(req))
            return FakeResponse(res.dict())
        raise ValueError('unsupported url')
tc_mod.TestClient = ClientStub
sys.modules['fastapi.testclient'] = tc_mod

ollama = types.ModuleType("ollama")
ollama.Client = lambda: None
ollama.chat = lambda *a, **k: {"message": {"content": "dummy"}}
sys.modules['ollama'] = ollama

import app.api as api
from fastapi.testclient import TestClient


def test_redraft_endpoint(monkeypatch):
    monkeypatch.setattr(api, "safe_chat", lambda model, messages, stream=False: {"message": {"content": "fixed"}})
    monkeypatch.setattr(api, "finalize_ollama_chat", lambda raw: raw)

    client = TestClient(api.app)
    resp = client.post("/redraft", json={"text": "hi"})
    assert resp.status_code == 200
    assert resp.json() == {"corrected": "fixed"}
