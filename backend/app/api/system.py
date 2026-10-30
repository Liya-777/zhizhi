"""System management API: server status, logs, restart/stop. Admin only."""
import os
import time
import structlog
import subprocess
from fastapi import APIRouter, HTTPException, Query

from app.core.config import settings
from app.core.embeddings import is_model_loaded, get_load_error
from app.core.vectordb import count_documents
from app.api._auth import require_admin

logger = structlog.get_logger()
router = APIRouter(prefix="/api/system", tags=["system"])

# Capture the process start time at import to avoid circular import with app.main
_PROCESS_START = time.time()


@router.get("/status")
async def system_status(token: str = Query(..., description="Session token (admin)")):
    """Detailed server status — admin only."""
    require_admin(token)

    uptime_sec = int(time.time() - _PROCESS_START)
    hours, rem = divmod(uptime_sec, 3600)
    mins, secs = divmod(rem, 60)
    uptime_str = f"{hours}h {mins}m {secs}s" if hours else f"{mins}m {secs}s"

    log_tail: list[str] = []
    log_path = "/tmp/rag-backend.log"
    if os.path.exists(log_path):
        try:
            with open(log_path, "r") as f:
                lines = f.readlines()
                log_tail = [l.rstrip() for l in lines[-20:] if l.strip()]
        except Exception:
            pass

    return {
        "pid": os.getpid(),
        "status": "running",
        "uptime": uptime_str,
        "uptime_seconds": uptime_sec,
        "port": 8000,
        "embedding_loaded": is_model_loaded(),
        "embedding_model": settings.embedding_model_name,
        "embedding_error": get_load_error(),
        "llm_mode": "mock" if settings.mock_llm else "llm",
        "llm_model": settings.deepseek_model,
        "documents_count": count_documents(),
        "log_tail": log_tail[-10:],
    }


@router.post("/restart")
async def system_restart(token: str = Query(..., description="Session token (admin)")):
    """Restart the backend server. Admin only.

    Spawns a background script that kills this process and starts a new one
    after a brief delay. The frontend should poll for availability.
    """
    require_admin(token)
    cwd = os.getcwd()

    try:
        subprocess.Popen(
            [
                "bash", "-c",
                "sleep 1.5; "
                "lsof -ti :8000 | xargs kill -9 2>/dev/null; "
                "sleep 0.5; "
                f"cd {os.fspath(cwd)} && "
                "PYTHONPATH=backend exec python3 -m uvicorn app.main:app "
                "--host 0.0.0.0 --port 8000 > /tmp/rag-backend.log 2>&1",
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True,
        )
        logger.info("server_restart_scheduled")
        return {
            "status": "restarting",
            "message": "服务器将在 2 秒后重启，页面将自动刷新...",
        }
    except Exception as e:
        logger.error("restart_failed", error=str(e))
        raise HTTPException(500, f"重启失败: {str(e)}")


@router.post("/stop")
async def system_stop(token: str = Query(..., description="Session token (admin)")):
    """Stop the backend server. Admin only.

    Kills the uvicorn process immediately. The frontend should detect
    the connection loss and show an appropriate message.
    """
    require_admin(token)

    try:
        subprocess.Popen(
            ["bash", "-c", "sleep 0.5; lsof -ti :8000 | xargs kill -9 2>/dev/null"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True,
        )
        logger.info("server_stop_scheduled")
        return {
            "status": "stopping",
            "message": "服务器即将关闭，请通过终端重新启动…",
        }
    except Exception as e:
        logger.error("stop_failed", error=str(e))
        raise HTTPException(500, f"关闭失败: {str(e)}")
