"""Construct semantic tool documents for embedding."""
import logging

logger = logging.getLogger(__name__)

TEMPLATE_VERSION = "v1"


def build_semantic_document(tool: dict) -> str:
    """Build a compact semantic text representation from a tool record.

    Only includes fields useful for semantic meaning. Excludes
    UI-only fields (icon, url) and numeric fields (trustScore)
    that are better used as ranking features.
    """
    parts = []

    if tool.get("name"):
        parts.append(f"Tool: {tool['name']}")

    if tool.get("category"):
        parts.append(f"Category: {tool['category']}")

    if tool.get("description"):
        parts.append(f"Description: {tool['description']}")

    if tool.get("tags"):
        parts.append(f"Tags: {', '.join(tool['tags'])}")

    if tool.get("keyFeatures"):
        parts.append(f"Key features: {', '.join(tool['keyFeatures'])}")

    # Extract use case info
    use_cases = tool.get("useCases", [])
    if use_cases:
        uc_texts = []
        audiences = []
        for uc in use_cases:
            if uc.get("title"):
                uc_texts.append(uc["title"])
            if uc.get("targetAudience"):
                audiences.append(uc["targetAudience"])
        if uc_texts:
            parts.append(f"Use cases: {', '.join(uc_texts)}")
        if audiences:
            unique_audiences = list(dict.fromkeys(audiences))  # preserve order, remove dupes
            parts.append(f"Target users: {', '.join(unique_audiences)}")

    if tool.get("pros"):
        parts.append(f"Strengths: {'; '.join(tool['pros'])}")

    return "\n".join(parts)


def enrich_tools_with_semantic_docs(tools: list[dict]) -> list[dict]:
    """Add semantic_document field to each tool record."""
    for tool in tools:
        tool["semantic_document"] = build_semantic_document(tool)

    # Log stats
    lengths = [len(t["semantic_document"]) for t in tools]
    avg_len = sum(lengths) / len(lengths) if lengths else 0
    logger.info(
        f"Built {len(tools)} semantic documents "
        f"(avg {avg_len:.0f} chars, min {min(lengths, default=0)}, max {max(lengths, default=0)})"
    )
    return tools
