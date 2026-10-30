"""Question-Answering API routes — per-user sessions, token-authenticated."""
from __future__ import annotations

import json
import os
import time
import structlog
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.core.config import settings, get_mock_llm
from app.core.embeddings import embed_query
from app.core.vectordb import similarity_search
from app.core.llm import generate_answer, generate_answer_stream
from app.core.session_store import create_session, get_session, add_messages, delete_session, list_sessions
from app.api._auth import require_user
from app.models.schemas import QuestionRequest, AnswerResponse, SourceCitation, SessionInfo

logger = structlog.get_logger()
router = APIRouter(prefix="/api/qa", tags=["qa"])


def _load_doc_meta() -> dict:
    """Load document metadata — uses the same cache as documents.py."""
    # Delegate to documents.py's cached loader to avoid repeated disk I/O
    from app.api.documents import _load_metadata
    return _load_metadata()


@router.post("/ask", response_model=AnswerResponse)
async def ask_question(
    req: QuestionRequest,
    token: str = Query(..., description="Session token"),
):
    """Ask a question against uploaded documents. Supports session-based multi-turn."""
    start = time.time()
    username = require_user(token)

    meta = _load_doc_meta()
    if not meta:
        raise HTTPException(400, "请先上传至少一份文档")

    # Load session history if provided
    history = None
    session_id = req.session_id
    if session_id:
        history = await get_session(username, session_id)

    # Embed question
    try:
        q_embedding = embed_query(req.question)
    except Exception as e:
        logger.error("embed_query_failed", error=str(e))
        raise HTTPException(500, f"问题向量化失败: {str(e)}")

    # Search similar chunks
    results = similarity_search(q_embedding, req.top_k)
    if not results:
        return AnswerResponse(
            answer=(
                "未在已上传的文档中找到与您问题相关的内容。\n\n"
                "建议：\n1. 尝试使用不同的关键词\n2. 确认已上传的文档包含相关信息"
            ),
            mode="mock" if get_mock_llm(username) else "llm",
            sources=[],
            processing_time_ms=(time.time() - start) * 1000,
            session_id=session_id,
        )

    # Build context with document names + sources
    doc_name_cache = {}
    context_parts = []
    sources = []

    for i, r in enumerate(results):
        doc_id = r["metadata"].get("doc_id", "unknown")
        if doc_id not in doc_name_cache and doc_id in meta:
            doc_name_cache[doc_id] = meta[doc_id]["filename"]
        doc_name = doc_name_cache.get(doc_id, doc_id)

        context_parts.append(
            f"[来源{i + 1}] 文档: {doc_name}\n{r['content']}"
        )
        sources.append(SourceCitation(
            document_name=doc_name,
            content=r["content"][:500],
            chunk_index=r["metadata"].get("chunk_index", 0),
            relevance_score=round(r["score"], 4),
        ))

    context = "\n\n---\n\n".join(context_parts)

    # If history exists, prepend it to context for mock mode awareness
    if history:
        history_str = "\n".join(
            f"[{'问' if m['role'] == 'user' else '答'}]: {m['content']}" for m in history[-6:]
        )
        context = f"对话历史:\n{history_str}\n\n---\n\n{context}"

    # Generate answer (LLM or Mock)
    answer, mode = await generate_answer(context, req.question, username)

    # Save to session
    new_sid = session_id or await create_session(username)
    await add_messages(username, new_sid, [
        {"role": "user", "content": req.question},
        {"role": "assistant", "content": answer},
    ])

    elapsed = (time.time() - start) * 1000
    logger.info("qa_completed", username=username, question_len=len(req.question), sources=len(sources), elapsed_ms=elapsed, session_id=new_sid)

    return AnswerResponse(
        answer=answer,
        mode=mode,
        sources=sources,
        processing_time_ms=round(elapsed, 1),
        session_id=new_sid,
    )


