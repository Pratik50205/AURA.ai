"""Feature engineering for the MLP ranking model."""
import numpy as np
from typing import Any


def compute_category_match(query_categories: list[str], tool_category: str) -> float:
    """Binary feature: does the tool category match any inferred query category?"""
    if not query_categories:
        return 0.0
    return 1.0 if tool_category.lower() in [c.lower() for c in query_categories] else 0.0


def compute_tag_overlap(query_tokens: set[str], tool_tags: list[str]) -> float:
    """Fraction of tool tags that overlap with query tokens."""
    if not tool_tags:
        return 0.0
    tag_tokens = {tag.lower() for tag in tool_tags}
    overlap = len(query_tokens & tag_tokens)
    return overlap / len(tag_tokens)


def compute_feature_overlap(query_tokens: set[str], features: list[str]) -> float:
    """Fraction of key features matching query tokens."""
    if not features:
        return 0.0
    feat_tokens = set()
    for f in features:
        feat_tokens.update(f.lower().split())
    overlap = len(query_tokens & feat_tokens)
    return overlap / max(len(feat_tokens), 1)


def compute_usecase_overlap(query_tokens: set[str], use_cases: list[dict]) -> float:
    """Fraction of use case words matching query tokens."""
    if not use_cases:
        return 0.0
    uc_tokens = set()
    for uc in use_cases:
        uc_tokens.update(uc.get("title", "").lower().split())
        uc_tokens.update(uc.get("description", "").lower().split())
    overlap = len(query_tokens & uc_tokens)
    return overlap / max(len(uc_tokens), 1)


def extract_features(
    query: str,
    tool: dict,
    semantic_score: float,
    reranker_score: float | None = None,
) -> np.ndarray:
    """Extract feature vector for a query-tool pair.

    Features:
    - semantic_score (cosine similarity from embeddings)
    - reranker_score (cross-encoder score, if available)
    - tag_overlap
    - feature_overlap
    - usecase_overlap
    - description_length (normalized)
    - has_pricing (binary)
    - num_use_cases
    - num_features
    - num_alternatives
    """
    query_tokens = set(query.lower().split())

    features = [
        semantic_score,
        reranker_score if reranker_score is not None else 0.0,
        compute_tag_overlap(query_tokens, tool.get("tags", [])),
        compute_feature_overlap(query_tokens, tool.get("keyFeatures", [])),
        compute_usecase_overlap(query_tokens, tool.get("useCases", [])),
        min(len(tool.get("description", "")) / 500.0, 1.0),  # normalized desc length
        1.0 if tool.get("pricing") else 0.0,
        min(len(tool.get("useCases", [])) / 5.0, 1.0),  # normalized use case count
        min(len(tool.get("keyFeatures", [])) / 10.0, 1.0),  # normalized feature count
        min(len(tool.get("alternatives", [])) / 5.0, 1.0),  # normalized alternatives
    ]

    return np.array(features, dtype=np.float32)


FEATURE_NAMES = [
    "semantic_score",
    "reranker_score",
    "tag_overlap",
    "feature_overlap",
    "usecase_overlap",
    "description_length",
    "has_pricing",
    "num_use_cases",
    "num_features",
    "num_alternatives",
]

NUM_FEATURES = len(FEATURE_NAMES)
