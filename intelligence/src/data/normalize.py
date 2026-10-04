"""Normalize tool records to AURA canonical schema."""
import re
import logging
from typing import Any
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

# Standard category mapping for normalization
CATEGORY_MAP = {
    "ai tools": "AI Chatbot",
    "chatbot": "AI Chatbot",
    "llm": "AI Chatbot",
    "language model": "AI Chatbot",
    "image generation": "Image Generation",
    "text to image": "Image Generation",
    "image editing": "Image Editing",
    "photo editing": "Image Editing",
    "video generation": "Video Generation",
    "text to video": "Video Generation",
    "video editing": "Video Editing",
    "audio": "Audio & Voice",
    "voice": "Audio & Voice",
    "text to speech": "Audio & Voice",
    "speech to text": "Audio & Voice",
    "music": "Music Generation",
    "music generation": "Music Generation",
    "code": "Code Assistant",
    "coding": "Code Assistant",
    "writing": "Writing Assistant",
    "content writing": "Writing Assistant",
    "copywriting": "Writing Assistant",
    "design": "Design",
    "ui design": "Design",
    "graphic design": "Design",
    "seo": "Marketing & SEO",
    "marketing": "Marketing & SEO",
    "productivity": "Productivity",
    "research": "Research",
    "education": "Education",
    "translation": "Translation",
    "automation": "Automation",
    "customer service": "Customer Service",
    "data analytics": "Data & Analytics",
    "3d": "3D Generation",
    "website builder": "Website Builder",
    "legal": "Legal",
    "ai platform": "AI Platform",
    "ai search": "AI Search",
}


def clean_text(text: str | None) -> str:
    """Clean and normalize text content."""
    if not text:
        return ""
    # Remove excess whitespace
    text = re.sub(r"\s+", " ", text.strip())
    # Remove control characters
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", text)
    return text


def normalize_url(url: str | None) -> str | None:
    """Normalize URL format."""
    if not url:
        return None
    url = url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    try:
        parsed = urlparse(url)
        if parsed.netloc:
            return url
    except Exception:
        pass
    return None


def normalize_category(category: str | None) -> str:
    """Normalize category to standard taxonomy."""
    if not category:
        return "Uncategorized"
    key = category.strip().lower()
    return CATEGORY_MAP.get(key, category.strip())


def normalize_tags(tags: list | None) -> list[str]:
    """Normalize and deduplicate tags."""
    if not tags:
        return []
    normalized = []
    seen = set()
    for tag in tags:
        if isinstance(tag, str):
            t = tag.strip().lower()
            if t and t not in seen:
                normalized.append(t)
                seen.add(t)
    return normalized


def normalize_tool(record: dict) -> dict:
    """Normalize a single tool record to AURA canonical schema.

    Ensures all required fields exist and are properly formatted.
    """
    return {
        "id": record.get("id", ""),
        "name": clean_text(record.get("name")),
        "pricing": record.get("pricing"),
        "category": normalize_category(record.get("category")),
        "description": clean_text(record.get("description")),
        "icon": record.get("icon"),
        "url": normalize_url(record.get("url")),
        "trustScore": record.get("trustScore"),
        "users": record.get("users"),
        "tags": normalize_tags(record.get("tags")),
        "verified": bool(record.get("verified", False)),
        "bestPrompts": record.get("bestPrompts", []),
        "useCases": record.get("useCases", []),
        "keyFeatures": record.get("keyFeatures", []),
        "pros": record.get("pros", []),
        "cons": record.get("cons", []),
        "alternatives": record.get("alternatives", []),
        "pricingDetails": record.get("pricingDetails", []),
    }


def normalize_tools(tools: list[dict]) -> list[dict]:
    """Normalize a list of tool records."""
    normalized = []
    for tool in tools:
        n = normalize_tool(tool)
        if n["name"] and n["description"]:
            normalized.append(n)
        else:
            logger.warning(f"Skipping tool with missing name/description: {tool.get('id')}")
    logger.info(f"Normalized {len(normalized)}/{len(tools)} tools")
    return normalized