@router.get("/ask-stream")
async def ask_question_stream(
    question: str = Query(..., min_length=1, max_length=2000, description="用户问题"),
    top_k: int = Query(default=5, ge=1, le=20, description="检索结果数量"),
    session_id: str | None = Query(default=None, description="会话 ID（多轮对话）"),
    token: str = Query(..., description="Session token"),
):
    """Ask a question and stream the answer via SSE. Supports multi-turn conversation.

    Event types:
    - sources:     {"type":"sources","sources":[...],"session_id":"..."}
    - token:       {"type":"token","text":"..."}
    - done:        {"type":"done","mode":"mock|llm","processing_time_ms":...,"session_id":"..."}
    - error:       {"type":"error","message":"..."}
    """
    start = time.time()
    username = require_user(token)
    full_answer = []  # accumulate for saving to session

    async def event_generator():
        nonlocal full_answer

        try:
            meta = _load_doc_meta()
            if not meta:
                yield _sse_event({"type": "error", "message": "请先上传至少一份文档"})
                return

            # Load session history
            history = None
            sid = session_id
            if sid:
                history = await get_session(username, sid)
                if history is None:
                    # Session expired or not found; create a new one
                    sid = None

            # Embed question
            try:
                q_embedding = embed_query(question)
            except Exception as e:
                logger.error("embed_query_failed", error=str(e))
                yield _sse_event({"type": "error", "message": f"问题向量化失败: {str(e)}"})
                return

            # Search similar chunks
            results = similarity_search(q_embedding, top_k)
            if not results:
                yield _sse_event({
                    "type": "done",
                    "mode": "mock" if get_mock_llm(username) else "llm",
                    "processing_time_ms": round((time.time() - start) * 1000, 1),
                    "session_id": sid,
                })
                return

            # Build context with document names + sources
            doc_name_cache = {}
            context_parts = []
            sources = []

            for i, r in enumerate(results):
                doc_id = r["metadata"].get("doc_id", "unknown")
                if doc_id not in doc_name_cache and doc_id in meta:
                    doc_name_cache[doc_id] = meta[doc_id]["filename"]
                doc_name = doc_name_cache.get(doc_id, doc_id)

                context_parts.append(
                    f"[来源{i + 1}] 文档: {doc_name}\n{r['content']}"
                )
                sources.append({
                    "document_name": doc_name,
                    "content": r["content"][:500],
                    "chunk_index": r["metadata"].get("chunk_index", 0),
                    "relevance_score": round(r["score"], 4),
                })

            context = "\n\n---\n\n".join(context_parts)

            # Emit sources first (with session_id for new sessions)
            yield _sse_event({"type": "sources", "sources": sources, "session_id": sid})

            # Stream answer tokens with history
            mode = "mock" if get_mock_llm(username) or not settings.deepseek_api_key else "llm"
            async for token_text in generate_answer_stream(context, question, history, username):
                full_answer.append(token_text)
                yield _sse_event({"type": "token", "text": token_text})

            # Save to session
            new_sid = sid or await create_session(username)
            await add_messages(username, new_sid, [
                {"role": "user", "content": question},
                {"role": "assistant", "content": "".join(full_answer)},
            ])

            elapsed = (time.time() - start) * 1000
            yield _sse_event({
                "type": "done",
                "mode": mode,
                "processing_time_ms": round(elapsed, 1),
                "session_id": new_sid,
            })
            logger.info("qa_stream_completed", username=username, question_len=len(question), sources=len(sources), elapsed_ms=elapsed, session_id=new_sid)

        except Exception as e:
            logger.error("qa_stream_error", error=str(e))
            yield _sse_event({"type": "error", "message": f"服务器内部错误: {str(e)}"})

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )


# ——————————————————————————————————————————————
# Session CRUD — per-user, token-authenticated
# ——————————————————————————————————————————————

@router.post("/sessions")
async def new_session(token: str = Query(..., description="Session token")):
    """Create a new conversation session for the current user."""
    username = require_user(token)
    sid = await create_session(username)
    return {"session_id": sid}


@router.get("/sessions", response_model=list[SessionInfo])
async def get_sessions(token: str = Query(..., description="Session token")):
    """List all active sessions for the current user."""
    username = require_user(token)
    sessions = await list_sessions(username)
    return [SessionInfo(**s) for s in sessions]


@router.get("/sessions/{session_id}/messages")
async def get_session_messages(
    session_id: str,
    token: str = Query(..., description="Session token"),
):
    """Get the full message history for a session owned by the current user."""
    username = require_user(token)
    messages = await get_session(username, session_id)
    if messages is None:
        raise HTTPException(404, f"会话不存在或已过期: {session_id}")
    return {"session_id": session_id, "messages": messages}


@router.delete("/sessions/{session_id}")
async def remove_session(
    session_id: str,
    token: str = Query(..., description="Session token"),
):
    """Delete a session owned by the current user."""
    username = require_user(token)
    existed = await delete_session(username, session_id)
    if not existed:
        raise HTTPException(404, f"会话不存在: {session_id}")
    return {"status": "deleted", "session_id": session_id}


def _sse_event(data: dict) -> str:
    """Format a dict as an SSE event string."""
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"
