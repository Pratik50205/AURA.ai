"""Evaluation metrics for AURA retrieval and ranking."""
import numpy as np
import logging

logger = logging.getLogger(__name__)


def precision_at_k(retrieved: list[str], relevant: set[str], k: int) -> float:
    """Precision@K: fraction of top-K retrieved items that are relevant."""
    if k == 0:
        return 0.0
    top_k = retrieved[:k]
    hits = sum(1 for item in top_k if item in relevant)
    return hits / k


def recall_at_k(retrieved: list[str], relevant: set[str], k: int) -> float:
    """Recall@K: fraction of relevant items found in top-K."""
    if not relevant:
        return 0.0
    top_k = retrieved[:k]
    hits = sum(1 for item in top_k if item in relevant)
    return hits / len(relevant)


def mrr(retrieved: list[str], relevant: set[str]) -> float:
    """Mean Reciprocal Rank: 1/rank of first relevant item."""
    for i, item in enumerate(retrieved):
        if item in relevant:
            return 1.0 / (i + 1)
    return 0.0


def ndcg_at_k(retrieved: list[str], relevance_map: dict[str, int], k: int) -> float:
    """NDCG@K: Normalized Discounted Cumulative Gain.

    Args:
        retrieved: List of retrieved tool IDs in ranked order.
        relevance_map: Dict mapping tool_id -> relevance grade (0-3).
        k: Cutoff.
    """
    # DCG
    dcg = 0.0
    for i, item in enumerate(retrieved[:k]):
        rel = relevance_map.get(item, 0)
        dcg += (2 ** rel - 1) / np.log2(i + 2)

    # Ideal DCG
    ideal_rels = sorted(relevance_map.values(), reverse=True)[:k]
    idcg = 0.0
    for i, rel in enumerate(ideal_rels):
        idcg += (2 ** rel - 1) / np.log2(i + 2)

    if idcg == 0:
        return 0.0
    return dcg / idcg


def hit_rate_at_k(retrieved: list[str], relevant: set[str], k: int) -> float:
    """Hit Rate@K: 1 if any relevant item is in top-K, else 0."""
    top_k = retrieved[:k]
    return 1.0 if any(item in relevant for item in top_k) else 0.0


def evaluate_retrieval(
    all_retrieved: list[list[str]],
    all_relevant: list[set[str]],
    all_relevance_maps: list[dict[str, int]],
    k_values: list[int] | None = None,
) -> dict:
    """Evaluate retrieval across multiple queries.

    Args:
        all_retrieved: List of retrieved ID lists (one per query).
        all_relevant: List of relevant ID sets (one per query).
        all_relevance_maps: List of relevance grade dicts (one per query).
        k_values: K values for metrics.

    Returns:
        Dict of metric name -> value.
    """
    if k_values is None:
        k_values = [1, 3, 5, 10]

    n = len(all_retrieved)
    results = {}

    for k in k_values:
        p_scores = [precision_at_k(r, rel, k) for r, rel in zip(all_retrieved, all_relevant)]
        results[f"Precision@{k}"] = round(np.mean(p_scores), 4)

        r_scores = [recall_at_k(r, rel, k) for r, rel in zip(all_retrieved, all_relevant)]
        results[f"Recall@{k}"] = round(np.mean(r_scores), 4)

        ndcg_scores = [ndcg_at_k(r, rm, k) for r, rm in zip(all_retrieved, all_relevance_maps)]
        results[f"NDCG@{k}"] = round(np.mean(ndcg_scores), 4)

        hr_scores = [hit_rate_at_k(r, rel, k) for r, rel in zip(all_retrieved, all_relevant)]
        results[f"HitRate@{k}"] = round(np.mean(hr_scores), 4)

    # MRR
    mrr_scores = [mrr(r, rel) for r, rel in zip(all_retrieved, all_relevant)]
    results["MRR"] = round(np.mean(mrr_scores), 4)

    # Top-1/3/5 accuracy
    for k in [1, 3, 5]:
        acc = np.mean([hit_rate_at_k(r, rel, k) for r, rel in zip(all_retrieved, all_relevant)])
        results[f"Top-{k}_Accuracy"] = round(acc, 4)

    results["num_queries"] = n

    return results
