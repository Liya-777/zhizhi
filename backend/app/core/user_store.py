"""SQLite user store with hashed passwords and UUID session tokens."""
from __future__ import annotations


import hashlib
import os
import sqlite3
import time
import uuid
import structlog

from app.core.config import settings

logger = structlog.get_logger()

DB_PATH = os.path.join(settings.data_dir, "users.db")


def _get_db() -> sqlite3.Connection:
    os.makedirs(settings.data_dir, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create tables and seed default users if empty."""
    conn = _get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            role TEXT NOT NULL,
            created_at REAL NOT NULL
        );
    """)
    cur = conn.execute("SELECT COUNT(*) FROM users")
    if cur.fetchone()[0] == 0:
        _create_user_unsafe(conn, "admin", "666666", "admin")
        _create_user_unsafe(conn, "user", "123456", "user")
        logger.info("default_users_seeded")
    conn.commit()
    conn.close()
    # Clean up expired sessions (24h TTL) — after closing init connection to avoid SQLite lock contention
    cleanup_expired_sessions()


def _hash_password(password: str, salt: str | None = None) -> tuple[str, str]:
    """Return (hash, salt). Generates a random salt if none provided."""
    if salt is None:
        salt = uuid.uuid4().hex[:16]
    raw = f"{salt}:{password}"
    return hashlib.sha256(raw.encode()).hexdigest(), salt


def _create_user_unsafe(conn: sqlite3.Connection, username: str, password: str, role: str):
    """Insert a user row. Caller must commit/close."""
    pw_hash, salt = _hash_password(password)
    conn.execute(
        "INSERT INTO users (username, password_hash, salt, role, created_at) VALUES (?, ?, ?, ?, ?)",
        (username, pw_hash, salt, role, _now()),
    )


def verify_password(username: str, password: str) -> dict | None:
    """Check credentials. Returns {username, role} or None."""
    conn = _get_db()
    row = conn.execute(
        "SELECT username, password_hash, salt, role FROM users WHERE username = ?",
        (username,),
    ).fetchone()
    conn.close()
    if not row:
        return None
    pw_hash, _ = _hash_password(password, row["salt"])
    if pw_hash == row["password_hash"]:
        return {"username": row["username"], "role": row["role"]}
    return None


def create_session(username: str, role: str) -> str:
    """Create a new session token. Returns token string."""
    token = uuid.uuid4().hex
    conn = _get_db()
    conn.execute("DELETE FROM sessions WHERE username = ?", (username,))
    conn.execute(
        "INSERT INTO sessions (token, username, role, created_at) VALUES (?, ?, ?, ?)",
        (token, username, role, time.time()),
    )
    conn.commit()
    conn.close()
    return token


def validate_session(token: str) -> dict | None:
    """Check if token is valid. Returns {username, role} or None."""
    conn = _get_db()
    row = conn.execute(
        "SELECT username, role FROM sessions WHERE token = ?", (token,)
    ).fetchone()
    conn.close()
    if not row:
        return None
    return {"username": row["username"], "role": row["role"]}


def revoke_session(token: str):
    """Delete a session (logout)."""
    conn = _get_db()
    conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
    conn.commit()
    conn.close()


def cleanup_expired_sessions():
    """Remove sessions older than 24 hours. Call periodically or on startup."""
    conn = _get_db()
    cutoff = time.time() - 86400  # 24h
    conn.execute("DELETE FROM sessions WHERE created_at < ?", (cutoff,))
    deleted = conn.rowcount if hasattr(conn, 'rowcount') else 0
    conn.commit()
    conn.close()
    if deleted:
        logger.info("expired_sessions_cleaned", count=deleted)


def _now() -> str:
    from datetime import datetime
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
