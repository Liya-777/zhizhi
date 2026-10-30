"""LLM service: DeepSeek API + Mock fallback mode."""
from __future__ import annotations

import asyncio
import re
import structlog
import httpx
from typing import AsyncGenerator
from app.core.config import settings, get_mock_llm

logger = structlog.get_logger()


async def generate_answer(context: str, question: str, username: str = "") -> tuple[str, str]:
    """Generate answer using LLM or Mock.

    Returns (answer, mode) where mode is "llm" or "mock".
    """
    if get_mock_llm(username) or not settings.deepseek_api_key:
        return _mock_generate(context, question), "mock"
    return await _deepseek_generate(context, question), "llm"


async def generate_answer_stream(
    context: str, question: str, history: list[dict] | None = None, username: str = "",
) -> AsyncGenerator[str, None]:
    """Stream answer tokens using LLM or Mock. Yields raw text chunks.

    Use this with SSE to stream answer token-by-token to the frontend.
    """
    if get_mock_llm(username) or not settings.deepseek_api_key:
        async for token in _mock_generate_stream(context, question, history):
            yield token
    else:
        async for token in _deepseek_generate_stream(context, question, history):
            yield token


def _build_search_terms(question: str) -> set[str]:
    """Build search terms from question for context matching."""
    # Remove punctuation
    clean = re.sub(r"[？?！!，,。、；;：:\s\"\'「」『』【】（）\(\)]", "", question)

    terms = set()

    # 2-char sliding windows (captures Chinese word pairs like 售价, 报销, 住宿)
    for i in range(len(clean) - 1):
        pair = clean[i:i + 2]
        terms.add(pair)

    # Also try individual meaningful characters
    grammar = set("的了吗呢吧啊呀与和或有也就在对到及请问如何怎么什么哪可以这是有不是")
    for ch in clean:
        if ch not in grammar and ord(ch) > 127:
            terms.add(ch)

    return terms


def _mock_generate(context: str, question: str) -> str:
    """Mock LLM: extract relevant sentences from context and format answer."""
    return _mock_generate_with_history(context, question, None)


