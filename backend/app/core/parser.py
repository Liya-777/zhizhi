"""Document parser: extract plain text from PDF, DOCX, TXT, Markdown."""
import io
import os
import structlog

logger = structlog.get_logger()

# Lazy imports for heavy dependencies
_pypdf2_available = True
_docx_available = True
_markdown_available = True

try:
    from PyPDF2 import PdfReader  # noqa: F401
except ImportError:
    try:
        from pypdf2 import PdfReader  # noqa: F401  # legacy PyPDF2 v2
    except ImportError:
        _pypdf2_available = False

try:
    import docx  # noqa: F401
except ImportError:
    _docx_available = False

try:
    import markdown  # noqa: F401
    from bs4 import BeautifulSoup
except ImportError:
    _markdown_available = False


def parse_document(file_path: str, filename: str) -> str:
    """Extract text from a document. Returns plain text string."""
    ext = os.path.splitext(filename)[1].lower()

    if ext == ".pdf":
        return _parse_pdf(file_path)
    elif ext in (".docx", ".doc"):
        return _parse_docx(file_path)
    elif ext in (".md", ".markdown"):
        return _parse_markdown(file_path)
    elif ext == ".txt":
        return _parse_txt(file_path)
    else:
        raise ValueError(f"不支持的文件类型: {ext}")


def _parse_pdf(file_path: str) -> str:
    """Extract text from PDF using PyPDF2."""
    if not _pypdf2_available:
        raise ImportError("PyPDF2 not installed. Run: pip install PyPDF2")
    try:
        from PyPDF2 import PdfReader
    except ImportError:
        from pypdf2 import PdfReader

    logger.info("parsing_pdf", path=file_path)
    reader = PdfReader(file_path)
    texts = []
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        if text:
            texts.append(text)
    result = "\n\n".join(texts)
    logger.info("pdf_parsed", pages=len(reader.pages), chars=len(result))
    return result


def _parse_docx(file_path: str) -> str:
    """Extract text from DOCX using python-docx."""
    if not _docx_available:
        raise ImportError("python-docx not installed. Run: pip install python-docx")
    from docx import Document

    logger.info("parsing_docx", path=file_path)
    doc = Document(file_path)
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    result = "\n\n".join(paragraphs)
    logger.info("docx_parsed", paragraphs=len(paragraphs), chars=len(result))
    return result


def _parse_markdown(file_path: str) -> str:
    """Strip markdown formatting to get plain text."""
    if not _markdown_available:
        raise ImportError("markdown not installed. Run: pip install markdown")
    import markdown
    from bs4 import BeautifulSoup

    logger.info("parsing_markdown", path=file_path)
    with open(file_path, "r", encoding="utf-8") as f:
        md_text = f.read()
    html = markdown.markdown(md_text)
    soup = BeautifulSoup(html, "html.parser")
    result = soup.get_text("\n\n", strip=True)
    logger.info("markdown_parsed", chars=len(result))
    return result


def _parse_txt(file_path: str) -> str:
    """Read plain text file."""
    logger.info("parsing_txt", path=file_path)
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        return f.read()
