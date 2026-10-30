"""Authentication API routes — login, token validation, logout."""

import structlog
from fastapi import APIRouter, HTTPException, Query

from app.core.user_store import verify_password, create_session, validate_session, revoke_session, init_db
from app.models.schemas import LoginRequest, LoginResponse, UserInfo

logger = structlog.get_logger()
router = APIRouter(prefix="/api/auth", tags=["auth"])

# Auto-init DB on first import
init_db()


@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    """Authenticate user, return session token + role."""
    user = verify_password(req.username, req.password)
    if not user:
        raise HTTPException(401, "用户名或密码错误")
    token = create_session(user["username"], user["role"])
    logger.info("user_logged_in", username=user["username"], role=user["role"])
    return LoginResponse(
        token=token,
        role=user["role"],
        username=user["username"],
    )


@router.get("/me", response_model=UserInfo)
async def get_me(token: str = Query(..., description="Session token")):
    """Validate token and return current user info."""
    sess = validate_session(token)
    if not sess:
        raise HTTPException(401, "Token 无效或已过期")
    return UserInfo(
        username=sess["username"],
        role=sess["role"],
        valid=True,
    )


@router.post("/logout")
async def logout(token: str = Query(..., description="Session token")):
    """Revoke a session token."""
    revoke_session(token)
    return {"status": "ok"}
