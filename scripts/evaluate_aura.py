"""AURA.ai Chatbot Intelligence Evaluation & Benchmark Runner.

Executes scientific evaluation across 105 curated test cases:
- Part 1: Domain Intent Classification Accuracy & Domain Boundary Gating (Categories A-G)
- Part 2: Multi-Turn Context Retention & Reference Resolution (Category F)
- Part 3: Hybrid Retrieval & Neural Ranking Accuracy (P@1, P@3, P@5, R@5, MRR, NDCG@5) (Category A)
- Part 4: Constraint Satisfaction & Latency Profiling
"""
import sys
import time
import json
from pathlib import Path
from typing import Any, Dict, List

# Ensure intelligence directory is on path
_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_ROOT / "intelligence"))

from src.inference.classifier import classify_aura_intent
from src.inference.recommend import recommend_tools
from src.evaluation.metrics import precision_at_k, recall_at_k, mrr, ndcg_at_k


def run_evaluation() -> Dict[str, Any]:
    dataset_path = _ROOT / "intelligence" / "data" / "benchmark" / "aura_chatbot_eval.json"
    with open(dataset_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    test_cases = data["test_cases"]
    print("\n" + "=" * 70)
    print(f"  AURA.ai Copilot Scientific Evaluation Suite ({len(test_cases)} Test Cases)")
    print("=" * 70)

    # -------------------------------------------------------------
    # 1. Intent Classification & Boundary Gating Evaluation
    # -------------------------------------------------------------
    total_tests = len(test_cases)
    intent_correct = 0
    in_scope_correct = 0

    category_stats = {
        "A": {"name": "Tool Discovery", "total": 0, "correct": 0},
        "B": {"name": "Tool Comparison", "total": 0, "correct": 0},
        "C": {"name": "Workflow Design", "total": 0, "correct": 0},
        "D": {"name": "Prompt Engineering", "total": 0, "correct": 0},
        "E": {"name": "Alternatives & Evaluation", "total": 0, "correct": 0},
        "F": {"name": "Multi-Turn Context", "total": 0, "correct": 0},
        "G": {"name": "Out-of-Scope Gating", "total": 0, "correct": 0},
    }

    tp_in_scope = 0
    fp_in_scope = 0
    fn_in_scope = 0
    tn_in_scope = 0

    failed_cases = []

    for tc in test_cases:
        cat = tc["category"]
        category_stats[cat]["total"] += 1

        context = tc.get("context")
        pred = classify_aura_intent(tc["query"], context=context)

        # Check intent match
        is_intent_match = pred["intent"] == tc["expected_intent"]
        if is_intent_match:
            intent_correct += 1
            category_stats[cat]["correct"] += 1
        else:
            failed_cases.append({
                "id": tc["id"],
                "query": tc["query"],
                "expected": tc["expected_intent"],
                "predicted": pred["intent"],
                "reasoning": pred.get("reasoning"),
            })

        # Check inScope gating
        expected_in_scope = tc["expected_in_scope"]
        pred_in_scope = pred["inScope"]

        if expected_in_scope and pred_in_scope:
            tp_in_scope += 1
        elif not expected_in_scope and pred_in_scope:
            fp_in_scope += 1  # False Acceptance of out-of-scope query
        elif expected_in_scope and not pred_in_scope:
            fn_in_scope += 1  # False Rejection of valid in-scope query
        else:
            tn_in_scope += 1  # True Rejection of out-of-scope query

    classification_acc = intent_correct / total_tests
    in_scope_precision = tp_in_scope / (tp_in_scope + fp_in_scope) if (tp_in_scope + fp_in_scope) > 0 else 0
    in_scope_recall = tp_in_scope / (tp_in_scope + fn_in_scope) if (tp_in_scope + fn_in_scope) > 0 else 0
    in_scope_f1 = (
        2 * in_scope_precision * in_scope_recall / (in_scope_precision + in_scope_recall)
        if (in_scope_precision + in_scope_recall) > 0
        else 0
    )
    oos_rejection_acc = tn_in_scope / (tn_in_scope + fp_in_scope) if (tn_in_scope + fp_in_scope) > 0 else 0

    print(f"\n[Part 1: Classification & Domain Boundary Results]")
    print(f"• Total Test Cases: {total_tests}")
    print(f"• Overall Intent Accuracy: {classification_acc * 100:.2f}% ({intent_correct}/{total_tests})")
    print(f"• In-Scope Precision: {in_scope_precision * 100:.2f}%")
    print(f"• In-Scope Recall: {in_scope_recall * 100:.2f}%")
    print(f"• In-Scope F1-Score: {in_scope_f1 * 100:.2f}%")
    print(f"• Out-of-Scope Rejection Accuracy: {oos_rejection_acc * 100:.2f}% ({tn_in_scope}/{tn_in_scope + fp_in_scope})")
    print(f"• False Acceptance of Out-of-Scope Queries: {fp_in_scope}")

    print("\n[Accuracy by Category Breakdown]")
    for cat_key, cdata in category_stats.items():
        cat_acc = cdata["correct"] / cdata["total"] * 100 if cdata["total"] > 0 else 0
        print(f"  [{cat_key}] {cdata['name']}: {cat_acc:.1f}% ({cdata['correct']}/{cdata['total']})")

    # -------------------------------------------------------------
    # 2. Retrieval & Neural Ranking Benchmark (Category A)
    # -------------------------------------------------------------
    print("\n" + "-" * 70)
    print("  Evaluating Stage 1 & Stage 2 Retrieval Precision (Category A Discovery)")
    print("-" * 70)

    discovery_cases = [tc for tc in test_cases if tc["category"] == "A" and tc.get("ground_truth_tools")]
    p1_scores, p3_scores, p5_scores = [], [], []
    r5_scores = []
    mrr_scores = []
    ndcg5_scores = []
    latencies = []

    for tc in discovery_cases:
        query = tc["query"]
        ground_truth = set(tc["ground_truth_tools"])
        relevance_map = {tool_name: 3 for tool_name in ground_truth}

        start = time.time()
        rec_res = recommend_tools(query, top_k=5, use_reranker=True)
        lat = (time.time() - start) * 1000
        latencies.append(lat)

        retrieved_names = [r["name"] for r in rec_res["results"]]

        p1_scores.append(precision_at_k(retrieved_names, ground_truth, k=1))
        p3_scores.append(precision_at_k(retrieved_names, ground_truth, k=3))
        p5_scores.append(precision_at_k(retrieved_names, ground_truth, k=5))
        r5_scores.append(recall_at_k(retrieved_names, ground_truth, k=5))
        mrr_scores.append(mrr(retrieved_names, ground_truth))
        ndcg5_scores.append(ndcg_at_k(retrieved_names, relevance_map, k=5))

    avg_p1 = sum(p1_scores) / len(p1_scores) if p1_scores else 0
    avg_p3 = sum(p3_scores) / len(p3_scores) if p3_scores else 0
    avg_p5 = sum(p5_scores) / len(p5_scores) if p5_scores else 0
    avg_r5 = sum(r5_scores) / len(r5_scores) if r5_scores else 0
    avg_mrr = sum(mrr_scores) / len(mrr_scores) if mrr_scores else 0
    avg_ndcg5 = sum(ndcg5_scores) / len(ndcg5_scores) if ndcg5_scores else 0
    avg_lat = sum(latencies) / len(latencies) if latencies else 0

    print(f"\n[Part 2: Retrieval & Ranking Performance Metrics]")
    print(f"• Precision@1: {avg_p1:.4f}")
    print(f"• Precision@3: {avg_p3:.4f}")
    print(f"• Precision@5: {avg_p5:.4f}")
    print(f"• Recall@5:    {avg_r5:.4f}")
    print(f"• MRR:         {avg_mrr:.4f}")
    print(f"• NDCG@5:      {avg_ndcg5:.4f}")
    print(f"• Mean Retrieval Latency: {avg_lat:.2f} ms")

    if failed_cases:
        print(f"\n[Classification Discrepancies ({len(failed_cases)})]")
        for fc in failed_cases[:5]:
            print(f"  • {fc['id']}: \"{fc['query']}\" | Expected: {fc['expected']} | Predicted: {fc['predicted']}")

    print("\n" + "=" * 70)
    print("  Evaluation Completed Successfully.")
    print("=" * 70 + "\n")

    return {
        "total_test_cases": total_tests,
        "classification_accuracy": classification_acc,
        "in_scope_precision": in_scope_precision,
        "in_scope_recall": in_scope_recall,
        "in_scope_f1": in_scope_f1,
        "oos_rejection_accuracy": oos_rejection_acc,
        "precision_at_1": avg_p1,
        "precision_at_3": avg_p3,
        "precision_at_5": avg_p5,
        "recall_at_5": avg_r5,
        "mrr": avg_mrr,
        "ndcg_at_5": avg_ndcg5,
        "mean_latency_ms": avg_lat,
        "category_stats": category_stats,
        "failed_cases": failed_cases,
    }


if __name__ == "__main__":
    run_evaluation()

