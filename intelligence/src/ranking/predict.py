"""Ranking prediction at inference time."""
import numpy as np
import torch
import logging

from src.ranking.features import extract_features
from src.ranking.train import MLPRanker, load_ranker

logger = logging.getLogger(__name__)


def predict_ranking(
    model: MLPRanker,
    query: str,
    candidates: list[dict],
) -> list[dict]:
    """Score and rank candidates using the MLP ranker.

    Args:
        model: Trained MLP ranker.
        query: User query string.
        candidates: List of candidate tool dicts with semantic_score.

    Returns:
        Candidates sorted by ranking_score with scores added.
    """
    if not candidates:
        return []

    # Extract features for each candidate
    features_list = []
    for c in candidates:
        feat = extract_features(
            query=query,
            tool=c,
            semantic_score=c.get("semantic_score", 0.0),
            reranker_score=c.get("reranker_score"),
        )
        features_list.append(feat)

    features = np.array(features_list, dtype=np.float32)

    # Predict
    model.eval()
    with torch.no_grad():
        X = torch.tensor(features, dtype=torch.float32)
        scores = model(X).numpy()

    # Add ranking scores
    for i, c in enumerate(candidates):
        score_val = round(float(scores[i]), 4)
        c["neural_score"] = score_val
        c["ranking_score"] = score_val

    # Sort by ranking score descending
    ranked = sorted(candidates, key=lambda x: x["ranking_score"], reverse=True)
    return ranked
