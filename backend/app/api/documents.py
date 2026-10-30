"""Document upload and management API routes."""
import asyncio
import os
import uuid
import json
import time
from datetime import datetime

import structlog
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.core.config import settings
from app.core.parser import parse_document
from app.core.chunker import chunk_document
from app.core.embeddings import embed_texts
from app.core.vectordb import add_document, delete_document, count_documents, get_document_info, get_document_chunks
from app.api._auth import require_user, require_admin
from app.models.schemas import DocumentInfo, ChunkPreview, DocumentPreview
from app.utils.file_utils import validate_file, get_file_type

logger = structlog.get_logger()
router = APIRouter(prefix="/api/documents", tags=["documents"])

# In-memory metadata store (doc_id → metadata JSON)
METADATA_FILE = os.path.join(settings.data_dir, "documents_meta.json")

# In-memory batch upload progress store
_batch_progress: dict[str, dict] = {}

# In-memory cache — loaded once from disk, kept in sync on writes
_metadata_cache = None  # type: dict | None
_metadata_mtime: float = 0


def _load_metadata() -> dict:
    """Load document metadata from disk — lazily cached. Invalidates when file changes."""
    global _metadata_cache, _metadata_mtime
    try:
        mtime = os.path.getmtime(METADATA_FILE)
    except OSError:
        _metadata_cache = {}
        _metadata_mtime = 0
        return {}
    if _metadata_cache is not None and mtime == _metadata_mtime:
        return _metadata_cache
    try:
        with open(METADATA_FILE, "r", encoding="utf-8") as f:
            _metadata_cache = json.load(f)
        _metadata_mtime = mtime
    except Exception:
        _metadata_cache = {}
        _metadata_mtime = 0
    return _metadata_cache


