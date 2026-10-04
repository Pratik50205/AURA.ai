"""Semantic retrieval: query → embedding → FAISS → Top-N candidates."""
import json
import logging
from pathlib import Path
from typing import Any

import numpy as np

from src.retrieval.embed import AuraEmbedder
from src.retrieval.index import AuraIndex
from src.utils.config import get_config, resolve_path

logger = logging.getLogger(__name__)


class AuraRetriever:
    """Semantic retrieval pipeline."""

    def __init__(
        self,
        embedder: AuraEmbedder | None = None,
        index: AuraIndex | None = None,
        tools_map: dict[str, dict] | None = None,
    ):
        config = get_config()

        # Load or use provided embedder
        self.embedder = embedder or AuraEmbedder()

        # Load or use provided index
        if index:
            self.index = index
        else:
            index_dir = resolve_path(config["faiss"]["index_dir"])
            self.index = AuraIndex.load(index_dir)

        # Load tool metadata for enriching results
        if tools_map:
            self.tools_map = tools_map
        else:
            tools_path = resolve_path(config["data"]["tools_file"])
            with open(tools_path, "r", encoding="utf-8") as f:
                tools = json.load(f)
            self.tools_map = {t["id"]: t for t in tools}

    def retrieve(self, query: str, top_k: int = 20) -> list[dict]:
        """Retrieve top-K candidate tools for a query.

        Args:
            query: Natural language query.
            top_k: Number of candidates to retrieve.

        Returns:
            List of candidate dicts with tool metadata and scores.
        """
        # Embed query
        query_emb = self.embedder.encode([query])

        # Search FAISS
        results = self.index.search(query_emb[0], top_k=top_k)

        # Enrich with tool metadata
        candidates = []
        for tool_id, score in results:
            tool = self.tools_map.get(tool_id, {})
            candidate = dict(tool)
            candidate["tool_id"] = tool_id
            candidate["semantic_score"] = round(score, 4)
            candidates.append(candidate)

        return candidates

    def batch_retrieve(
        self, queries: list[str], top_k: int = 20
    ) -> list[list[dict]]:
        """Retrieve candidates for multiple queries."""
        all_embs = self.embedder.encode(queries)

        all_results = []
        for emb in all_embs:
            results = self.index.search(emb, top_k=top_k)
            candidates = []
            for tool_id, score in results:
                tool = self.tools_map.get(tool_id, {})
                candidates.append({
                    "tool_id": tool_id,
                    "name": tool.get("name", "Unknown"),
                    "semantic_score": round(score, 4),
                })
            all_results.append(candidates)

        return all_results
