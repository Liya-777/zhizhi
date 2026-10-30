"""Application configuration via Pydantic Settings."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """All config from environment variables / .env file."""

    # LLM
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_model: str = "deepseek-v4-flash"
    mock_llm: bool = True

    # Embedding
    embedding_model_name: str = "BAAI/bge-small-zh-v1.5"
    models_dir: str = "/app/models"

    # Document processing
    chunk_size: int = 600
    chunk_overlap: int = 100
    max_file_size_mb: int = 20

    # Retrieval
    default_top_k: int = 5

    # Prompt
    qa_prompt: str = (
        "你是致知，一名帮助学生记者查找资料线索的助手。下面是采访整理稿、公开报告和背景资料。请只依据这些材料回答，并帮助用户回到原文核验。\n\n"
        "## 回答规则\n"
        "- 所有回答必须基于提供的文档内容，不要编造信息\n"
        "- 引用文档中的具体内容时，在引用处标注 [1]、[2] 等编号\n"
        "- 将检索结果表述为资料中的说法或线索，不要把它写成已独立核实的事实\n"
        "- 需要指出材料之间的差异、缺口或时间范围时，如实说明\n"
        "- 每个关键判断都使用 [1]、[2] 等编号指向来源；提醒用户打开来源核对上下文\n"
        "- 如果资料没有覆盖问题，明确说明，并建议补充采访或一手公开资料\n"
        "- 用中文回答，语气清晰、克制，避免替用户下结论\n\n"
        "## 资料内容\n{context}\n\n"
        "## 用户问题\n{question}\n\n"
        "## 回答（引用处标注 [N] 编号）"
    )


    # Paths
    data_dir: str = "data"
    uploads_dir: str = "data/uploads"
    chroma_dir: str = "data/chroma"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()

# ============================================================

# ============================================================
# Runtime mutable state — per-user Mock/AI mode switching
# ============================================================

_user_mock_mode: dict[str, bool] = {}  # username -> mock_llm

def get_mock_llm(username: str = "") -> bool:
    """Get current LLM mode. If username provided and per-user state exists, use that; otherwise global default."""
    if username and username in _user_mock_mode:
        return _user_mock_mode[username]
    return settings.mock_llm

def set_mock_llm(value: bool, username: str = "") -> None:
    """Set LLM mode. With username: per-user. Without: global default (used by config API)."""
    if username:
        _user_mock_mode[username] = value
        # Prune entries that have reverted to the global default — avoids unbounded growth.
        if value == settings.mock_llm:
            _user_mock_mode.pop(username, None)
    else:
        settings.mock_llm = value
