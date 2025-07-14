import sys, types
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

# stub external dependencies before importing
lc_loader_mod = types.ModuleType("langchain_community.document_loaders")
class PyPDFLoader:
    def __init__(self, path):
        self.path = path
    def load(self):
        return [DummyDoc("page1"), DummyDoc("page2")]

lc_loader_mod.PyPDFLoader = PyPDFLoader
sys.modules['langchain_community.document_loaders'] = lc_loader_mod

lc_split_mod = types.ModuleType("langchain_text_splitters")
class RecursiveCharacterTextSplitter:
    def __init__(self, chunk_size, chunk_overlap):
        pass
    def split_documents(self, pages):
        return [DummyDoc(p.page_content, dict(p.metadata)) for p in pages]

lc_split_mod.RecursiveCharacterTextSplitter = RecursiveCharacterTextSplitter
sys.modules['langchain_text_splitters'] = lc_split_mod

lc_schema_mod = types.ModuleType("langchain.schema")
class DummyDoc:
    def __init__(self, text, meta=None):
        self.page_content = text
        self.metadata = meta or {}

lc_schema_mod.Document = DummyDoc
sys.modules['langchain.schema'] = lc_schema_mod

import app.ingestion as ingestion


def test_load_and_split(tmp_path):
    pdf = tmp_path / "f.pdf"
    pdf.write_bytes(b"%PDF-1.1")

    chunks = ingestion.load_and_split(str(pdf))
    assert [c.page_content for c in chunks] == ["page1", "page2"]
    assert all(c.metadata["source_file"] == str(pdf) for c in chunks)