def _mock_generate_with_history(context: str, question: str, history: list[dict] | None = None) -> str:
    """Mock LLM: analyze question intent and synthesize answer from document context.

    Supports: fact lookup, comparison, advice/recommendation, and summary.
    Quotes source documents to simulate a real AI assistant.
    """
    logger.info("mock_llm_generating", history_turns=len(history) if history else 0)

    sources = context.split("\n\n---\n\n")
    search_terms = _build_search_terms(question)

    # Extract relevant sentences with scores across all sources
    all_hits: list[tuple[str, int, int]] = []  # (sentence, score, source_index)
    for si, src in enumerate(sources):
        # Strip source header lines like "[来源1] 文档: xxx"
        clean_src = re.sub(r'^\[来源\d+\]\s*文档:\s*[^\n]*\n?', '', src, flags=re.MULTILINE)
        sentences = re.split(r"[。！？.!?\n]", clean_src)
        for sent in sentences:
            sent = sent.strip()
            # Skip meta-like lines and short fragments
            if not sent or len(sent) < 8:
                continue
            if sent.startswith("[来源") or sent.startswith("文档:"):
                continue
            score = sum(1 for term in search_terms if term in sent)
            if score > 0:
                all_hits.append((sent, score, si + 1))

    all_hits.sort(key=lambda x: x[1], reverse=True)

    # Filter to unique-ish sentences (dedup by first 8 chars)
    seen = set()
    unique_hits = []
    for sent, score, si in all_hits:
        key = sent[:8]
        if key not in seen:
            seen.add(key)
            unique_hits.append((sent, score, si))
    hits = unique_hits[:12]

    if not hits:
        return _no_results_response(question)

    # Quality gate: if the best match only scored 1 (single-char match on
    # a nonsense query like "哈看"), treat as no-results instead of returning
    # irrelevant noise. For very short queries the bar is higher.
    clean_q = re.sub(r"[？?！!，,。、；;：:\s\"\'「」『』【】（）\(\)]", "", question)
    max_score = hits[0][1] if hits else 0
    if max_score <= 1 and len(clean_q) <= 4:
        return _no_results_response(question)

    # Classify question intent with simple keyword heuristics
    advice_keywords = {"建议", "推荐", "怎么办", "怎么处理", "如何处理", "如何选择", "选哪个",
                       "哪个好", "帮我分析", "帮我看看", "给点意见", "指导", "方案", "对策"}
    compare_keywords = {"对比", "比较", "区别", "差异", "不同", "哪个更", "优劣", "优劣对比"}
    summary_keywords = {"总结", "概述", "摘要", "归纳", "概括", "总览", "介绍"}

    q_lower = question.lower()
    is_advice = any(kw in question for kw in advice_keywords)
    is_compare = any(kw in question for kw in compare_keywords)
    is_summary = any(kw in question for kw in summary_keywords)

    # Build answer based on intent
    lines = []

    if is_advice:
        lines.append(f"以下是与「{question}」相关的资料线索，仍请回到原文核对完整语境：\n")
        lines.append("## 资料中的关键信息\n")
        for i, (sent, _, si) in enumerate(hits[:6]):
            lines.append(f"- {sent} [{si}]")
        lines.append("\n## 继续核验的方向\n")
        lines.append("1. **定位原文**：打开对应来源，确认说话者、发布时间与完整上下文")
        lines.append("2. **交叉比对**：寻找独立公开资料或不同受访者的记录")
        lines.append("3. **补充采访**：记录材料未覆盖的关键问题，向相关主体求证")
        if len(hits) > 6:
            lines.append(f"\n> 上述线索来自 {len(hits)} 个相关片段，不能替代独立事实核查。")

    elif is_compare:
        lines.append(f"以下资料片段可用于比较「{question}」，请先核对每段材料的来源和时间：\n")
        lines.append("## 可比对的资料线索\n")
        for i, (sent, _, si) in enumerate(hits[:8]):
            lines.append(f"- {sent} [{si}]")
        lines.append("\n## 核验提示\n")
        lines.append("注意区分材料的发布时间、数据口径、受访者身份和适用范围；差异本身可能值得继续采访。")

    elif is_summary:
        lines.append(f"资料中与「{question}」相关的内容可归纳为：\n")
        for i, (sent, _, si) in enumerate(hits[:8]):
            lines.append(f"{i + 1}. {sent} [{si}]")

    else:
        # Fact lookup — default mode
        lines.append(f"以下是资料中与「{question}」相关的线索；请打开引用来源核对原始语境：\n")
        for i, (sent, _, si) in enumerate(hits[:8]):
            lines.append(f"- {sent} [{si}]")
        if len(hits) > 8:
            lines.append(f"\n> 还有 {len(hits) - 8} 个相关片段未列出，可以用人物、地点、时间或机构名称进一步缩小范围。")
        # Add a subtle nudge for follow-up
        if len(hits) >= 3:
            lines.append(f"\n💡 你可以继续问：谁这样说？何时发布？哪些材料的说法不同？")

    return "\n".join(lines)


def _no_results_response(question: str) -> str:
    """Generate a helpful 'no results' response."""
    clean = re.sub(r"[？?！!，,。、；;：:\s\"\'「」『』【】（）\(\)]", "", question)
    # Short/nonsense input
    if len(clean) <= 2:
        return (
            f"「{question}」看起来可能是输入有误？\n\n"
            "**你可以试试这样问：**\n"
            "- 用完整的关键词描述人物、事件、地点或机构，例如「谁提出了夜校延时开放」\n"
            "- 如果不确定资料里有什么，可以问「这些资料涉及哪些争议」\n"
            "- 找到线索后，请打开来源核对完整语境"
        )
    return (
        f"在已导入资料中，未找到与「{question}」直接相关的信息。\n\n"
        "**建议您尝试：**\n"
        "1. 使用不同的关键词重新提问（例如同义词、简称、全称）\n"
        "2. 导入相关的采访整理稿、公开报告或背景资料\n"
        "3. 将问题拆成可核验的人物、时间、地点或机构，再重新检索\n\n"
        "我可以帮助你从现有资料中定位下一步核验线索。"
    )


