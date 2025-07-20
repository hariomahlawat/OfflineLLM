import sys
import types
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

emb = types.ModuleType("langchain_ollama")
class OllamaEmbeddings:
    def __init__(self, *a, **k):
        pass
emb.OllamaEmbeddings = OllamaEmbeddings
sys.modules['langchain_ollama'] = emb

vecstores = types.ModuleType("langchain_chroma")
class Chroma:
    def __init__(self, *a, **k):
        self._meta = []
    def get(self):
        return {"metadatas": self._meta}
vecstores.Chroma = Chroma
sys.modules['langchain_chroma'] = vecstores

langcore = types.ModuleType("langchain_core.documents")
class Document:
    pass
langcore.Document = Document
sys.modules['langchain_core.documents'] = langcore

import app.vector_store as vs  # noqa: E402

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
