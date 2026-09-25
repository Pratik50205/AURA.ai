"""Tests for evaluation metrics."""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.evaluation.metrics import (
    precision_at_k,
    recall_at_k,
    mrr,
    ndcg_at_k,
    hit_rate_at_k,
    evaluate_retrieval,
)


class TestPrecision:
    def test_perfect(self):
        assert precision_at_k(["a", "b", "c"], {"a", "b", "c"}, 3) == 1.0

    def test_none(self):
        assert precision_at_k(["x", "y", "z"], {"a", "b"}, 3) == 0.0

    def test_partial(self):
        assert precision_at_k(["a", "x", "b"], {"a", "b"}, 3) == pytest.approx(2 / 3)

    def test_k1(self):
        assert precision_at_k(["a", "x"], {"a"}, 1) == 1.0
        assert precision_at_k(["x", "a"], {"a"}, 1) == 0.0


class TestRecall:
    def test_perfect(self):
        assert recall_at_k(["a", "b"], {"a", "b"}, 2) == 1.0

    def test_partial(self):
        assert recall_at_k(["a", "x"], {"a", "b"}, 2) == 0.5

    def test_empty_relevant(self):
        assert recall_at_k(["a"], set(), 1) == 0.0


class TestMRR:
    def test_first(self):
        assert mrr(["a", "b", "c"], {"a"}) == 1.0

    def test_second(self):
        assert mrr(["x", "a", "c"], {"a"}) == 0.5

    def test_none(self):
        assert mrr(["x", "y", "z"], {"a"}) == 0.0


class TestNDCG:
    def test_perfect_order(self):
        rel_map = {"a": 3, "b": 2, "c": 1}
        assert ndcg_at_k(["a", "b", "c"], rel_map, 3) == pytest.approx(1.0)

    def test_empty(self):
        assert ndcg_at_k([], {}, 3) == 0.0


class TestHitRate:
    def test_hit(self):
        assert hit_rate_at_k(["a", "b"], {"b"}, 2) == 1.0

    def test_miss(self):
        assert hit_rate_at_k(["x", "y"], {"a"}, 2) == 0.0


class TestEvaluateRetrieval:
    def test_basic(self):
        retrieved = [["a", "b", "c"]]
        relevant = [{"a", "b"}]
        rel_maps = [{"a": 3, "b": 2, "c": 0}]

        results = evaluate_retrieval(retrieved, relevant, rel_maps, k_values=[1, 3])
        assert results["MRR"] == 1.0
        assert results["Precision@1"] == 1.0
        assert results["num_queries"] == 1
