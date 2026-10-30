"""Shared auth helpers — imported by all API routers to avoid duplication."""
from fastapi import HTTPException
from app.core.user_store import validate_session


def require_user(token: str) -> str:
    """Validate token and return username. Raises 401 if invalid."""
    sess = validate_session(token)
    if not sess:
        raise HTTPException(401, "Token 无效或已过期，请重新登录")
    return sess["username"]


def require_admin(token: str) -> str:
    """Validate token + admin role. Raises 401 or 403."""
    sess = validate_session(token)
    if not sess:
        raise HTTPException(401, "Token 无效或已过期，请重新登录")
    if sess["role"] != "admin":
        raise HTTPException(403, "仅管理员可执行此操作")
    return sess["username"]
