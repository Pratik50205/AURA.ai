"""AURA clean inference interface — recommend_tools()."""
import json
import time
import logging
import sys
from pathlib import Path
from typing import Any

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from src.utils.config import get_config, resolve_path

logger = logging.getLogger(__name__)

# Lazy-loaded pipeline components
_retriever = None
_reranker = None


def _get_retriever():
    """Lazy-load the retriever."""
    global _retriever
    if _retriever is None:
        from src.retrieval.retrieve import AuraRetriever
        _retriever = AuraRetriever()
    return _retriever


def _get_reranker():
    """Lazy-load the reranker (optional)."""
    global _reranker
    if _reranker is None:
        try:
            from src.ranking.rerank import AuraReranker
            _reranker = AuraReranker()
        except Exception as e:
            logger.warning(f"Reranker not available: {e}")
            _reranker = False  # Mark as unavailable
    return _reranker if _reranker is not False else None


import re

QUERY_SYNONYMS = {
    # Presentations / Office (Gamma, Tome, Beautiful.ai)
    r"\bppt[xs]?\b": "ppt presentation slides",
    r"\bpowerpoint\b": "powerpoint presentation slides",
    r"\bdeck[s]?\b": "pitch deck presentation slides",

    # Image, Graphics & Design (Remove.bg, Photoroom, Pixlr, Canva)
    r"\bbg\b": "background",
    r"\bpics?\b": "picture photo",
    r"\bpfp\b": "profile picture avatar photo",
    r"\blogo[s]?\b": "logo brand design",
    r"\bui\b": "ui user interface design",
    r"\bux\b": "ux user experience design",

    # Video & Animation (Runway, Pika, Kling, Synthesia, InVideo)
    r"\bvids?\b": "video",
    r"\b(sub|subs)\b": "subtitles captions",

    # Audio & Voice (ElevenLabs, Murf, Descript)
    r"\bvo\b": "voiceover voice speech",
    r"\btts\b": "text to speech voice generation",
    r"\bstt\b": "speech to text audio transcription",

    # Writing & Career (Jasper, Grammarly, Resume tools)
    r"\bcv\b": "resume cv",
}


def expand_query(query: str) -> str:
    """Expand common colloquial abbreviations into rich semantic concepts."""
    expanded = query
    for pattern, replacement in QUERY_SYNONYMS.items():
        expanded = re.sub(pattern, replacement, expanded, flags=re.IGNORECASE)
    return expanded


def recommend_tools(
    query: str,
    top_k: int = 5,
    use_reranker: bool = True,
) -> dict[str, Any]:
    """Recommend top-K AI tools for a natural language query.

    This is the main inference interface for the backend/chatbot team.

    Args:
        query: Natural language tool request.
        top_k: Number of tools to return.
        use_reranker: Whether to apply cross-encoder reranking.

    Returns:
        Structured result dict with query, results, and metadata.
    """
    start_time = time.time()
    retriever = _get_retriever()

    # Preprocess / expand query for common abbreviations
    search_query = expand_query(query)

    # Stage 1: Semantic retrieval — get top-20 candidates
    config = get_config()
    n_candidates = config["retrieval"]["top_n_candidates"]
    candidates = retriever.retrieve(search_query, top_k=n_candidates)

    # Stage 2: Reranking (optional)
    if use_reranker:
        reranker = _get_reranker()
        if reranker:
            candidates = reranker.rerank(query, candidates, top_k=n_candidates)

    # Select top-K
    top_results = candidates[:top_k]

    # Build response
    results = []
    for i, c in enumerate(top_results):
        result = {
            "rank": i + 1,
            "tool_id": c["tool_id"],
            "name": c.get("name", "Unknown"),
            "category": c.get("category", ""),
            "description": c.get("description", ""),
            "url": c.get("url"),
            "semantic_score": c.get("semantic_score", 0.0),
        }
        if "reranker_score" in c:
            result["reranker_score"] = c["reranker_score"]
        if "ranking_score" in c:
            result["ranking_score"] = c["ranking_score"]

        # Generate reason
        result["reason"] = _generate_reason(query, c)
        results.append(result)

    latency_ms = round((time.time() - start_time) * 1000, 2)

    return {
        "query": query,
        "expanded_query": search_query if search_query != query else None,
        "results": results,
        "model_version": "aura-retriever-v1",
        "latency_ms": latency_ms,
        "num_candidates_considered": len(candidates),
    }


def _generate_reason(query: str, tool: dict) -> str:
    """Generate a brief reason why this tool matches the query."""
    name = tool.get("name", "This tool")
    category = tool.get("category", "")
    desc = tool.get("description", "")

    # Simple template-based reason
    if desc:
        short_desc = desc[:100] + "..." if len(desc) > 100 else desc
        return f"{name} ({category}): {short_desc}"
    return f"{name} is a {category} tool."


def _print_results(result: dict[str, Any]) -> None:
    """Pretty-print recommendation results to terminal."""
    try:
        from src.inference.cli_ui import display_recommendation_results
        display_recommendation_results(result)
    except Exception:
        print("\n" + "=" * 60)
        print(f"Results for: \"{result['query']}\"")
        print("=" * 60)
        for r in result["results"]:
            score = r.get("reranker_score") or r.get("semantic_score", 0)
            print(f"  #{r['rank']} {r['name']} ({r.get('category', '')})  [Score: {score:.4f}]")
            print(f"     {r['reason']}")
            if r.get("url"):
                print(f"     URL: {r['url']}")
            print()
        print(f"⚡ Latency: {result['latency_ms']:.1f}ms | Candidates evaluated: {result['num_candidates_considered']}")
        print("=" * 60 + "\n")


if __name__ == "__main__":
    import sys
    logging.basicConfig(level=logging.WARNING)

    # If arguments were provided, run single query and exit
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
        result = recommend_tools(query, top_k=5, use_reranker=False)
        _print_results(result)
    else:
        # Interactive loop mode: stays loaded in memory for instant responses (<50ms)
        print("\n" + "=" * 60)
        print("  AURA AI Tool Recommendation Engine — Interactive Mode")
        print("  (Type your query and press Enter. Type 'exit' to quit)")
        print("=" * 60)

        # Pre-load retriever once
        print("\nLoading models into memory...")
        _get_retriever()
        print("Ready!\n")

        while True:
            try:
                user_query = input("Query: ").strip()
                if not user_query:
                    continue
                if user_query.lower() in ("exit", "quit", "q"):
                    print("Goodbye!")
                    break
                result = recommend_tools(user_query, top_k=5, use_reranker=False)
                _print_results(result)
            except (KeyboardInterrupt, EOFError):
                print("\nGoodbye!")
                break
