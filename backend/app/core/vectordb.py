"""ChromaDB vector store wrapper."""
from __future__ import annotations

import os
import structlog
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.core.config import settings

logger = structlog.get_logger()

_client = None
_collection = None

COLLECTION_NAME = "rag_documents"


def _get_collection():
    """Get or create ChromaDB collection."""
    global _client, _collection
    if _collection is None:
        os.makedirs(settings.chroma_dir, exist_ok=True)
        _client = chromadb.PersistentClient(
            path=settings.chroma_dir,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        try:
            _collection = _client.get_collection(COLLECTION_NAME)
            logger.info("chroma_collection_opened", name=COLLECTION_NAME)
        except Exception:
            _collection = _client.create_collection(COLLECTION_NAME)
            logger.info("chroma_collection_created", name=COLLECTION_NAME)
    return _collection


def add_document(doc_id: str, chunks: list[dict], embeddings: list[list[float]]) -> int:
    """Add document chunks and their embeddings to ChromaDB. Returns chunk count."""
    col = _get_collection()
    ids = [f"{doc_id}_{c['index']}" for c in chunks]
    metadatas = [
        {
            "doc_id": doc_id,
            "chunk_index": c["index"],
            "char_start": c["char_start"],
            "char_end": c["char_end"],
        }
        for c in chunks
    ]
    documents = [c["content"] for c in chunks]

    col.add(ids=ids, embeddings=embeddings, metadatas=metadatas, documents=documents)
    logger.info("chroma_document_added", doc_id=doc_id, chunks=len(chunks))
    return len(chunks)


def similarity_search(
    query_embedding: list[float],
    top_k: int = 5,
) -> list[dict]:
    """Search for similar chunks. Returns list of {id, content, metadata, score}."""
    col = _get_collection()
    results = col.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        include=["documents", "metadatas", "distances"],
    )

    out = []
    if not results["ids"] or not results["ids"][0]:
        return out

    for i, chunk_id in enumerate(results["ids"][0]):
        out.append({
            "id": chunk_id,
            "content": results["documents"][0][i] if results["documents"] else "",
            "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
            "score": 1.0 - float(results["distances"][0][i]),
        })
    return out


def delete_document(doc_id: str) -> int:
    """Delete all chunks belonging to a document. Returns deleted count."""
    col = _get_collection()
    # Find all chunk IDs for this doc
    existing = col.get(where={"doc_id": doc_id})
    if existing and existing["ids"]:
        col.delete(ids=existing["ids"])
        count = len(existing["ids"])
        logger.info("chroma_document_deleted", doc_id=doc_id, chunks=count)
        return count
    return 0


def get_document_info(doc_id: str) -> dict | None:
    """Get metadata for a specific document."""
    col = _get_collection()
    existing = col.get(where={"doc_id": doc_id})
    if existing and existing["ids"]:
        return {
            "chunk_count": len(existing["ids"]),
        }
    return None


def get_document_chunks(doc_id: str, limit: int = 3) -> list[dict]:
    """Get the first N chunks of a document for preview."""
    col = _get_collection()
    existing = col.get(
        where={"doc_id": doc_id},
        limit=limit,
        include=["documents", "metadatas"],
    )
    if not existing or not existing["ids"]:
        return []
    chunks = []
    for i, chunk_id in enumerate(existing["ids"]):
        meta = existing["metadatas"][i] if existing["metadatas"] else {}
        content = existing["documents"][i] if existing["documents"] else ""
        chunks.append({
            "index": meta.get("chunk_index", i),
            "content": content,
            "char_start": meta.get("char_start", 0),
            "char_end": meta.get("char_end", len(content)),
        })
    chunks.sort(key=lambda c: c["index"])
    return chunks


def count_documents() -> int:
    """Count unique documents in the collection."""
    col = _get_collection()
    all_data = col.get()
    if all_data and all_data["metadatas"]:
        doc_ids = {m["doc_id"] for m in all_data["metadatas"] if m}
        return len(doc_ids)
    return 0
