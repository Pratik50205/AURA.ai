"""AURA Market-Grade Neural Inference & Recommendation Engine.

Multi-Signal Ranking Architecture:
1. Dense Vector Cosine Similarity (sentence-transformers / FAISS FlatIP)
2. Exact Entity & Brand Match Recognition (+0.35)
3. Multi-Intent & Compound Capability Match (e.g. Generation + Editing + Timeline)
4. Explicit Constraint Extraction (Budget, Subscription, Paid vs Free Tiers)
5. Strict Domain Guardrails & Category Penalties
6. Calibrated Community Trust Score & Verification Bonus
7. Supervised PyTorch Neural Ranker (MLPRanker 3-layer network)
8. Contextual Reasoning & Pricing Justification Generation
"""
import json
import time
import logging
import re
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
_neural_ranker = None


def _get_retriever():
    """Lazy-load the semantic retriever."""
    global _retriever
    if _retriever is None:
        from src.retrieval.retrieve import AuraRetriever
        _retriever = AuraRetriever()
    return _retriever


def _get_reranker():
    """Lazy-load the cross-encoder reranker (optional)."""
    global _reranker
    if _reranker is None:
        try:
            from src.ranking.rerank import AuraReranker
            _reranker = AuraReranker()
        except Exception as e:
            logger.debug(f"Cross-encoder reranker unavailable: {e}")
            _reranker = False
    return _reranker if _reranker is not False else None


def _get_neural_ranker():
    """Lazy-load the supervised PyTorch MLP neural ranker."""
    global _neural_ranker
    if _neural_ranker is None:
        try:
            from src.ranking.train import load_ranker
            model_path = resolve_path("models/mlp_ranker.pt")
            if model_path.exists():
                _neural_ranker = load_ranker(model_path)
            else:
                _neural_ranker = False
        except Exception as e:
            logger.debug(f"Neural MLP ranker unavailable: {e}")
            _neural_ranker = False
    return _neural_ranker if _neural_ranker is not False else None


