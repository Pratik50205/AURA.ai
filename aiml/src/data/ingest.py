"""Source data adapters for ToolRet, ToolBench, and custom AURA records."""
import json
import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


def load_json(path: str | Path) -> list[dict]:
    """Load JSON file."""
    path = Path(path)
    if not path.exists():
        logger.warning(f"File not found: {path}")
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(data: list[dict], path: str | Path) -> None:
    """Save data to JSON file."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    logger.info(f"Saved {len(data)} records to {path}")


class AuraToolAdapter:
    """Adapter for AURA's curated tool records."""

    def load(self, path: str | Path) -> list[dict]:
        """Load AURA canonical tool records."""
        records = load_json(path)
        logger.info(f"Loaded {len(records)} AURA tool records")
        return records


class ToolBenchAdapter:
    """Adapter for ToolBench dataset.

    Expected input: ToolBench tool metadata JSON with fields like
    'tool_name', 'api_name', 'api_description', 'category_name', etc.

    This adapter normalizes ToolBench records into AURA's canonical schema.
    """

    def load(self, path: str | Path) -> list[dict]:
        """Load and normalize ToolBench records."""
        raw = load_json(path)
        if not raw:
            logger.warning("No ToolBench data found. Provide raw data at the expected path.")
            return []

        tools = []
        for i, record in enumerate(raw):
            tool = self._normalize(record, index=i)
            if tool:
                tools.append(tool)

        logger.info(f"Loaded {len(tools)} tools from ToolBench")
        return tools

    def _normalize(self, record: dict, index: int) -> dict | None:
        """Convert a ToolBench record to AURA schema."""
        name = record.get("tool_name") or record.get("api_name")
        if not name:
            return None

        return {
            "id": f"tb_{index:04d}",
            "name": name.strip(),
            "pricing": None,
            "category": record.get("category_name", "Uncategorized"),
            "description": (record.get("api_description") or record.get("tool_description") or "").strip(),
            "icon": None,
            "url": record.get("home_url"),
            "trustScore": None,
            "users": None,
            "tags": [],
            "verified": False,
            "bestPrompts": [],
            "useCases": [],
            "keyFeatures": [],
            "pros": [],
            "cons": [],
            "alternatives": [],
            "pricingDetails": [],
            "_provenance": {
                "source": "toolbench",
                "source_id": record.get("tool_name", ""),
                "license": "Apache-2.0",
                "retrieved_at": None,
            },
        }


class ToolRetAdapter:
    """Adapter for ToolRet/ToolRetrieval dataset.

    Expected input: ToolRet JSON with fields like
    'name', 'description', 'category', 'tags', etc.
    """

    def load(self, path: str | Path) -> list[dict]:
        """Load and normalize ToolRet records."""
        raw = load_json(path)
        if not raw:
            logger.warning("No ToolRet data found.")
            return []

        tools = []
        for i, record in enumerate(raw):
            tool = self._normalize(record, index=i)
            if tool:
                tools.append(tool)

        logger.info(f"Loaded {len(tools)} tools from ToolRet")
        return tools

    def _normalize(self, record: dict, index: int) -> dict | None:
        """Convert a ToolRet record to AURA schema."""
        name = record.get("name")
        if not name:
            return None

        return {
            "id": f"tr_{index:04d}",
            "name": name.strip(),
            "pricing": record.get("pricing"),
            "category": record.get("category", "Uncategorized"),
            "description": (record.get("description") or "").strip(),
            "icon": None,
            "url": record.get("url"),
            "trustScore": None,
            "users": None,
            "tags": record.get("tags", []),
            "verified": False,
            "bestPrompts": [],
            "useCases": [],
            "keyFeatures": record.get("features", []),
            "pros": [],
            "cons": [],
            "alternatives": [],
            "pricingDetails": [],
            "_provenance": {
                "source": "toolret",
                "source_id": record.get("id", ""),
                "license": "Unknown",
                "retrieved_at": None,
            },
        }


def ingest_all_sources(
    aura_path: str | Path | None = None,
    toolbench_path: str | Path | None = None,
    toolret_path: str | Path | None = None,
) -> list[dict]:
    """Ingest tools from all available sources.

    Returns combined list of normalized tool records.
    """
    all_tools = []

    if aura_path:
        adapter = AuraToolAdapter()
        all_tools.extend(adapter.load(aura_path))

    if toolbench_path:
        adapter = ToolBenchAdapter()
        all_tools.extend(adapter.load(toolbench_path))

    if toolret_path:
        adapter = ToolRetAdapter()
        all_tools.extend(adapter.load(toolret_path))

    logger.info(f"Total tools ingested: {len(all_tools)}")
    return all_tools
