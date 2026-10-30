"""Tests for document chunker."""
from app.core.chunker import chunk_document


class TestChunker:
    def test_split_by_paragraphs(self):
        text = "段落一的内容。\n\n段落二的内容。\n\n段落三的内容。"
        chunks = chunk_document(text, chunk_size=100)
        assert len(chunks) >= 1
        for c in chunks:
            assert "content" in c
            assert "index" in c
            assert len(c["content"]) > 0

    def test_short_document_single_chunk(self):
        text = "这是一段很短的文本。"
        chunks = chunk_document(text, chunk_size=500)
        assert len(chunks) == 1
        assert chunks[0]["content"] == text

    def test_long_document_multiple_chunks(self, sample_text):
        chunks = chunk_document(sample_text, chunk_size=300)
        assert len(chunks) >= 2
        # Verify ordering
        for i in range(1, len(chunks)):
            assert chunks[i]["index"] > chunks[i - 1]["index"]

    def test_empty_text(self):
        chunks = chunk_document("", chunk_size=100)
        assert len(chunks) == 0
