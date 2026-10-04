"""FAISS index creation and management."""
import json
import logging
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import numpy as np
import faiss

from src.utils.config import get_config, resolve_path

logger = logging.getLogger(__name__)


class AuraIndex:
    """FAISS-based vector index for tool retrieval."""

    def __init__(self, dimension: int, index_type: str = "FlatIP"):
        """Initialize FAISS index.

        Args:
            dimension: Embedding dimension.
            index_type: FAISS index type (FlatIP for inner product / cosine with normalized vectors).
        """
        self.dimension = dimension
        self.index_type = index_type

        if index_type == "FlatIP":
            self.index = faiss.IndexFlatIP(dimension)
        elif index_type == "FlatL2":
            self.index = faiss.IndexFlatL2(dimension)
        else:
            raise ValueError(f"Unsupported index type: {index_type}")

        self.tool_ids: list[str] = []

    def add(self, embeddings: np.ndarray, tool_ids: list[str]) -> None:
        """Add tool embeddings to index."""
        assert embeddings.shape[0] == len(tool_ids)
        embeddings = embeddings.astype(np.float32)
        self.index.add(embeddings)
        self.tool_ids.extend(tool_ids)
        logger.info(f"Added {len(tool_ids)} vectors to index (total: {self.index.ntotal})")

    def search(self, query_embedding: np.ndarray, top_k: int = 20) -> list[tuple[str, float]]:
        """Search for most similar tools.

        Args:
            query_embedding: Query vector (1, dimension) or (dimension,).
            top_k: Number of results to return.

        Returns:
            List of (tool_id, score) tuples sorted by similarity.
        """
        if query_embedding.ndim == 1:
            query_embedding = query_embedding.reshape(1, -1)
        query_embedding = query_embedding.astype(np.float32)

        scores, indices = self.index.search(query_embedding, top_k)

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx >= 0 and idx < len(self.tool_ids):
                results.append((self.tool_ids[idx], float(score)))
        return results

    def save(self, output_dir: str | Path) -> None:
        """Save index and metadata to disk."""
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        faiss.write_index(self.index, str(output_dir / "faiss.index"))
        with open(output_dir / "index_meta.json", "w") as f:
            json.dump({
                "dimension": self.dimension,
                "index_type": self.index_type,
                "num_vectors": self.index.ntotal,
                "tool_ids": self.tool_ids,
            }, f, indent=2)

        logger.info(f"Saved FAISS index to {output_dir}")

    @classmethod
    def load(cls, index_dir: str | Path) -> "AuraIndex":
        """Load index from disk."""
        index_dir = Path(index_dir)

        with open(index_dir / "index_meta.json", "r") as f:
            meta = json.load(f)

        instance = cls.__new__(cls)
        instance.dimension = meta["dimension"]
        instance.index_type = meta["index_type"]
        instance.tool_ids = meta["tool_ids"]
        instance.index = faiss.read_index(str(index_dir / "faiss.index"))

        logger.info(f"Loaded FAISS index: {instance.index.ntotal} vectors, dim={instance.dimension}")
        return instance


def build_index(
    embeddings_dir: str | Path | None = None,
    index_dir: str | Path | None = None,
) -> AuraIndex:
    """Build FAISS index from saved embeddings."""
    config = get_config()
    embeddings_dir = Path(embeddings_dir or resolve_path("data/embeddings"))
    index_dir = Path(index_dir or resolve_path(config["faiss"]["index_dir"]))

    from src.retrieval.embed import AuraEmbedder
    embeddings, tool_ids, meta = AuraEmbedder.load_embeddings(embeddings_dir)

    index = AuraIndex(
        dimension=meta["dimension"],
        index_type=config["faiss"]["index_type"],
    )
    index.add(embeddings, tool_ids)
    index.save(index_dir)
    return index


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    idx = build_index()
    print(f"\n=== Index Summary ===")
    print(f"Vectors: {idx.index.ntotal}")
    print(f"Dimension: {idx.dimension}")
    print(f"Type: {idx.index_type}")
