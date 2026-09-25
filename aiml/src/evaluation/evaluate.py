"""Full evaluation pipeline for AURA experiments."""
import json
import time
import logging
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from src.evaluation.metrics import evaluate_retrieval
from src.utils.config import get_config, resolve_path

logger = logging.getLogger(__name__)


def prepare_eval_data(qrels: list[dict]) -> tuple[list[str], list[set[str]], list[dict[str, int]]]:
    """Prepare evaluation data from qrels.

    Returns:
        Tuple of (queries, relevant_sets, relevance_maps)
    """
    # We need to load queries to get the text
    config = get_config()
    queries_path = resolve_path(config["data"]["queries_file"])
    with open(queries_path, "r", encoding="utf-8") as f:
        all_queries = {q["query_id"]: q["query"] for q in json.load(f)}

    query_texts = []
    relevant_sets = []
    relevance_maps = []

    for qrel in qrels:
        qid = qrel["query_id"]
        if qid not in all_queries:
            continue

        query_texts.append(all_queries[qid])

        # Relevant tools (label >= 2)
        relevant = set()
        rel_map = {}
        for r in qrel.get("relevance", []):
            rel_map[r["tool_id"]] = r["label"]
            if r["label"] >= 2:
                relevant.add(r["tool_id"])

        relevant_sets.append(relevant)
        relevance_maps.append(rel_map)

    return query_texts, relevant_sets, relevance_maps


def evaluate_bm25(qrels: list[dict]) -> dict:
    """Evaluate BM25 baseline (Experiment 0)."""
    from src.retrieval.bm25_baseline import BM25Retriever

    logger.info("=== Experiment 0: BM25 Baseline ===")
    retriever = BM25Retriever()

    query_texts, relevant_sets, relevance_maps = prepare_eval_data(qrels)

    start = time.time()
    all_retrieved = []
    for query in query_texts:
        results = retriever.retrieve(query, top_k=20)
        all_retrieved.append([r["tool_id"] for r in results])
    latency = (time.time() - start) / len(query_texts) * 1000  # ms per query

    metrics = evaluate_retrieval(all_retrieved, relevant_sets, relevance_maps)
    metrics["avg_latency_ms"] = round(latency, 2)
    metrics["experiment"] = "BM25 Baseline"

    return metrics


def evaluate_semantic(qrels: list[dict]) -> dict:
    """Evaluate semantic retrieval (Experiment 1)."""
    from src.retrieval.retrieve import AuraRetriever

    logger.info("=== Experiment 1: Semantic Retrieval ===")
    retriever = AuraRetriever()

    query_texts, relevant_sets, relevance_maps = prepare_eval_data(qrels)

    start = time.time()
    all_retrieved = []
    for query in query_texts:
        results = retriever.retrieve(query, top_k=20)
        all_retrieved.append([r["tool_id"] for r in results])
    latency = (time.time() - start) / len(query_texts) * 1000

    metrics = evaluate_retrieval(all_retrieved, relevant_sets, relevance_maps)
    metrics["avg_latency_ms"] = round(latency, 2)
    metrics["experiment"] = "Semantic Retrieval (Embedding + FAISS)"

    return metrics


def evaluate_reranker(qrels: list[dict]) -> dict:
    """Evaluate semantic + cross-encoder reranking (Experiment 4)."""
    from src.retrieval.retrieve import AuraRetriever
    from src.ranking.rerank import AuraReranker

    logger.info("=== Experiment 4: Semantic + Cross-Encoder ===")
    retriever = AuraRetriever()
    reranker = AuraReranker()

    query_texts, relevant_sets, relevance_maps = prepare_eval_data(qrels)

    start = time.time()
    all_retrieved = []
    for query in query_texts:
        candidates = retriever.retrieve(query, top_k=20)
        reranked = reranker.rerank(query, candidates, top_k=20)
        all_retrieved.append([r["tool_id"] for r in reranked])
    latency = (time.time() - start) / len(query_texts) * 1000

    metrics = evaluate_retrieval(all_retrieved, relevant_sets, relevance_maps)
    metrics["avg_latency_ms"] = round(latency, 2)
    metrics["experiment"] = "Semantic + Cross-Encoder Reranking"

    return metrics


def run_all_experiments(
    test_qrels_path: str | Path | None = None,
    output_path: str | Path | None = None,
) -> list[dict]:
    """Run all experiments and generate comparison report."""
    config = get_config()

    if test_qrels_path is None:
        test_qrels_path = resolve_path("data/test/qrels.json")

    with open(test_qrels_path, "r", encoding="utf-8") as f:
        qrels = json.load(f)

    logger.info(f"Running evaluation on {len(qrels)} test queries")

    results = []

    # Experiment 0: BM25
    try:
        results.append(evaluate_bm25(qrels))
    except Exception as e:
        logger.error(f"BM25 evaluation failed: {e}")

    # Experiment 1: Semantic
    try:
        results.append(evaluate_semantic(qrels))
    except Exception as e:
        logger.error(f"Semantic evaluation failed: {e}")

    # Experiment 4: Semantic + Cross-Encoder
    try:
        results.append(evaluate_reranker(qrels))
    except Exception as e:
        logger.warning(f"Cross-encoder evaluation skipped: {e}")

    # Save report
    if output_path is None:
        output_path = resolve_path("reports/experiment_results.json")

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    # Print comparison table
    print("\n" + "=" * 80)
    print("AURA Experiment Comparison Report")
    print("=" * 80)
    header = f"{'Experiment':<40} {'P@1':>6} {'P@5':>6} {'R@5':>6} {'MRR':>6} {'NDCG@5':>7} {'ms':>6}"
    print(header)
    print("-" * 80)
    for r in results:
        row = (
            f"{r['experiment']:<40} "
            f"{r.get('Precision@1', 0):>6.3f} "
            f"{r.get('Precision@5', 0):>6.3f} "
            f"{r.get('Recall@5', 0):>6.3f} "
            f"{r.get('MRR', 0):>6.3f} "
            f"{r.get('NDCG@5', 0):>7.3f} "
            f"{r.get('avg_latency_ms', 0):>6.1f}"
        )
        print(row)
    print("=" * 80)

    return results


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_all_experiments()
