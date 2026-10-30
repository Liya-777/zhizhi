"""Test configuration and fixtures."""
import os
import sys
import pytest

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Override data paths for testing
os.environ.setdefault("DATA_DIR", "/tmp/rag_test_data")
os.environ.setdefault("UPLOADS_DIR", "/tmp/rag_test_data/uploads")
os.environ.setdefault("CHROMA_DIR", "/tmp/rag_test_data/chroma")
os.environ.setdefault("MOCK_LLM", "true")
os.environ.setdefault("MODELS_DIR", "/tmp/rag_test_models")


@pytest.fixture
def sample_txt():
    """Path to sample TXT fixture."""
    return os.path.join(os.path.dirname(__file__), "fixtures", "sample.txt")


@pytest.fixture
def sample_md():
    """Path to sample Markdown fixture."""
    return os.path.join(os.path.dirname(__file__), "fixtures", "sample.md")


@pytest.fixture
def sample_text():
    """Text content of the sample TXT fixture."""
    with open(os.path.join(os.path.dirname(__file__), "fixtures", "sample.txt"), "r", encoding="utf-8") as f:
        return f.read()
