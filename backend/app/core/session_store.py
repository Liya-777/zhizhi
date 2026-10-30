"""Per-user SQLite-persistent session store for multi-turn conversations.

Stores conversation history as JSON-serialized message arrays per session.
Thread-safe via asyncio.Lock. Per-user limits: 3 sessions, 10 messages each.
Sessions survive server restarts. Expired sessions cleaned on access.
"""

from __future__ import annotations

import asyncio
import json
import os
import sqlite3
import time
import uuid
import structlog

from app.core.config import settings

logger = structlog.get_logger()

DB_PATH = os.path.join(settings.data_dir, "sessions.db")
_lock = asyncio.Lock()

MAX_SESSIONS_PER_USER = 3
SESSION_TTL_SECONDS = 86400  # 24 hours
MAX_MESSAGES_PER_SESSION = 10


def _get_db() -> sqlite3.Connection:
    os.makedirs(settings.data_dir, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _init_tables():
    conn = _get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS sessions (
            username     TEXT NOT NULL,
            session_id   TEXT NOT NULL,
            messages     TEXT NOT NULL DEFAULT '[]',
            created_at   REAL NOT NULL,
            last_active  REAL NOT NULL,
            PRIMARY KEY (username, session_id)
        );
        CREATE INDEX IF NOT EXISTS idx_sessions_last_active
            ON sessions(username, last_active DESC);
    """)
    conn.commit()
    conn.close()


# Init on module import
_init_tables()


def _json_dumps(obj) -> str:
    return json.dumps(obj, ensure_ascii=False)


def _json_loads(s: str) -> list[dict]:
    try:
        return json.loads(s)
    except Exception:
        return []


# ── Public API (same signatures as before — just backed by SQLite) ──


async def create_session(username: str) -> str:
    session_id = uuid.uuid4().hex[:12]
    now = time.time()

    async with _lock:
        conn = _get_db()
        _enforce_limit_locked(conn, username)
        conn.execute(
            "INSERT INTO sessions (username, session_id, messages, created_at, last_active) VALUES (?, ?, '[]', ?, ?)",
            (username, session_id, now, now),
        )
        conn.commit()
        conn.close()

    logger.info("session_created", username=username, session_id=session_id)
    return session_id


async def get_session(username: str, session_id: str) -> list[dict] | None:
    async with _lock:
        conn = _get_db()
        _cleanup_expired_locked(conn)
        row = conn.execute(
            "SELECT messages FROM sessions WHERE username = ? AND session_id = ?",
            (username, session_id),
        ).fetchone()
        if not row:
            conn.close()
            return None
        # Touch last_active
        conn.execute(
            "UPDATE sessions SET last_active = ? WHERE username = ? AND session_id = ?",
            (time.time(), username, session_id),
        )
        conn.commit()
        messages = _json_loads(row["messages"])
        conn.close()
        return messages


async def add_messages(username: str, session_id: str, messages: list[dict]) -> bool:
    async with _lock:
        conn = _get_db()
        _enforce_limit_locked(conn, username)
        now = time.time()

        existing = conn.execute(
            "SELECT messages FROM sessions WHERE username = ? AND session_id = ?",
            (username, session_id),
        ).fetchone()

        if existing:
            merged = (_json_loads(existing["messages"]) + messages)[-MAX_MESSAGES_PER_SESSION:]
            conn.execute(
                "UPDATE sessions SET messages = ?, last_active = ? WHERE username = ? AND session_id = ?",
                (_json_dumps(merged), now, username, session_id),
            )
            existed = True
        else:
            conn.execute(
                "INSERT INTO sessions (username, session_id, messages, created_at, last_active) VALUES (?, ?, ?, ?, ?)",
                (username, session_id, _json_dumps(messages[-MAX_MESSAGES_PER_SESSION:]), now, now),
            )
            existed = False

        conn.commit()
        conn.close()
        return existed


async def delete_session(username: str, session_id: str) -> bool:
    async with _lock:
        conn = _get_db()
        cur = conn.execute(
            "DELETE FROM sessions WHERE username = ? AND session_id = ?",
            (username, session_id),
        )
        existed = cur.rowcount > 0
        conn.commit()
        conn.close()
        if existed:
            logger.info("session_deleted", username=username, session_id=session_id)
        return existed


async def list_sessions(username: str) -> list[dict]:
    async with _lock:
        conn = _get_db()
        _cleanup_expired_locked(conn)
        _enforce_limit_locked(conn, username)
        rows = conn.execute(
            "SELECT session_id, messages, created_at, last_active FROM sessions WHERE username = ? ORDER BY last_active DESC",
            (username,),
        ).fetchall()
        conn.close()

        result = []
        for r in rows:
            msgs = _json_loads(r["messages"])
            result.append({
                "session_id": r["session_id"],
                "message_count": len(msgs),
                "created_at": _format_time(r["created_at"]),
                "last_active": _format_time(r["last_active"]),
            })
        return result


# ── Internal helpers ──────────────────────────────────────────


def _enforce_limit_locked(conn: sqlite3.Connection, username: str):
    """Trim sessions to MAX_SESSIONS_PER_USER, keeping the most recently active."""
    rows = conn.execute(
        "SELECT session_id FROM sessions WHERE username = ? ORDER BY last_active DESC",
        (username,),
    ).fetchall()
    for r in rows[MAX_SESSIONS_PER_USER:]:
        conn.execute(
            "DELETE FROM sessions WHERE username = ? AND session_id = ?",
            (username, r["session_id"]),
        )
        logger.info("session_evicted", username=username, session_id=r["session_id"])


def _cleanup_expired_locked(conn: sqlite3.Connection):
    """Remove expired sessions. Must be called within _lock."""
    cutoff = time.time() - SESSION_TTL_SECONDS
    conn.execute("DELETE FROM sessions WHERE last_active < ?", (cutoff,))


def _format_time(ts: float) -> str:
    from datetime import datetime
    return datetime.fromtimestamp(ts).strftime("%Y-%m-%d %H:%M:%S")
