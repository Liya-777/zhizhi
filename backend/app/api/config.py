"""Runtime configuration API: per-user mode switching without restart."""
import structlog
from fastapi import APIRouter, HTTPException, Query

from app.core.config import get_mock_llm, set_mock_llm, settings
from app.core.embeddings import is_model_loaded, get_load_error
from app.core.vectordb import count_documents
from app.api._auth import require_user
from app.models.schemas import ConfigResponse, ModeSwitchRequest

logger = structlog.get_logger()
router = APIRouter(prefix="/api/config", tags=["config"])


def _resolve_mode(token: str, username: str) -> bool:
    """Return per-user mock_llm from token, falling back to global default."""
    try:
        return get_mock_llm(require_user(token)) if token else settings.mock_llm
    except HTTPException:
        return settings.mock_llm


@router.get("", response_model=ConfigResponse)
async def get_config(token: str = Query(default="", description="Session token (optional — returns global default when absent)")):
    """获取当前的运行时配置状态。"""
    return ConfigResponse(
        mock_llm=_resolve_mode(token, ""),
        embedding_model=settings.embedding_model_name,
        embedding_loaded=is_model_loaded(),
        embedding_error=get_load_error(),
        documents_count=count_documents(),
    )


@router.post("/mode")
async def set_mode(
    req: ModeSwitchRequest,
    token: str = Query(..., description="Session token"),
):
    """运行时切换当前用户的 Mock / AI 检索模式。仅影响当前用户。"""
    username = require_user(token)
    old = get_mock_llm(username)
    set_mock_llm(req.mock_llm, username)
    logger.info("mode_switched", username=username, old=old, new=req.mock_llm)
    return {
        "mock_llm": req.mock_llm,
        "message": f"已切换到{'Mock 本地模式' if req.mock_llm else 'AI 检索模式'}",
    }
