"""Bookmark API routes — per-user, token-authenticated."""
import structlog
from fastapi import APIRouter, HTTPException, Query

from app.core.bookmark_store import add_bookmark, list_bookmarks, delete_bookmark
from app.api._auth import require_user
from app.models.schemas import BookmarkRequest, BookmarkResponse
from datetime import datetime

logger = structlog.get_logger()
router = APIRouter(prefix="/api/bookmarks", tags=["bookmarks"])


@router.post("", response_model=BookmarkResponse)
async def create_bookmark(req: BookmarkRequest, token: str = Query(..., description="Session token")):
    """Save a Q&A pair as a bookmark for the current user."""
    username = require_user(token)
    bid = await add_bookmark(
        username=username,
        question=req.question,
        answer=req.answer,
        sources=[s.model_dump() for s in req.sources] if req.sources else [],
        doc_names=req.doc_names or [],
    )
    return BookmarkResponse(
        id=bid,
        question=req.question,
        answer=req.answer,
        sources=req.sources or [],
        doc_names=req.doc_names or [],
        created_at="",
    )


@router.get("", response_model=list[BookmarkResponse])
async def get_bookmarks(token: str = Query(..., description="Session token")):
    """List all bookmarks for the current user, newest first."""
    username = require_user(token)
    bookmarks = await list_bookmarks(username)

    return [
        BookmarkResponse(
            id=b["id"],
            question=b["question"],
            answer=b["answer"],
            sources=[],
            doc_names=b.get("doc_names", []),
            created_at=datetime.fromtimestamp(b["created_at"]).strftime("%Y-%m-%d %H:%M:%S"),
        )
        for b in bookmarks
    ]


@router.delete("/{bookmark_id}")
async def remove_bookmark(bookmark_id: str, token: str = Query(..., description="Session token")):
    """Delete a bookmark owned by the current user."""
    username = require_user(token)
    existed = await delete_bookmark(username, bookmark_id)
    if not existed:
        raise HTTPException(404, f"收藏不存在: {bookmark_id}")
    return {"status": "deleted", "bookmark_id": bookmark_id}
