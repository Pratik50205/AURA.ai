"""BM25 keyword baseline for retrieval comparison."""
import json
import logging
from pathlib import Path

from rank_bm25 import BM25Okapi

from src.data.enrich import build_semantic_document
from src.utils.config import get_config, resolve_path

logger = logging.getLogger(__name__)


class BM25Retriever:
    """BM25 keyword-based retrieval baseline (Experiment 0)."""

    def __init__(self, tools: list[dict] | None = None, k1: float = 1.5, b: float = 0.75):
        config = get_config()
        self.k1 = k1 or config["bm25"]["k1"]
        self.b = b or config["bm25"]["b"]

        if tools is None:
            tools_path = resolve_path(config["data"]["tools_file"])
            with open(tools_path, "r", encoding="utf-8") as f:
                tools = json.load(f)

        self.tools = tools
        self.tool_ids = [t["id"] for t in tools]
        self.tools_map = {t["id"]: t for t in tools}

        # Tokenize tool documents
        docs = [build_semantic_document(t) for t in tools]
        tokenized = [doc.lower().split() for doc in docs]

        self.bm25 = BM25Okapi(tokenized, k1=self.k1, b=self.b)
        logger.info(f"BM25 index built with {len(tools)} tools")

    def retrieve(self, query: str, top_k: int = 20) -> list[dict]:
        """Retrieve tools using BM25 scoring."""
        tokenized_query = query.lower().split()
        scores = self.bm25.get_scores(tokenized_query)

        # Get top-K indices
        top_indices = scores.argsort()[::-1][:top_k]

        results = []
        for idx in top_indices:
            tool_id = self.tool_ids[idx]
            tool = self.tools_map[tool_id]
            results.append({
                "tool_id": tool_id,
                "name": tool.get("name", "Unknown"),
                "category": tool.get("category", ""),
                "description": tool.get("description", ""),
                "url": tool.get("url"),
                "semantic_score": round(float(scores[idx]), 4),
            })

        return results