QUERY_SYNONYMS = {
    # Presentations / Office (Gamma, Tome, Beautiful.ai)
    r"\bppt[xs]?\b": "ppt presentation slides deck",
    r"\bpowerpoint\b": "powerpoint presentation slides",
    r"\bdeck[s]?\b": "pitch deck presentation slides",

    # Image, Graphics & Design (Remove.bg, Photoroom, Pixlr, Canva)
    r"\bbg\b": "background",
    r"\bpics?\b": "picture photo",
    r"\bpfp\b": "profile picture avatar photo",
    r"\blogo[s]?\b": "logo brand design",
    r"\bui\b": "ui user interface design",
    r"\bux\b": "ux user experience design",

    # Video & Animation (Runway, Pika, Kling, Synthesia, InVideo, Kapwing)
    r"\bvids?\b": "video",
    r"\b(sub|subs)\b": "subtitles captions",

    # Audio & Voice (ElevenLabs, Murf, Descript, Play.ht)
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


def parse_query_intents(query: str) -> dict[str, Any]:
    """Parse constraints, domains, budget, and compound intents from user request."""
    q_lower = query.lower()

    # Budget & Pricing Constraints
    wants_paid = any(w in q_lower for w in [
        'pay', 'paid', 'subscription', 'subscribe', 'budget', 'premium',
        'cost', 'buy', 'pricing', 'pro plan', 'commercial license', 'enterprise'
    ]) and not any(w in q_lower for w in ['free only', '100% free', 'without paying', 'no pay'])

    wants_free = any(w in q_lower for w in [
        'free', '$0', 'open source', 'no cost', 'gratis', 'without paying', 'no credit card'
    ])

    # Domain Intents
    is_video = any(w in q_lower for w in ['video', 'vid', 'clip', 'footage', 'animation', 'timeline'])
    is_editing = any(w in q_lower for w in ['edit', 'editing', 'cut', 'timeline', 'montage', 'splice', 'trim', 'caption', 'subtitle'])
    is_generation = any(w in q_lower for w in ['generate', 'generation', 'create', 'creation', 'make', 'maker', 'text to video', 'text-to-video'])
    is_coding = any(w in q_lower for w in ['code', 'coding', 'programming', 'developer', 'vscode', 'script', 'debug', 'syntax'])
    is_voice = any(w in q_lower for w in ['voice', 'speech', 'tts', 'voiceover', 'audio', 'narrat', 'clone voice'])
    is_presentation = any(w in q_lower for w in ['presentation', 'ppt', 'slides', 'deck', 'powerpoint', 'keynote'])
    is_image = any(w in q_lower for w in ['image', 'photo', 'picture', 'art', 'draw', 'illustration', 'wallpaper', 'logo'])
    is_writing = any(w in q_lower for w in ['write', 'writing', 'essay', 'blog', 'article', 'copywriting', 'email', 'grammar'])

    return {
        "wants_paid": wants_paid,
        "wants_free": wants_free,
        "is_video": is_video,
        "is_editing": is_editing,
        "is_generation": is_generation,
        "is_coding": is_coding,
        "is_voice": is_voice,
        "is_presentation": is_presentation,
        "is_image": is_image,
        "is_writing": is_writing,
    }


def rank_candidates_market_grade(
    query: str,
    candidates: list[dict],
    intents: dict[str, Any],
    neural_ranker: Any = None,
) -> list[dict]:
    """Production multi-signal ranking algorithm."""
    query_lower = query.lower()
    query_words = set(re.findall(r'\b[a-z0-9]+\b', query_lower))

    scored_candidates = []
    for c in candidates:
        name = c.get("name", "").lower()
        desc = c.get("description", "").lower()
        cat = c.get("category", "").lower()
        tags = [t.lower() for t in c.get("tags", [])]
        features = [f.lower() for f in c.get("keyFeatures", [])]
        pricing_str = str(c.get("pricing", "")).lower()
        pricing_details = c.get("pricingDetails", [])
        combined_text = f"{name} {cat} {desc} {' '.join(tags)} {' '.join(features)}"

        # 1. Base Dense Vector Cosine Similarity
        sem_score = float(c.get("semantic_score", 0.0))
        final_score = sem_score * 0.55

        # 2. Exact Brand / Tool Name Recognition (Instant +0.35 boost)
        clean_name = re.sub(r'[^a-z0-9]', '', name)
        clean_query = re.sub(r'[^a-z0-9]', '', query_lower)
        if clean_name and (clean_name == clean_query or f" {name} " in f" {query_lower} "):
            final_score += 0.38
        elif name and name in query_lower:
            final_score += 0.25

        # 3. Direct Tag & Keyword Overlap
        tag_matches = sum(1 for t in tags if t in query_lower)
        final_score += min(tag_matches * 0.05, 0.20)

        # 4. Multi-Intent Compound Scoring
        # Video: Generation + Editing
        if intents["is_video"]:
            has_gen_cap = any(w in combined_text for w in ['generate', 'generation', 'text-to-video', 'creates video', 'clip generation'])
            has_edit_cap = any(w in combined_text for w in ['edit', 'editing', 'timeline', 'editor', 'cut', 'trim', 'captions'])

            if intents["is_generation"] and intents["is_editing"]:
                # User wants BOTH generation AND editing
                if has_gen_cap and has_edit_cap:
                    final_score += 0.24  # Massive compound synergy boost
                elif has_edit_cap:
                    final_score += 0.12
                elif has_gen_cap:
                    final_score += 0.08
            elif intents["is_editing"]:
                if 'editing' in cat or has_edit_cap:
                    final_score += 0.18
            elif intents["is_generation"]:
                if 'generation' in cat or has_gen_cap:
                    final_score += 0.15

        # Audio/Voice: Voice Generation + Transcription/Editing
        if intents["is_voice"]:
            if 'audio' in cat or 'voice' in cat:
                final_score += 0.18

        # Coding: Code Assistant
        if intents["is_coding"]:
            if 'code' in cat or 'development' in cat:
                final_score += 0.18

        # Presentation: Slides & Decks
        if intents["is_presentation"]:
            if 'productivity' in cat or any(w in combined_text for w in ['slide', 'presentation', 'deck']):
                final_score += 0.22

        # 5. Pricing & Subscription Constraint Alignment
        if intents["wants_paid"]:
            # User specifically stated they can pay for a subscription
            has_plans = bool(pricing_details and len(pricing_details) > 0)
            if pricing_str in ['premium', 'paid']:
                final_score += 0.14
            elif pricing_str == 'freemium':
                final_score += 0.10 if has_plans else 0.06
        elif intents["wants_free"]:
            if 'free' in pricing_str:
                final_score += 0.18
            else:
                final_score -= 0.25

        # 6. Quality & Trust Score Calibration (trustScore is calibrated 70 - 99)
        trust = float(c.get("trustScore", 80))
        final_score += (trust / 100.0) * 0.08
        if c.get("verified"):
            final_score += 0.03

        # 7. Category Guardrails (Eliminate False Positives)
        if intents["is_presentation"] and 'video' in cat:
            final_score -= 0.35  # Do not recommend video tools for presentation decks
        if intents["is_video"] and not any(w in combined_text for w in ['video', 'footage', 'clip', 'animation']):
            final_score -= 0.40  # Do not recommend pure image/audio tools for video queries
        if intents["is_coding"] and not any(w in combined_text for w in ['code', 'developer', 'programming', 'software']):
            final_score -= 0.35

        c["intent_score"] = round(final_score, 4)
        c["ranking_score"] = c["intent_score"]
        scored_candidates.append(c)

    # 8. Supervised Neural MLP Ranker Blending (if model is available)
    if neural_ranker:
        try:
            from src.ranking.predict import predict_ranking
            predict_ranking(neural_ranker, query, scored_candidates)
            for c in scored_candidates:
                n_score = float(c.get("neural_score", c["intent_score"]))
                # Blend intent score with calibrated neural score
                c["ranking_score"] = round(c["intent_score"] * 0.75 + n_score * 0.25, 4)
        except Exception as e:
            logger.debug(f"Neural ranker blending skipped: {e}")

    # Sort descending by final ranking_score
    scored_candidates.sort(key=lambda x: x.get("ranking_score", 0.0), reverse=True)
    return scored_candidates


def _generate_smart_reason(query: str, tool: dict, intents: dict[str, Any]) -> str:
    """Generate professional, consultative justification detailing why this tool fits."""
    name = tool.get("name", "This tool")
    category = tool.get("category", "")
    pricing = tool.get("pricing", "Freemium")
    trust = tool.get("trustScore", 85)
    pricing_details = tool.get("pricingDetails", [])
    features = tool.get("keyFeatures", [])
    desc = tool.get("description", "")
    tags = [t.lower() for t in tool.get("tags", [])]
    combined = f"{desc} {' '.join(tags)} {' '.join(features)}".lower()

    # Pricing detail snippet
    pricing_note = ""
    if intents.get("wants_paid") and pricing_details:
        paid_plans = [p for p in pricing_details if str(p.get("price", "")).strip() not in ["$0", "$0/month", "Free", "$0/year", ""]]
        target_plan = paid_plans[0] if paid_plans else pricing_details[0]
        plan_name = target_plan.get("plan") or target_plan.get("name") or "Pro"
        plan_price = target_plan.get("price", "Subscription")
        pricing_note = f" [{plan_name}: {plan_price}]"
    elif pricing:
        pricing_note = f" ({pricing})"

    # Contextual capability highlight
    capability_highlight = ""
    if intents.get("is_video"):
        has_edit = any(w in combined for w in ["timeline", "editor", "editing", "cut", "trim", "clip", "highlight"])
        has_gen = any(w in combined for w in ["text-to-video", "generat", "ai video", "create video"])
        if has_gen and has_edit:
            capability_highlight = "Dual text-to-video generation with timeline video editing."
        elif has_edit:
            capability_highlight = "Advanced video editing, smart cuts, and auto-captioning."
        elif has_gen:
            capability_highlight = "High-definition generative text-to-video synthesis."
        else:
            capability_highlight = "AI video creation and automated workflow."
    elif intents.get("is_coding"):
        capability_highlight = "Context-aware code completion, debugging, and IDE assistance."
    elif intents.get("is_voice"):
        capability_highlight = "Ultra-realistic voice synthesis and neural audio generation."
    elif intents.get("is_presentation"):
        capability_highlight = "Automated slide generation, deck design, and visual formatting."
    elif features:
        capability_highlight = f"Features {features[0]}."
    elif desc:
        capability_highlight = desc[:90] + ("..." if len(desc) > 90 else "")

    return f"{name} ({category}){pricing_note}: {capability_highlight} Trust score: {trust}/100."


def recommend_tools(
    query: str,
    top_k: int = 5,
    use_reranker: bool = True,
    use_cross_encoder: bool = False,
) -> dict[str, Any]:
    """Recommend top-K AI tools for a natural language query with enterprise ranking.

    Args:
        query: Natural language tool request.
        top_k: Number of tools to return.
        use_reranker: Whether to enable advanced neural multi-signal ranking.
        use_cross_encoder: Whether to run slow CPU cross-encoder (default False for <50ms latency).

    Returns:
        Structured result dict with query, results, intent metadata, and latency.
    """
    retriever = _get_retriever()
    start_time = time.time()

    # Preprocess & expand colloquial abbreviations
    search_query = expand_query(query)

    # Parse multi-intent, constraints, and budget
    intents = parse_query_intents(query)

    # Stage 1: Dense Vector Retrieval (pull top 25 candidates)
    config = get_config()
    n_candidates = max(config["retrieval"]["top_n_candidates"], 25)
    candidates = retriever.retrieve(search_query, top_k=n_candidates)

    # Stage 2: Optional Cross-Encoder Feature Scoring (if explicitly requested)
    if use_cross_encoder:
        reranker = _get_reranker()
        if reranker:
            try:
                pairs = [[query, c.get("description") or c.get("name", "")] for c in candidates]
                scores = reranker.model.predict(pairs, batch_size=16, show_progress_bar=False)
                for i, c in enumerate(candidates):
                    c["reranker_score"] = round(float(scores[i]), 4)
            except Exception as e:
                logger.debug(f"Cross-encoder scoring skipped: {e}")

    # Stage 3: Supervised Multi-Signal Intent & Constraint Ranking
    neural_ranker = _get_neural_ranker() if use_reranker else None
    ranked_candidates = rank_candidates_market_grade(
        query=query,
        candidates=candidates,
        intents=intents,
        neural_ranker=neural_ranker,
    )

    # Select top-K
    top_results = ranked_candidates[:top_k]

    # Build response payload
    results = []
    for i, c in enumerate(top_results):
        result = {
            "rank": i + 1,
            "tool_id": c.get("tool_id", c.get("id")),
            "name": c.get("name", "Unknown"),
            "category": c.get("category", ""),
            "description": c.get("description", ""),
            "url": c.get("url"),
            "pricing": c.get("pricing", "Freemium"),
            "pricingDetails": c.get("pricingDetails", []),
            "trustScore": c.get("trustScore", 80),
            "users": c.get("users", "Not listed"),
            "verified": c.get("verified", False),
            "tags": c.get("tags", []),
            "semantic_score": c.get("semantic_score", 0.0),
            "ranking_score": c.get("ranking_score", c.get("semantic_score", 0.0)),
        }
        if "reranker_score" in c:
            result["reranker_score"] = c["reranker_score"]

        # Generate consultative market-grade reason
        result["reason"] = _generate_smart_reason(query, c, intents)
        results.append(result)

    latency_ms = round((time.time() - start_time) * 1000, 2)

    return {
        "query": query,
        "expanded_query": search_query if search_query != query else None,
        "intents": intents,
        "results": results,
        "model_version": "aura-neural-ranker-v2",
        "latency_ms": latency_ms,
        "num_candidates_considered": len(candidates),
    }


def _print_results(result: dict[str, Any]) -> None:
    """Pretty-print recommendation results to terminal."""
    try:
        from src.inference.cli_ui import display_recommendation_results
        display_recommendation_results(result)
    except Exception:
        print("\n" + "=" * 65)
        print(f"Results for: \"{result['query']}\"")
        print("=" * 65)
        for r in result["results"]:
            score = r.get("ranking_score") or r.get("semantic_score", 0)
            print(f"  #{r['rank']} {r['name']} ({r.get('category', '')})  [Score: {score:.4f} | Trust: {r.get('trustScore', '')}%]")
            print(f"     Reason: {r['reason']}")
            if r.get("url"):
                print(f"     URL: {r['url']}")
            print()
        print(f"⚡ Latency: {result['latency_ms']:.1f}ms | Evaluated: {result['num_candidates_considered']} candidates")
        print("=" * 65 + "\n")


if __name__ == "__main__":
    import sys
    logging.basicConfig(level=logging.WARNING)

    # If arguments were provided, run single query and exit
    if len(sys.argv) > 1:
        user_query = " ".join(sys.argv[1:])
        result = recommend_tools(user_query, top_k=5, use_reranker=True)
        _print_results(result)
    else:
        print("\n" + "=" * 65)
        print("  AURA AI Tool Recommendation Engine — Market Grade v2")
        print("  (Type your query and press Enter. Type 'exit' to quit)")
        print("=" * 65)

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
                result = recommend_tools(user_query, top_k=5, use_reranker=True)
                _print_results(result)
            except (KeyboardInterrupt, EOFError):
                print("\nGoodbye!")
                break
