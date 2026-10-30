"""Document chunker: split text by natural paragraph boundaries."""
from __future__ import annotations

import re
import structlog
from app.core.config import settings

logger = structlog.get_logger()


def chunk_document(
    text: str,
    chunk_size: int | None = None,
    chunk_overlap: int | None = None,
) -> list[dict]:
    """Split text into overlapping chunks at natural paragraph boundaries.

    Returns list of dicts with: content, index, char_start, char_end.
    """
    chunk_size = chunk_size or settings.chunk_size
    chunk_overlap = chunk_overlap or settings.chunk_overlap

    # Split by paragraph boundaries (double newlines)
    raw_paragraphs = re.split(r"\n\s*\n", text)
    # Clean up each paragraph
    paragraphs = [p.strip() for p in raw_paragraphs if p.strip()]

    if not paragraphs:
        return []

    chunks = []
    current_chunk = ""
    current_start = 0
    chunk_index = 0
    pos = 0

    for para in paragraphs:
        if len(current_chunk) + len(para) + 2 <= chunk_size:
            # Add to current chunk
            current_chunk = (current_chunk + "\n\n" + para).strip() if current_chunk else para
        else:
            # Save current chunk
            if current_chunk:
                char_end = current_start + len(current_chunk)
                chunks.append({
                    "content": current_chunk,
                    "index": chunk_index,
                    "char_start": current_start,
                    "char_end": char_end,
                })
                chunk_index += 1

            # Start new chunk
            # If the paragraph itself is larger than chunk_size, split it
            if len(para) > chunk_size:
                sub_chunks = _split_long_paragraph(para, chunk_size, chunk_overlap)
                for sc in sub_chunks:
                    chunks.append({
                        "content": sc,
                        "index": chunk_index,
                        "char_start": current_start,
                        "char_end": current_start + len(sc),
                    })
                    current_start += len(sc)
                    chunk_index += 1
                current_chunk = ""
            else:
                current_chunk = para
                current_start = pos + text.index(para, pos)

        pos = text.index(para, pos) + len(para)

    # Don't forget the last chunk
    if current_chunk:
        char_end = current_start + len(current_chunk)
        chunks.append({
            "content": current_chunk,
            "index": chunk_index,
            "char_start": current_start,
            "char_end": char_end,
        })

    logger.info("document_chunked", paragraphs=len(paragraphs), chunks=len(chunks))
    return chunks


def _split_long_paragraph(text: str, chunk_size: int, overlap: int) -> list[str]:
    """Split a very long paragraph into sentence-boundary-aware chunks."""
    sentences = re.split(r"(?<=[。！？.!?])\s*", text)
    chunks = []
    current = ""

    for sentence in sentences:
        if len(current) + len(sentence) <= chunk_size:
            current += sentence
        else:
            if current:
                chunks.append(current.strip())
            current = sentence
    if current:
        chunks.append(current.strip())

    return chunks or [text[:chunk_size]]
