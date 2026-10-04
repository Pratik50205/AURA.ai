"""Cross-encoder reranking for AURA (CPU-optimized)."""
import logging
from typing import Any

from sentence_transformers import CrossEncoder

from src.utils.config import get_config

logger = logging.getLogger(__name__)


class AuraReranker:
    """Cross-encoder reranker for second-stage ranking."""

    def __init__(self, model_name: str | None = None, device: str = "cpu"):
        config = get_config()
        self.model_name = model_name or config["ranking"]["reranker"]["model"]
        self.device = device or config["ranking"]["reranker"]["device"]
        self.batch_size = config["ranking"]["reranker"]["batch_size"]

        logger.info(f"Loading reranker: {self.model_name} on {self.device}")
        try:
            self.model = CrossEncoder(self.model_name, device=self.device, local_files_only=True)
        except Exception:
            self.model = CrossEncoder(self.model_name, device=self.device)

    def rerank(
        self,
        query: str,
        candidates: list[dict],
        top_k: int | None = None,
    ) -> list[dict]:
        """Rerank candidates using cross-encoder.

        Args:
            query: User query.
            candidates: List of candidate dicts (must have 'description' or 'name').
            top_k: Return only top K after reranking. None = return all.

        Returns:
            Reranked candidates with reranker_score added.
        """
        if not candidates:
            return []

        # Build (query, candidate_text) pairs
        pairs = []
        for c in candidates:
            doc = c.get("description") or c.get("name", "")
            pairs.append([query, doc])

        # Score with cross-encoder
        scores = self.model.predict(
            pairs,
            batch_size=self.batch_size,
            show_progress_bar=False,
        )

        # Add scores to candidates
        for i, c in enumerate(candidates):
            c["reranker_score"] = round(float(scores[i]), 4)

        # Sort by reranker score descending
        reranked = sorted(candidates, key=lambda x: x["reranker_score"], reverse=True)

        if top_k:
            reranked = reranked[:top_k]

        return reranked
