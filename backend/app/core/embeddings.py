"""Embedding service using local bge-small-zh-v1.5 model."""
from __future__ import annotations

import structlog
from typing import Optional
from app.core.config import settings

logger = structlog.get_logger()

_embedding_model = None
_load_error: Optional[str] = None

# Files that must exist in a complete sentence-transformers model directory
_REQUIRED_MODEL_FILES = ("config.json", "model.safetensors")
_OPTIONAL_MODEL_FILES = (
    "tokenizer.json",
    "tokenizer_config.json",
    "vocab.txt",
    "special_tokens_map.json",
    "sentence_bert_config.json",
    "modules.json",
)


def _validate_model_dir(path: str) -> list[str]:
    """Check model directory completeness. Returns list of missing required files."""
    import os as _os

    if not _os.path.isdir(path):
        return list(_REQUIRED_MODEL_FILES)  # dir doesn't exist

    missing = [f for f in _REQUIRED_MODEL_FILES if not _os.path.isfile(_os.path.join(path, f))]
    return missing


def get_embedding_model():
    """Lazy-load the sentence-transformers model (singleton).

    Returns the model or raises RuntimeError if loading failed.
    Callers should catch RuntimeError and report the cached error message.
    """
    global _embedding_model, _load_error

    if _embedding_model is not None:
        return _embedding_model

    # If we already tried and failed, don't retry — report the cached error
    if _load_error is not None:
        raise RuntimeError(_load_error)

    from sentence_transformers import SentenceTransformer
    import os as _os

    # Use locally downloaded model (via ModelScope) to avoid HF network issues
    local_path = _os.path.join(settings.models_dir, settings.embedding_model_name)

    # Validate model directory before attempting to load
    missing = _validate_model_dir(local_path)
    if missing:
        _load_error = (
            f"Embedding model directory is incomplete at '{local_path}'. "
            f"Missing files: {missing}. "
            f"Run: python scripts/download_model.py"
        )
        logger.error("embedding_model_incomplete", path=local_path, missing=missing)
        raise RuntimeError(_load_error)

    if not _os.path.isdir(local_path):
        # Fall back to HF (with cache) — last resort
        logger.warning("embedding_model_not_found_local", path=local_path, fallback=settings.embedding_model_name)
        local_path = settings.embedding_model_name

    logger.info("loading_embedding_model", model=settings.embedding_model_name, path=local_path)
    try:
        _embedding_model = SentenceTransformer(
            local_path,
            cache_folder=settings.models_dir,
        )
        logger.info(
            "embedding_model_loaded",
            dim=_embedding_model.get_sentence_embedding_dimension(),
        )
    except Exception as e:
        _load_error = str(e)
        logger.error("embedding_load_failed", error=str(e))
        raise RuntimeError(_load_error) from e

    return _embedding_model


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a list of texts. Returns list of embedding vectors."""
    model = get_embedding_model()
    embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
    return embeddings.tolist()


def embed_query(text: str) -> list[float]:
    """Embed a single query string. Returns a single embedding vector."""
    return embed_texts([text])[0]


def is_model_loaded() -> bool:
    """Check if embedding model has been loaded."""
    return _embedding_model is not None


def get_load_error() -> Optional[str]:
    """Return the last load error message, or None if model loaded successfully."""
    return _load_error
