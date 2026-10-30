"""Tests for document parser."""
import os
import pytest
from app.core.parser import parse_document


class TestParser:
    def test_parse_txt(self, sample_txt):
        text = parse_document(sample_txt, "test.txt")
        assert "出差报销" in text
        assert len(text) > 100

    def test_parse_markdown(self, sample_md):
        text = parse_document(sample_md, "test.md")
        assert "RAG" in text
        assert len(text) > 50

    def test_unsupported_extension(self):
        with pytest.raises(ValueError):
            parse_document("dummy.xyz", "test.xyz")
