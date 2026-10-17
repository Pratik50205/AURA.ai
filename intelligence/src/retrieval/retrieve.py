"""Hybrid semantic & lexical retrieval pipeline: FAISS (Dense) + BM25 (Sparse) with Reciprocal Rank Fusion (RRF)."""
import json
import logging
from pathlib import Path
from typing import Any

import numpy as np

from src.retrieval.embed import AuraEmbedder
from src.retrieval.index import AuraIndex
from src.retrieval.bm25_baseline import BM25Retriever
from src.utils.config import get_config, resolve_path

logger = logging.getLogger(__name__)


class AuraRetriever:
    """Hybrid Semantic & Lexical Retrieval Pipeline.
    
    Combines dense neural embeddings (FAISS) with sparse lexical keyword matching (BM25)
    using Reciprocal Rank Fusion (RRF) for optimal conceptual and exact-keyword precision.
    """

    def __init__(
        self,
        embedder: AuraEmbedder | None = None,
        index: AuraIndex | None = None,
        tools_map: dict[str, dict] | None = None,
        enable_bm25: bool = True,
    ):
        config = get_config()

        # Load or use provided dense embedder
        self.embedder = embedder or AuraEmbedder()

        # Load or use provided FAISS index
        if index:
            self.index = index
        else:
            index_dir = resolve_path(config["faiss"]["index_dir"])
            self.index = AuraIndex.load(index_dir)

        # Load tool metadata
        if tools_map:
            self.tools_map = tools_map
        else:
            tools_path = resolve_path(config["data"]["tools_file"])
            with open(tools_path, "r", encoding="utf-8") as f:
                tools = json.load(f)
            self.tools_map = {t["id"]: t for t in tools}

        # Sparse BM25 retriever for hybrid retrieval
        self.enable_bm25 = enable_bm25
        self.bm25_retriever: BM25Retriever | None = None
        if self.enable_bm25:
            try:
                tools_list = list(self.tools_map.values())
                self.bm25_retriever = BM25Retriever(tools=tools_list)
                logger.info("Hybrid BM25 sparse index initialized successfully.")
            except Exception as e:
                logger.warning(f"BM25 initialization skipped: {e}. Falling back to pure dense.")
                self.bm25_retriever = None

    def retrieve_dense(self, query: str, top_k: int = 30) -> list[dict]:
        """Dense semantic retrieval via FAISS inner product / cosine similarity."""
        query_emb = self.embedder.encode([query])
        results = self.index.search(query_emb[0], top_k=top_k)

        candidates = []
        for tool_id, score in results:
            tool = self.tools_map.get(tool_id, {})
            candidate = dict(tool)
            candidate["tool_id"] = tool_id
            candidate["semantic_score"] = round(float(score), 4)
            candidates.append(candidate)
        return candidates

    def retrieve_bm25(self, query: str, top_k: int = 30) -> list[dict]:
        """Sparse lexical retrieval via BM25."""
        if not self.bm25_retriever:
            return []
        return self.bm25_retriever.retrieve(query, top_k=top_k)

    def retrieve(
        self,
        query: str,
        top_k: int = 25,
        dense_weight: float = 0.6,
        bm25_weight: float = 0.4,
        rrf_k: int = 60,
    ) -> list[dict]:
        """Hybrid retrieval combining Dense FAISS and Sparse BM25 using Reciprocal Rank Fusion (RRF).

        Formula:
            RRF_score(d) = dense_weight / (rrf_k + rank_dense(d)) + bm25_weight / (rrf_k + rank_sparse(d))

        Args:
            query: Natural language search query.
            top_k: Number of candidates to return.
            dense_weight: Weight assigned to dense vector rank (default: 0.6).
            bm25_weight: Weight assigned to BM25 keyword rank (default: 0.4).
            rrf_k: Smoothing constant for reciprocal rank fusion (default: 60).

        Returns:
            List of candidate tools with semantic_score, bm25_score, and rrf_score.
        """
        fetch_k = max(top_k, 30)
        dense_candidates = self.retrieve_dense(query, top_k=fetch_k)

        # If BM25 is disabled or unavailable, return pure dense candidates
        if not self.bm25_retriever:
            return dense_candidates[:top_k]

        bm25_candidates = self.retrieve_bm25(query, top_k=fetch_k)

        rrf_scores: dict[str, float] = {}
        dense_scores: dict[str, float] = {}
        bm25_scores: dict[str, float] = {}
        candidate_pool: dict[str, dict] = {}

        # 1. Process dense candidates
        for rank, c in enumerate(dense_candidates, start=1):
            tid = c["tool_id"]
            dense_scores[tid] = c.get("semantic_score", 0.0)
            candidate_pool[tid] = c
            rrf_scores[tid] = rrf_scores.get(tid, 0.0) + (dense_weight / (rrf_k + rank))

        # 2. Process sparse BM25 candidates
        for rank, c in enumerate(bm25_candidates, start=1):
            tid = c["tool_id"]
            bm25_scores[tid] = c.get("semantic_score", 0.0)  # BM25 baseline stores BM25 raw score here
            if tid not in candidate_pool:
                tool = self.tools_map.get(tid, {})
                full_c = dict(tool)
                full_c["tool_id"] = tid
                full_c["semantic_score"] = 0.0
                candidate_pool[tid] = full_c
            rrf_scores[tid] = rrf_scores.get(tid, 0.0) + (bm25_weight / (rrf_k + rank))

        # 3. Sort by reciprocal rank fusion score descending
        sorted_tool_ids = sorted(rrf_scores.keys(), key=lambda tid: rrf_scores[tid], reverse=True)

        merged_results = []
        for tid in sorted_tool_ids[:top_k]:
            c = candidate_pool[tid]
            c["rrf_score"] = round(rrf_scores[tid], 5)
            c["bm25_score"] = round(bm25_scores.get(tid, 0.0), 4)

            # If tool was retrieved only by BM25, assign calibrated dense baseline
            if "semantic_score" not in c or c["semantic_score"] == 0.0:
                c["semantic_score"] = round(dense_scores.get(tid, 0.30), 4)
            else:
                c["semantic_score"] = round(dense_scores.get(tid, c["semantic_score"]), 4)

            merged_results.append(c)

        return merged_results

    def batch_retrieve(
        self, queries: list[str], top_k: int = 20
    ) -> list[list[dict]]:
        """Retrieve candidates for multiple queries using hybrid retrieval."""
        all_results = []
        for q in queries:
            results = self.retrieve(q, top_k=top_k)
            all_results.append(results)
        return all_results