async def _deepseek_generate(context: str, question: str) -> str:
    """Call DeepSeek API (OpenAI-compatible) for answer generation.
    Retries up to 3 times on rate-limit / server errors with exponential backoff."""
    prompt = settings.qa_prompt.format(context=context, question=question)
    last_error = None  # type: Exception | None

    for attempt in range(3):
        try:
            logger.info("deepseek_api_calling", model=settings.deepseek_model, attempt=attempt + 1)

            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(
                    f"{settings.deepseek_base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.deepseek_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": settings.deepseek_model,
                        "messages": [
                            {"role": "system", "content": "你是致知，一名帮助学生记者检索资料线索并回到原文核验的助手。"},
                            {"role": "user", "content": prompt},
                        ],
                        "temperature": 0.3,
                        "max_tokens": 2000,
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                answer = data["choices"][0]["message"]["content"]
                logger.info("deepseek_api_success", tokens=data.get("usage", {}), attempt=attempt + 1)
                return answer

        except httpx.HTTPStatusError as e:
            last_error = e
            if e.response.status_code in (429, 503, 502) and attempt < 2:
                delay = 2 ** attempt  # 1s, 2s
                logger.warning("deepseek_retry", status=e.response.status_code, attempt=attempt + 1, delay=delay)
                await asyncio.sleep(delay)
                continue
            raise
        except (httpx.TimeoutException, httpx.ConnectError) as e:
            last_error = e
            if attempt < 2:
                delay = 2 ** attempt
                logger.warning("deepseek_retry_timeout", attempt=attempt + 1, delay=delay)
                await asyncio.sleep(delay)
                continue
            raise

    raise last_error  # type: ignore[misc]


async def _mock_generate_stream(
    context: str, question: str, history: list[dict] | None = None,
) -> AsyncGenerator[str, None]:
    """Mock streaming: yield answer character-by-character to simulate typing."""
    # Use the same logic as _mock_generate to build the answer
    answer = _mock_generate_with_history(context, question, history)
    logger.info("mock_streaming_start", chars=len(answer))

    # Yield in small chunks for a smooth typing effect
    chunk_size = 3
    for i in range(0, len(answer), chunk_size):
        yield answer[i:i + chunk_size]
        await asyncio.sleep(0.03)


async def _deepseek_generate_stream(
    context: str, question: str, history: list[dict] | None = None,
) -> AsyncGenerator[str, None]:
    """Stream answer from DeepSeek API using SSE. Retries up to 3 times."""
    prompt = settings.qa_prompt.format(context=context, question=question)

    messages = [{"role": "system", "content": "你是致知，一名帮助学生记者检索资料线索并回到原文核验的助手。"}]
    if history:
        messages.extend(history)
    messages.append({"role": "user", "content": prompt})

    last_error = None  # type: Exception | None

    for attempt in range(3):
        try:
            logger.info("deepseek_streaming_start", model=settings.deepseek_model, history_turns=len(history) if history else 0, attempt=attempt + 1)

            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream(
                    "POST",
                    f"{settings.deepseek_base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.deepseek_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": settings.deepseek_model,
                        "messages": messages,
                        "temperature": 0.3,
                        "max_tokens": 2000,
                        "stream": True,
                    },
                ) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:]
                            if data_str.strip() == "[DONE]":
                                break
                            try:
                                import json as _json
                                data = _json.loads(data_str)
                                delta = data.get("choices", [{}])[0].get("delta", {})
                                content = delta.get("content", "")
                                if content:
                                    yield content
                            except Exception:
                                continue

            logger.info("deepseek_streaming_done")
            return  # success — exit retry loop

        except httpx.HTTPStatusError as e:
            last_error = e
            if e.response.status_code in (429, 503, 502) and attempt < 2:
                delay = 2 ** attempt
                logger.warning("deepseek_stream_retry", status=e.response.status_code, attempt=attempt + 1, delay=delay)
                await asyncio.sleep(delay)
                continue
            raise
        except (httpx.TimeoutException, httpx.ConnectError) as e:
            last_error = e
            if attempt < 2:
                delay = 2 ** attempt
                logger.warning("deepseek_stream_retry_timeout", attempt=attempt + 1, delay=delay)
                await asyncio.sleep(delay)
                continue
            raise

    raise last_error  # type: ignore[misc]
