"""Embedding generation for AURA tools and queries (CPU-optimized)."""
import json
import logging
import pickle
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import numpy as np
from sentence_transformers import SentenceTransformer

from src.utils.config import get_config, resolve_path
from src.data.enrich import build_semantic_document

logger = logging.getLogger(__name__)


class AuraEmbedder:
    """Generate embeddings for tools and queries."""

    def __init__(self, model_name: str | None = None, device: str = "cpu"):
        config = get_config()
        self.model_name = model_name or config["embedding"]["active_model"]
        self.device = device or config["embedding"]["device"]
        self.batch_size = config["embedding"]["batch_size"]
        self.normalize = config["embedding"]["normalize_embeddings"]

        logger.info(f"Loading embedding model: {self.model_name} on {self.device}")
        try:
            self.model = SentenceTransformer(self.model_name, device=self.device, local_files_only=True)
        except Exception:
            self.model = SentenceTransformer(self.model_name, device=self.device)
        dim = self.model.get_embedding_dimension()
        self.dimension: int = dim if dim is not None else 384
        logger.info(f"Embedding dimension: {self.dimension}")

    def encode(self, texts: list[str], show_progress_bar: bool = False) -> np.ndarray:
        """Encode texts to embeddings."""
        embeddings = self.model.encode(
            texts,
            batch_size=self.batch_size,
            show_progress_bar=show_progress_bar,
            normalize_embeddings=self.normalize,
            convert_to_numpy=True,
        )
        return embeddings

    def embed_tools(self, tools: list[dict]) -> tuple[np.ndarray, list[str]]:
        """Generate embeddings for tool semantic documents.

        Returns:
            Tuple of (embeddings array, tool_id list)
        """
        docs = []
        tool_ids = []
        for tool in tools:
            doc = tool.get("semantic_document") or build_semantic_document(tool)
            docs.append(doc)
            tool_ids.append(tool["id"])

        logger.info(f"Embedding {len(docs)} tool documents...")
        embeddings = self.encode(docs, show_progress_bar=True)
        logger.info(f"Tool embeddings shape: {embeddings.shape}")
        return embeddings, tool_ids

    def embed_queries(self, queries: list[str]) -> np.ndarray:
        """Generate embeddings for queries."""
        logger.info(f"Embedding {len(queries)} queries...")
        return self.encode(queries, show_progress_bar=True)

    def save_embeddings(
        self,
        embeddings: np.ndarray,
        tool_ids: list[str],
        output_dir: str | Path,
    ) -> None:
        """Save embeddings and metadata to disk."""
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        np.save(output_dir / "tool_embeddings.npy", embeddings)
        with open(output_dir / "tool_ids.json", "w") as f:
            json.dump(tool_ids, f)
        with open(output_dir / "embedding_meta.json", "w") as f:
            json.dump({
                "model_name": self.model_name,
                "dimension": self.dimension,
                "num_tools": len(tool_ids),
                "normalized": self.normalize,
            }, f, indent=2)

        logger.info(f"Saved embeddings to {output_dir}")

    @staticmethod
    def load_embeddings(embeddings_dir: str | Path) -> tuple[np.ndarray, list[str], dict]:
        """Load saved embeddings from disk."""
        embeddings_dir = Path(embeddings_dir)
        embeddings = np.load(embeddings_dir / "tool_embeddings.npy")
        with open(embeddings_dir / "tool_ids.json", "r") as f:
            tool_ids = json.load(f)
        with open(embeddings_dir / "embedding_meta.json", "r") as f:
            meta = json.load(f)
        return embeddings, tool_ids, meta


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    config = get_config()

    # Load tools
    tools_path = resolve_path(config["data"]["tools_file"])
    with open(tools_path, "r", encoding="utf-8") as f:
        tools = json.load(f)

    # Generate embeddings
    embedder = AuraEmbedder()
    embeddings, tool_ids = embedder.embed_tools(tools)

    # Save
    output_dir = resolve_path("data/embeddings")
    embedder.save_embeddings(embeddings, tool_ids, output_dir)

    print(f"\n=== Embedding Summary ===")
    print(f"Model: {embedder.model_name}")
    print(f"Tools embedded: {len(tool_ids)}")
    print(f"Dimension: {embedder.dimension}")
    print(f"Saved to: {output_dir}")
