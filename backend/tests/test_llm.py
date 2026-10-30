"""Tests for LLM service (mock mode)."""
import pytest
from app.core.llm import generate_answer


class TestMockLLM:
    @pytest.mark.asyncio
    async def test_generates_answer_from_context(self):
        context = "产品A的售价为1999元。\n\n---\n\n产品A提供两年质保服务。"
        question = "产品A的售价是多少？"
        answer, mode = await generate_answer(context, question)
        assert mode == "mock"
        assert "1999" in answer
        assert "[1]" in answer or "[2]" in answer

    @pytest.mark.asyncio
    async def test_no_results_returns_guidance(self):
        context = "文档中没有任何与问题相关的信息。"
        question = "这个产品多少钱？"
        answer, mode = await generate_answer(context, question)
        assert mode == "mock"
        # Should still produce some output
        assert len(answer) > 10

    @pytest.mark.asyncio
    async def test_empty_context_handled(self):
        context = ""
        question = "测试问题"
        answer, mode = await generate_answer(context, question)
        assert mode == "mock"
        assert len(answer) > 0
