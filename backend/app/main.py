"""FastAPI application: API routes + static frontend serve."""
import json
import os
import time
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.embeddings import is_model_loaded, get_embedding_model, get_load_error
from app.core.vectordb import count_documents
from app.api.documents import router as documents_router
from app.api.qa import router as qa_router
from app.api.config import router as config_router
from app.api.bookmarks import router as bookmarks_router
from app.api.auth import router as auth_router
from app.api.system import router as system_router
from app.models.schemas import HealthResponse, ErrorResponse

logger = structlog.get_logger()

START_TIME = time.time()

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: preload embedding model. Shutdown: cleanup."""
    import asyncio

    logger.info("app_starting", mock_llm=settings.mock_llm)

    # Ensure data directories
    os.makedirs(settings.uploads_dir, exist_ok=True)
    os.makedirs(settings.chroma_dir, exist_ok=True)
    os.makedirs(settings.data_dir, exist_ok=True)

    # Preload embedding model (awaited — startup blocks until ready or failed)
    try:
        await asyncio.to_thread(_preload_sync)
    except Exception as e:
        logger.error("embedding_preload_failed", error=str(e))

    yield
    logger.info("app_shutting_down")


def _preload_sync():
    """Sync wrapper for embedding model preload (runs in thread pool)."""
    get_embedding_model()
    logger.info("embedding_model_ready")


app = FastAPI(
    title="致知：可追溯资料问答工具",
    description="面向学生记者的采访稿、公开报告与背景资料检索工具",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — restrict to dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(documents_router)
app.include_router(qa_router)
app.include_router(config_router)
app.include_router(bookmarks_router)
app.include_router(auth_router)
app.include_router(system_router)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all: return structured error JSON."""
    from fastapi import HTTPException
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content=ErrorResponse(
                error="http_error",
                detail=str(exc.detail),
                status_code=exc.status_code,
            ).model_dump(),
        )
    logger.error("unhandled_error", error=str(exc), path=str(request.url))
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="internal_error",
            detail="服务器内部错误，请查看日志",
            status_code=500,
        ).model_dump(),
    )




@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Health check with system status."""
    # Document count from metadata (source of truth), not raw ChromaDB
    meta_count = 0
    metadata_path = os.path.join(settings.data_dir, "documents_meta.json")
    if os.path.exists(metadata_path):
        try:
            with open(metadata_path, "r") as f:
                meta_count = len(json.load(f))
        except Exception:
            pass

    return HealthResponse(
        status="ok",
        embedding_model=settings.embedding_model_name,
        embedding_loaded=is_model_loaded(),
        embedding_error=get_load_error(),
        llm_mode="mock" if settings.mock_llm else "llm",
        llm_model=settings.deepseek_model,
        documents_count=meta_count,
    )


# === Static frontend serve ===
# Mount static assets first, then serve index.html for all other routes (SPA fallback)

if os.path.exists(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")


@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    """Serve frontend SPA — fallback to index.html for client-side routing."""
    # API routes are handled above, so this catches only frontend requests
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(
            index_path,
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
            },
        )
    return JSONResponse(
        status_code=404,
        content={"message": "前端未构建。请运行: bash scripts/build.sh"},
    )