def _save_metadata(meta: dict):
    """Save document metadata to JSON file and update cache."""
    global _metadata_cache, _metadata_mtime
    os.makedirs(settings.data_dir, exist_ok=True)
    with open(METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    _metadata_cache = meta
    _metadata_mtime = os.path.getmtime(METADATA_FILE)


@router.post("/upload", response_model=DocumentInfo)
async def upload_document(
    file: UploadFile = File(...),
    token: str = Query(..., description="Session token (admin required)"),
):
    """Upload a document: parse → chunk → embed → store. Admin only."""
    require_admin(token)
    if not file.filename:
        raise HTTPException(400, "文件名不能为空")

    # Read file content
    content = await file.read()
    file_size = len(content)

    # Validate
    try:
        validate_file(file.filename, file_size)
    except ValueError as e:
        raise HTTPException(400, str(e))

    # Save file
    doc_id = uuid.uuid4().hex[:12]
    os.makedirs(settings.uploads_dir, exist_ok=True)
    file_path = os.path.join(settings.uploads_dir, f"{doc_id}_{file.filename}")
    with open(file_path, "wb") as f:
        f.write(content)

    logger.info("file_saved", doc_id=doc_id, filename=file.filename, size=file_size)

    # Parse
    try:
        text = parse_document(file_path, file.filename)
    except Exception as e:
        os.remove(file_path)
        logger.error("parse_failed", error=str(e))
        raise HTTPException(400, f"文档解析失败: {str(e)}")

    if not text.strip():
        os.remove(file_path)
        raise HTTPException(400, "文档内容为空，无法处理")

    # Chunk
    chunks = chunk_document(text)
    if not chunks:
        os.remove(file_path)
        raise HTTPException(400, "文档切分后无有效段落")

    # Embed
    try:
        chunk_texts = [c["content"] for c in chunks]
        embeddings = embed_texts(chunk_texts)
    except Exception as e:
        os.remove(file_path)
        logger.error("embed_failed", error=str(e))
        raise HTTPException(500, f"向量化失败: {str(e)}")

    # Store in ChromaDB
    try:
        add_document(doc_id, chunks, embeddings)
    except Exception as e:
        os.remove(file_path)
        logger.error("chroma_store_failed", error=str(e))
        raise HTTPException(500, f"向量存储失败: {str(e)}")

    # Save metadata
    meta = _load_metadata()
    uploaded_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    meta[doc_id] = {
        "id": doc_id,
        "filename": file.filename,
        "file_type": get_file_type(file.filename),
        "file_size_bytes": file_size,
        "chunk_count": len(chunks),
        "uploaded_at": uploaded_at,
    }
    _save_metadata(meta)

    logger.info("document_uploaded", doc_id=doc_id, chunks=len(chunks))

    return DocumentInfo(
        id=doc_id,
        filename=file.filename,
        file_type=get_file_type(file.filename),
        file_size_bytes=file_size,
        chunk_count=len(chunks),
        uploaded_at=uploaded_at,
    )


@router.post("/upload-batch")
async def upload_documents_batch(
    files: list[UploadFile] = File(...),
    token: str = Query(..., description="Session token (admin required)"),
):
    """Upload multiple documents. Admin only. Returns a batch_id for SSE progress tracking."""
    require_admin(token)
    if not files:
        raise HTTPException(400, "请选择至少一个文件")

    batch_id = uuid.uuid4().hex[:12]
    file_list = []

    for i, file in enumerate(files):
        if not file.filename:
            continue
        file_list.append({
            "index": i,
            "filename": file.filename,
            "size": 0,  # will be updated after reading
            "stage": "queued",
        })

    if not file_list:
        raise HTTPException(400, "请选择有效的文件")

    _batch_progress[batch_id] = {
        "files": file_list,
        "created_at": time.time(),
        "status": "processing",
        "total": len(file_list),
        "completed": 0,
        "errors": [],
        "results": [],
    }

    # Process files in background — read all content now before FastAPI closes handles
    file_data = []
    for file in files:
        content = await file.read()
        file_data.append({
            "filename": file.filename,
            "content": content,
        })

    asyncio.create_task(_process_batch(batch_id, file_data))

    return {
        "batch_id": batch_id,
        "file_count": len(file_list),
        "files": [{"index": f["index"], "filename": f["filename"], "size": f["size"]} for f in file_list],
    }


@router.get("/upload-progress/{batch_id}")
async def upload_progress(batch_id: str):
    """SSE endpoint: stream batch upload progress."""
    async def progress_generator():
        # Poll progress every 300ms
        while True:
            batch = _batch_progress.get(batch_id)
            if not batch:
                yield _sse_doc_event({"type": "error", "message": "批次不存在或已过期"})
                return

            # Emit progress per file
            for f in batch["files"]:
                yield _sse_doc_event({
                    "type": "progress",
                    "file_index": f["index"],
                    "filename": f["filename"],
                    "stage": f["stage"],
                    "progress_pct": f.get("progress_pct", 0),
                    "error": f.get("error"),
                })

            if batch["status"] == "complete":
                yield _sse_doc_event({
                    "type": "complete",
                    "results": batch["results"],
                    "errors": batch["errors"],
                })
                # Cleanup after 60s
                asyncio.get_event_loop().call_later(60, lambda: _batch_progress.pop(batch_id, None))
                return

            if batch["status"] == "error":
                yield _sse_doc_event({"type": "error", "message": "批次处理失败"})
                _batch_progress.pop(batch_id, None)
                return

            await asyncio.sleep(0.3)

    return StreamingResponse(
        progress_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


async def _process_batch(batch_id: str, file_data: list[dict]):
    """Process each file in the batch sequentially, updating _batch_progress."""
    batch = _batch_progress.get(batch_id)
    if not batch:
        return

    for i, fd in enumerate(file_data):
        file_entry = batch["files"][i]
        try:
            content = fd["content"]
            filename = fd["filename"] or f"file_{i}"
            file_size = len(content)
            file_entry["stage"] = "parsing"
            file_entry["progress_pct"] = 10
            file_entry["size"] = file_size
            file_entry["filename"] = filename

            validate_file(filename, file_size)

            # Save file
            doc_id = uuid.uuid4().hex[:12]
            os.makedirs(settings.uploads_dir, exist_ok=True)
            file_path = os.path.join(settings.uploads_dir, f"{doc_id}_{filename}")
            with open(file_path, "wb") as f:
                f.write(content)

            # Parse
            file_entry["stage"] = "parsing"
            file_entry["progress_pct"] = 30
            text = parse_document(file_path, filename)
            if not text.strip():
                os.remove(file_path)
                raise ValueError("文档内容为空")

            # Chunk
            file_entry["stage"] = "chunking"
            file_entry["progress_pct"] = 50
            chunks = chunk_document(text)

            # Embed
            file_entry["stage"] = "embedding"
            file_entry["progress_pct"] = 70
            chunk_texts = [c["content"] for c in chunks]
            embeddings = embed_texts(chunk_texts)

            # Store
            file_entry["stage"] = "storing"
            file_entry["progress_pct"] = 90
            add_document(doc_id, chunks, embeddings)

            # Save metadata
            meta = _load_metadata()
            uploaded_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            meta[doc_id] = {
                "id": doc_id,
                "filename": filename,
                "file_type": get_file_type(filename),
                "file_size_bytes": file_size,
                "chunk_count": len(chunks),
                "uploaded_at": uploaded_at,
            }
            _save_metadata(meta)

            file_entry["stage"] = "done"
            file_entry["progress_pct"] = 100
            batch["completed"] += 1
            batch["results"].append({
                "id": doc_id,
                "filename": filename,
                "file_type": get_file_type(filename),
                "file_size_bytes": file_size,
                "chunk_count": len(chunks),
                "uploaded_at": uploaded_at,
            })

            logger.info("batch_file_done", batch_id=batch_id, file=filename, doc_id=doc_id)

        except Exception as e:
            file_entry["stage"] = "error"
            file_entry["error"] = str(e)
            batch["errors"].append({"filename": filename or f"file_{i}", "error": str(e)})
            logger.error("batch_file_error", batch_id=batch_id, file=filename, error=str(e))

    batch["status"] = "complete"
    logger.info("batch_complete", batch_id=batch_id, done=batch["completed"], errors=len(batch["errors"]))


def _sse_doc_event(data: dict) -> str:
    """Format a dict as an SSE event string."""
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"


@router.get("", response_model=list[DocumentInfo])
async def list_documents(token: str = Query(default="", description="Session token")):
    """List all uploaded documents. Requires authentication (any role)."""
    if token:
        require_user(token)# validates token, raises 401 if invalid
    meta = _load_metadata()
    # Sort by upload time (newest first)
    docs = sorted(meta.values(), key=lambda d: d["uploaded_at"], reverse=True)
    return [
        DocumentInfo(
            id=d["id"],
            filename=d["filename"],
            file_type=d["file_type"],
            file_size_bytes=d["file_size_bytes"],
            chunk_count=d["chunk_count"],
            uploaded_at=d["uploaded_at"],
        )
        for d in docs
    ]


@router.get("/{doc_id}", response_model=DocumentInfo)
async def get_document(doc_id: str, token: str = Query(default="", description="Session token")):
    """Get document details. Requires authentication (any role)."""
    if token:
        require_user(token)# validates token, raises 401 if invalid
    meta = _load_metadata()
    if doc_id not in meta:
        raise HTTPException(404, f"文档不存在: {doc_id}")

    chroma_info = get_document_info(doc_id)
    d = meta[doc_id]
    return DocumentInfo(
        id=d["id"],
        filename=d["filename"],
        file_type=d["file_type"],
        file_size_bytes=d["file_size_bytes"],
        chunk_count=chroma_info["chunk_count"] if chroma_info else d["chunk_count"],
        uploaded_at=d["uploaded_at"],
    )


@router.get("/{doc_id}/preview", response_model=DocumentPreview)
async def get_document_preview(doc_id: str, chunks: int = 3, token: str = Query(default="", description="Session token")):
    """Get the first N chunks of a document for preview. Requires authentication (any role)."""
    if token:
        require_user(token)# validates token, raises 401 if invalid
    meta = _load_metadata()
    if doc_id not in meta:
        raise HTTPException(404, f"文档不存在: {doc_id}")

    preview_chunks = get_document_chunks(doc_id, limit=min(chunks, 10))
    return DocumentPreview(
        doc_id=doc_id,
        filename=meta[doc_id]["filename"],
        total_chunks=meta[doc_id]["chunk_count"],
        preview_chunks=[
            ChunkPreview(
                index=c["index"],
                content=c["content"][:500],
                char_start=c["char_start"],
                char_end=c["char_end"],
            )
            for c in preview_chunks
        ],
    )


@router.put("/{doc_id}", response_model=DocumentInfo)
async def replace_document(
    doc_id: str,
    file: UploadFile = File(...),
    token: str = Query(..., description="Session token (admin required)"),
):
    """Replace a document. Admin only."""
    require_admin(token)
    meta = _load_metadata()
    if doc_id not in meta:
        raise HTTPException(404, f"文档不存在: {doc_id}")

    if not file.filename:
        raise HTTPException(400, "文件名不能为空")

    # Read new file
    content = await file.read()
    file_size = len(content)

    try:
        validate_file(file.filename, file_size)
    except ValueError as e:
        raise HTTPException(400, str(e))

    # Delete old file
    for fname in os.listdir(settings.uploads_dir):
        if fname.startswith(doc_id + "_"):
            os.remove(os.path.join(settings.uploads_dir, fname))
            break

    # Delete old vectors
    delete_document(doc_id)

    # Save new file
    os.makedirs(settings.uploads_dir, exist_ok=True)
    file_path = os.path.join(settings.uploads_dir, f"{doc_id}_{file.filename}")
    with open(file_path, "wb") as f:
        f.write(content)

    logger.info("file_replaced", doc_id=doc_id, filename=file.filename, size=file_size)

    # Parse
    try:
        text = parse_document(file_path, file.filename)
    except Exception as e:
        os.remove(file_path)
        raise HTTPException(400, f"文档解析失败: {str(e)}")

    if not text.strip():
        os.remove(file_path)
        raise HTTPException(400, "文档内容为空，无法处理")

    # Chunk
    chunks = chunk_document(text)
    if not chunks:
        os.remove(file_path)
        raise HTTPException(400, "文档切分后无有效段落")

    # Embed
    try:
        chunk_texts = [c["content"] for c in chunks]
        embeddings = embed_texts(chunk_texts)
    except Exception as e:
        os.remove(file_path)
        raise HTTPException(500, f"向量化失败: {str(e)}")

    # Store in ChromaDB
    try:
        add_document(doc_id, chunks, embeddings)
    except Exception as e:
        os.remove(file_path)
        raise HTTPException(500, f"向量存储失败: {str(e)}")

    # Update metadata
    uploaded_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    meta[doc_id] = {
        "id": doc_id,
        "filename": file.filename,
        "file_type": get_file_type(file.filename),
        "file_size_bytes": file_size,
        "chunk_count": len(chunks),
        "uploaded_at": uploaded_at,
    }
    _save_metadata(meta)

    logger.info("document_replaced", doc_id=doc_id, new_file=file.filename, chunks=len(chunks))

    return DocumentInfo(
        id=doc_id,
        filename=file.filename,
        file_type=get_file_type(file.filename),
        file_size_bytes=file_size,
        chunk_count=len(chunks),
        uploaded_at=uploaded_at,
    )


@router.delete("/{doc_id}")
async def delete_document_route(
    doc_id: str,
    token: str = Query(..., description="Session token (admin required)"),
):
    """Delete a document and its vector data. Admin only."""
    require_admin(token)
    meta = _load_metadata()
    if doc_id not in meta:
        raise HTTPException(404, f"文档不存在: {doc_id}")

    # Delete file
    for fname in os.listdir(settings.uploads_dir):
        if fname.startswith(doc_id + "_"):
            os.remove(os.path.join(settings.uploads_dir, fname))
            break

    # Delete from ChromaDB
    deleted = delete_document(doc_id)

    # Remove from metadata
    del meta[doc_id]
    _save_metadata(meta)

    logger.info("document_deleted", doc_id=doc_id, chroma_chunks=deleted)
    return {"status": "deleted", "doc_id": doc_id, "chunks_removed": deleted}
