"""Deduplication for AURA tool records."""
import logging
from difflib import SequenceMatcher
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


def _canonical_url(url: str | None) -> str | None:
    """Extract canonical URL for comparison."""
    if not url:
        return None
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower().replace("www.", "")
        return domain
    except Exception:
        return None


def _name_similarity(a: str, b: str) -> float:
    """Compute name similarity ratio."""
    return SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio()


def deduplicate_tools(
    tools: list[dict],
    name_threshold: float = 0.90,
) -> tuple[list[dict], dict]:
    """Remove duplicate tools.

    Deduplication levels:
    1. Exact ID duplicates
    2. Canonical URL duplicates
    3. Near-exact name matches

    Returns:
        Tuple of (deduplicated tools, dedup report)
    """
    records_before = len(tools)
    id_seen: dict[str, int] = {}
    url_seen: dict[str, int] = {}
    exact_dupes = 0
    url_dupes = 0
    name_dupes = 0

    # Pass 1: Remove exact ID duplicates
    unique_by_id = []
    for tool in tools:
        tid = tool["id"]
        if tid in id_seen:
            exact_dupes += 1
            logger.debug(f"Exact duplicate ID: {tid}")
        else:
            id_seen[tid] = len(unique_by_id)
            unique_by_id.append(tool)

    # Pass 2: Remove URL duplicates (keep first occurrence)
    unique_by_url = []
    for tool in unique_by_id:
        canon = _canonical_url(tool.get("url"))
        if canon and canon in url_seen:
            url_dupes += 1
            logger.debug(f"URL duplicate: {tool['name']} -> {canon}")
        else:
            if canon:
                url_seen[canon] = len(unique_by_url)
            unique_by_url.append(tool)

    # Pass 3: Remove near-exact name matches
    unique_final = []
    names_seen: list[str] = []
    for tool in unique_by_url:
        is_dupe = False
        for existing_name in names_seen:
            if _name_similarity(tool["name"], existing_name) >= name_threshold:
                name_dupes += 1
                logger.debug(f"Name duplicate: '{tool['name']}' ~ '{existing_name}'")
                is_dupe = True
                break
        if not is_dupe:
            names_seen.append(tool["name"])
            unique_final.append(tool)

    report = {
        "records_before": records_before,
        "exact_duplicates_removed": exact_dupes,
        "url_duplicates_removed": url_dupes,
        "name_duplicates_removed": name_dupes,
        "records_after": len(unique_final),
    }

    logger.info(
        f"Dedup: {records_before} -> {len(unique_final)} "
        f"(ID:{exact_dupes}, URL:{url_dupes}, Name:{name_dupes})"
    )
    return unique_final, report
