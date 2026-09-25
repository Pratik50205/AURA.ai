"""AURA configuration loader."""
import os
from pathlib import Path
from typing import Any

import yaml


def get_project_root() -> Path:
    """Return project root (parent of src/)."""
    return Path(__file__).resolve().parent.parent.parent


def load_config(config_path: str | None = None) -> dict[str, Any]:
    """Load YAML configuration.

    Args:
        config_path: Path to config file. Defaults to configs/config.yaml.

    Returns:
        Configuration dictionary.
    """
    if config_path is None:
        config_path = str(get_project_root() / "configs" / "config.yaml")

    with open(config_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    return config


def resolve_path(relative_path: str) -> Path:
    """Resolve a path relative to project root."""
    return get_project_root() / relative_path


# Singleton config
_config: dict | None = None


def get_config() -> dict[str, Any]:
    """Get cached configuration."""
    global _config
    if _config is None:
        _config = load_config()
    return _config
