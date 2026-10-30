"""File validation and utility functions."""
import os
from app.core.config import settings

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt", ".md", ".markdown"}


def validate_file(filename: str, file_size: int) -> None:
    """Validate file type and size. Raises ValueError on failure."""
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(
            f"不支持的文件类型: {ext}。支持: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )
    max_bytes = settings.max_file_size_mb * 1024 * 1024
    if file_size > max_bytes:
        raise ValueError(
            f"文件过大: {file_size / 1024 / 1024:.1f}MB。限制: {settings.max_file_size_mb}MB"
        )


def get_file_type(filename: str) -> str:
    """Get normalized file type from extension."""
    ext = os.path.splitext(filename)[1].lower()
    mapping = {
        ".pdf": "pdf",
        ".docx": "docx",
        ".doc": "docx",
        ".txt": "txt",
        ".md": "markdown",
        ".markdown": "markdown",
    }
    return mapping.get(ext, "unknown")
