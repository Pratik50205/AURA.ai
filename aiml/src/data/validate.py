"""Data validation for AURA datasets."""
import json
import logging
from pathlib import Path
from collections import Counter
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


def validate_tool_schema(tool: dict) -> list[str]:
    """Validate a single tool record against the canonical schema."""
    errors = []
    required = ["id", "name", "category", "description", "tags", "keyFeatures"]

    for field in required:
        val = tool.get(field)
        if val is None or (isinstance(val, str) and not val.strip()):
            errors.append(f"Missing required field: {field}")

    # Check description quality
    desc = tool.get("description", "")
    if isinstance(desc, str) and len(desc) < 20:
        errors.append(f"Description too short ({len(desc)} chars)")

    # Validate URL if present
    url = tool.get("url")
    if url:
        try:
            parsed = urlparse(url)
            if not parsed.netloc:
                errors.append(f"Invalid URL: {url}")
        except Exception:
            errors.append(f"Malformed URL: {url}")

    return errors


def validate_tools(tools: list[dict]) -> dict:
    """Validate all tool records. Returns validation report."""
    total = len(tools)
    ids = [t.get("id") for t in tools]
    duplicate_ids = [id_ for id_, count in Counter(ids).items() if count > 1]

    categories = Counter(t.get("category", "Unknown") for t in tools)

    errors_by_tool = {}
    total_errors = 0
    for tool in tools:
        errs = validate_tool_schema(tool)
        if errs:
            errors_by_tool[tool.get("id", "?")] = errs
            total_errors += len(errs)

    # Check for missing URLs
    missing_urls = sum(1 for t in tools if not t.get("url"))

    # Check for empty descriptions
    short_descriptions = sum(
        1 for t in tools if len(t.get("description", "")) < 50
    )

    report = {
        "total_tools": total,
        "duplicate_ids": duplicate_ids,
        "tools_with_errors": len(errors_by_tool),
        "total_errors": total_errors,
        "missing_urls": missing_urls,
        "short_descriptions": short_descriptions,
        "category_distribution": dict(categories.most_common()),
        "errors_detail": errors_by_tool,
    }

    logger.info(f"Validation: {total} tools, {len(errors_by_tool)} with errors")
    return report


def validate_queries(queries: list[dict]) -> dict:
    """Validate query dataset."""
    total = len(queries)
    ids = [q.get("query_id") for q in queries]
    duplicate_ids = [id_ for id_, count in Counter(ids).items() if count > 1]

    short_queries = sum(1 for q in queries if len(q.get("query", "")) < 10)
    missing_intent = sum(1 for q in queries if not q.get("intent"))

    intent_dist = Counter(q.get("intent", "unknown") for q in queries)

    return {
        "total_queries": total,
        "duplicate_ids": duplicate_ids,
        "short_queries": short_queries,
        "missing_intent": missing_intent,
        "intent_distribution": dict(intent_dist.most_common(20)),
    }


def validate_qrels(qrels: list[dict], tool_ids: set[str], query_ids: set[str]) -> dict:
    """Validate query-relevance pairs."""
    total = len(qrels)
    total_pairs = sum(len(q.get("relevance", [])) for q in qrels)

    # Check for references to non-existent tools/queries
    invalid_tools = set()
    invalid_queries = set()
    label_dist = Counter()

    for qrel in qrels:
        qid = qrel.get("query_id", "")
        if qid not in query_ids:
            invalid_queries.add(qid)

        for rel in qrel.get("relevance", []):
            tid = rel.get("tool_id", "")
            if tid not in tool_ids:
                invalid_tools.add(tid)
            label_dist[rel.get("label", -1)] += 1

    return {
        "total_qrel_records": total,
        "total_pairs": total_pairs,
        "invalid_tool_references": list(invalid_tools),
        "invalid_query_references": list(invalid_queries),
        "label_distribution": dict(label_dist),
    }


def check_leakage(
    train_queries: list[dict],
    val_queries: list[dict],
    test_queries: list[dict],
) -> dict:
    """Check for train/validation/test leakage."""
    train_ids = {q.get("query_id") for q in train_queries}
    val_ids = {q.get("query_id") for q in val_queries}
    test_ids = {q.get("query_id") for q in test_queries}

    train_val = train_ids & val_ids
    train_test = train_ids & test_ids
    val_test = val_ids & test_ids

    return {
        "train_val_leakage": list(train_val),
        "train_test_leakage": list(train_test),
        "val_test_leakage": list(val_test),
        "total_leakage": len(train_val) + len(train_test) + len(val_test),
    }


def generate_quality_report(
    tools: list[dict],
    queries: list[dict],
    qrels: list[dict],
    output_path: str | Path | None = None,
) -> dict:
    """Generate comprehensive data quality report."""
    tool_ids = {t["id"] for t in tools}
    query_ids = {q["query_id"] for q in queries}

    report = {
        "tools": validate_tools(tools),
        "queries": validate_queries(queries),
        "qrels": validate_qrels(qrels, tool_ids, query_ids),
    }

    if output_path:
        path = Path(output_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        logger.info(f"Quality report saved to {path}")

    return report


if __name__ == "__main__":
    import sys
    sys.path.insert(0, str(Path(__file__).parent.parent.parent))
    from src.utils.config import get_config, resolve_path

    logging.basicConfig(level=logging.INFO)
    config = get_config()

    tools = json.loads(resolve_path(config["data"]["tools_file"]).read_text(encoding="utf-8"))
    queries = json.loads(resolve_path(config["data"]["queries_file"]).read_text(encoding="utf-8"))
    qrels = json.loads(resolve_path(config["data"]["qrels_file"]).read_text(encoding="utf-8"))

    report = generate_quality_report(
        tools, queries, qrels,
        output_path=resolve_path("reports/data_quality_report.json"),
    )

    print("\n=== AURA Data Quality Report ===")
    print(f"Tools: {report['tools']['total_tools']}")
    print(f"  Errors: {report['tools']['tools_with_errors']}")
    print(f"  Missing URLs: {report['tools']['missing_urls']}")
    print(f"Queries: {report['queries']['total_queries']}")
    print(f"  Short: {report['queries']['short_queries']}")
    print(f"QRels: {report['qrels']['total_qrel_records']}")
    print(f"  Pairs: {report['qrels']['total_pairs']}")
    print(f"  Invalid tools: {len(report['qrels']['invalid_tool_references'])}")
    print(f"  Invalid queries: {len(report['qrels']['invalid_query_references'])}")
    print(f"  Labels: {report['qrels']['label_distribution']}")
    print(f"\nCategory distribution:")
    for cat, count in report['tools']['category_distribution'].items():
        print(f"  {cat}: {count}")
