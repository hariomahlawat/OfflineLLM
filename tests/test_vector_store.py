import sys, types
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

# provide minimal stubs so app.vector_store can import
chromadb = types.ModuleType("chromadb")
class Client:
    def __init__(self, *a, **k):
        pass
chromadb.PersistentClient = Client
sys.modules['chromadb'] = chromadb

config = types.ModuleType("chromadb.config")
class Settings:
    def __init__(self, *a, **k):
        pass
config.Settings = Settings
sys.modules['chromadb.config'] = config

langchain_community = types.ModuleType("langchain_community")
emb = types.ModuleType("langchain_community.embeddings")
emb_ollama = types.ModuleType("langchain_community.embeddings.ollama")
class OllamaEmbeddings:
    def __init__(self, *a, **k):
        pass
emb_ollama.OllamaEmbeddings = OllamaEmbeddings
emb.ollama = emb_ollama
langchain_community.embeddings = emb
sys.modules['langchain_community'] = langchain_community
sys.modules['langchain_community.embeddings'] = emb
sys.modules['langchain_community.embeddings.ollama'] = emb_ollama

vecstores = types.ModuleType("langchain_community.vectorstores")
vec_chroma = types.ModuleType("langchain_community.vectorstores.chroma")
class Chroma:
    def __init__(self, *a, **k):
        self._meta = []
    def get(self):
        return {"metadatas": self._meta}
vec_chroma.Chroma = Chroma
vecstores.chroma = vec_chroma
langchain_community.vectorstores = vecstores
sys.modules['langchain_community.vectorstores'] = vecstores
sys.modules['langchain_community.vectorstores.chroma'] = vec_chroma

langcore = types.ModuleType("langchain_core.documents")
class Document:
    pass
langcore.Document = Document
sys.modules['langchain_core.documents'] = langcore

import app.vector_store as vs

class DummyStore:
    def __init__(self, metas):
        self._metas = metas
    def get(self):
        return {"metadatas": self._metas}


def test_persist_has_source(monkeypatch):
    store = DummyStore([{"source_file": "a.pdf"}, {"source_file": "b.pdf"}])
    monkeypatch.setattr(vs, "persistent_store", store)
    assert vs.persist_has_source("a.pdf") is True
    assert vs.persist_has_source("c.pdf") is False
