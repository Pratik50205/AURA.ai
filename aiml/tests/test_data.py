"""Tests for AURA data pipeline."""
import json
import sys
from pathlib import Path

import pytest

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.data.normalize import normalize_tool, clean_text, normalize_url, normalize_tags
from src.data.dedupe import deduplicate_tools
from src.data.validate import validate_tool_schema, validate_tools
from src.data.enrich import build_semantic_document
from src.utils.config import get_config, resolve_path


class TestNormalization:
    def test_clean_text(self):
        assert clean_text("  hello   world  ") == "hello world"
        assert clean_text(None) == ""
        assert clean_text("") == ""

    def test_normalize_url(self):
        assert normalize_url("example.com") == "https://example.com"
        assert normalize_url("https://example.com") == "https://example.com"
        assert normalize_url(None) is None
        assert normalize_url("") is None

    def test_normalize_tags(self):
        assert normalize_tags(["AI", "ai", "ML"]) == ["ai", "ml"]
        assert normalize_tags(None) == []
        assert normalize_tags([]) == []

    def test_normalize_tool(self):
        tool = {
            "id": "t1",
            "name": "  Test Tool  ",
            "description": "A test tool description.",
            "category": "AI Tools",
            "tags": ["test", "Test"],
        }
        normalized = normalize_tool(tool)
        assert normalized["name"] == "Test Tool"
        assert len(normalized["tags"]) == 1


class TestDeduplication:
    def test_exact_id_dedup(self):
        tools = [
            {"id": "t1", "name": "Tool A", "url": "https://a.com"},
            {"id": "t1", "name": "Tool A", "url": "https://a.com"},
        ]
        deduped, report = deduplicate_tools(tools)
        assert len(deduped) == 1
        assert report["exact_duplicates_removed"] == 1

    def test_url_dedup(self):
        tools = [
            {"id": "t1", "name": "Tool A", "url": "https://www.example.com"},
            {"id": "t2", "name": "Tool B", "url": "https://example.com"},
        ]
        deduped, report = deduplicate_tools(tools)
        assert len(deduped) == 1
        assert report["url_duplicates_removed"] == 1

    def test_no_false_positives(self):
        tools = [
            {"id": "t1", "name": "ChatGPT", "url": "https://chat.openai.com"},
            {"id": "t2", "name": "Claude", "url": "https://claude.ai"},
        ]
        deduped, report = deduplicate_tools(tools)
        assert len(deduped) == 2


class TestValidation:
    def test_valid_tool(self):
        tool = {
            "id": "t1",
            "name": "Test Tool",
            "category": "AI Tools",
            "description": "A valid test tool with enough description length for validation.",
            "tags": ["test"],
            "keyFeatures": ["feature1"],
            "url": "https://example.com",
        }
        errors = validate_tool_schema(tool)
        assert len(errors) == 0

    def test_missing_required(self):
        tool = {"id": "t1"}
        errors = validate_tool_schema(tool)
        assert len(errors) > 0

    def test_short_description(self):
        tool = {
            "id": "t1",
            "name": "Test",
            "category": "AI",
            "description": "Short",
            "tags": ["a"],
            "keyFeatures": ["b"],
        }
        errors = validate_tool_schema(tool)
        assert any("short" in e.lower() for e in errors)


class TestEnrichment:
    def test_semantic_document(self):
        tool = {
            "name": "ChatGPT",
            "category": "AI Chatbot",
            "description": "An AI chatbot.",
            "tags": ["chatbot", "LLM"],
            "keyFeatures": ["code generation"],
            "useCases": [{"title": "Coding", "targetAudience": "Developers"}],
        }
        doc = build_semantic_document(tool)
        assert "ChatGPT" in doc
        assert "AI Chatbot" in doc
        assert "chatbot" in doc
        assert "Coding" in doc
        assert "Developers" in doc

    def test_empty_tool(self):
        doc = build_semantic_document({})
        assert doc == ""


class TestDatasetIntegrity:
    """Test the actual AURA dataset files."""

    @pytest.fixture
    def tools(self):
        path = resolve_path("data/processed/aura_tools.json")
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    @pytest.fixture
    def queries(self):
        path = resolve_path("data/processed/aura_queries.json")
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    @pytest.fixture
    def qrels(self):
        path = resolve_path("data/processed/aura_qrels.json")
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)

    def test_tool_count(self, tools):
        assert len(tools) >= 100

    def test_unique_tool_ids(self, tools):
        ids = [t["id"] for t in tools]
        assert len(ids) == len(set(ids))

    def test_all_tools_have_descriptions(self, tools):
        for t in tools:
            assert len(t.get("description", "")) >= 20, f"Tool {t['id']} has short description"

    def test_query_count(self, queries):
        assert len(queries) >= 200

    def test_unique_query_ids(self, queries):
        ids = [q["query_id"] for q in queries]
        assert len(ids) == len(set(ids))

    def test_qrel_tool_references(self, qrels, tools):
        tool_ids = {t["id"] for t in tools}
        for qrel in qrels:
            for r in qrel.get("relevance", []):
                assert r["tool_id"] in tool_ids, f"Invalid tool ref: {r['tool_id']}"

    def test_relevance_labels(self, qrels):
        for qrel in qrels:
            for r in qrel.get("relevance", []):
                assert r["label"] in [0, 1, 2, 3], f"Invalid label: {r['label']}"
