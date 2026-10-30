"""Per-user bookmark store with JSON file persistence.

Structure: username -> { bookmark_id -> {question, answer, sources, doc_names, created_at} }
Bookmark IDs are globally unique for clean API semantics, but stored per-user.
"""

from __future__ import annotations

import asyncio
import json
import os
import time
import uuid
import structlog

from app.core.config import settings

logger = structlog.get_logger()

_bookmarks: dict[str, dict[str, dict]] = {}  # username -> bookmark_id -> data
_lock = asyncio.Lock()

BOOKMARK_FILE = os.path.join(settings.data_dir, "bookmarks.json")


def _load_from_disk():
    """Load bookmarks from JSON file."""
    global _bookmarks
    if os.path.exists(BOOKMARK_FILE):
        try:
            with open(BOOKMARK_FILE, "r", encoding="utf-8") as f:
                raw = json.load(f)
            # Support old flat format migration: if top-level values aren't username-keyed,
            # wrap them under a "default" user.
            if raw and isinstance(next(iter(raw.values())), dict) and "question" in next(iter(raw.values())):
                _bookmarks = {"default": raw}
                _save_to_disk()
            else:
                _bookmarks = raw
        except Exception:
            _bookmarks = {}
    if not _bookmarks:
        _bookmarks = {}


def _save_to_disk():
    """Persist bookmarks to JSON file."""
    os.makedirs(settings.data_dir, exist_ok=True)
    with open(BOOKMARK_FILE, "w", encoding="utf-8") as f:
        json.dump(_bookmarks, f, ensure_ascii=False, indent=2)


# Load on module init
_load_from_disk()


def _ensure_user(username: str):
    """Ensure the username key exists in the store."""
    if username not in _bookmarks:
        _bookmarks[username] = {}


async def add_bookmark(username: str, question: str, answer: str, sources: list[dict], doc_names: list[str]) -> str:
    """Save a Q&A pair as a bookmark for the given user. Returns bookmark_id."""
    bid = uuid.uuid4().hex[:12]
    async with _lock:
        _ensure_user(username)
        _bookmarks[username][bid] = {
            "id": bid,
            "question": question,
            "answer": answer,
            "sources": sources,
            "doc_names": doc_names,
            "created_at": time.time(),
        }
        _save_to_disk()
    logger.info("bookmark_added", username=username, bookmark_id=bid)
    return bid


async def list_bookmarks(username: str) -> list[dict]:
    """List all bookmarks for a user, newest first."""
    async with _lock:
        _ensure_user(username)
        items = list(_bookmarks.get(username, {}).values())
        items.sort(key=lambda b: b["created_at"], reverse=True)
        return items


async def delete_bookmark(username: str, bookmark_id: str) -> bool:
    """Delete a bookmark owned by the user. Returns True if existed."""
    async with _lock:
        if username in _bookmarks and bookmark_id in _bookmarks[username]:
            del _bookmarks[username][bookmark_id]
            _save_to_disk()
            logger.info("bookmark_deleted", username=username, bookmark_id=bookmark_id)
            return True
        return False
