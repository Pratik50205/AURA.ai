"""Leakage-safe train/validation/test splitting."""
import json
import random
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


def split_queries(
    qrels: list[dict],
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
    seed: int = 42,
) -> tuple[list[dict], list[dict], list[dict]]:
    """Split query-relevance records into train/val/test at query level.

    Ensures no query appears across multiple splits.
    """
    assert abs(train_ratio + val_ratio + test_ratio - 1.0) < 1e-6, "Ratios must sum to 1"

    rng = random.Random(seed)
    indices = list(range(len(qrels)))
    rng.shuffle(indices)

    n = len(qrels)
    n_train = int(n * train_ratio)
    n_val = int(n * val_ratio)

    train_idx = indices[:n_train]
    val_idx = indices[n_train : n_train + n_val]
    test_idx = indices[n_train + n_val :]

    train = [qrels[i] for i in train_idx]
    val = [qrels[i] for i in val_idx]
    test = [qrels[i] for i in test_idx]

    logger.info(f"Split: train={len(train)}, val={len(val)}, test={len(test)}")

    # Verify no leakage
    train_qids = {q["query_id"] for q in train}
    val_qids = {q["query_id"] for q in val}
    test_qids = {q["query_id"] for q in test}

    assert not (train_qids & val_qids), "Train-val query leakage detected!"
    assert not (train_qids & test_qids), "Train-test query leakage detected!"
    assert not (val_qids & test_qids), "Val-test query leakage detected!"

    return train, val, test


def save_splits(
    train: list[dict],
    val: list[dict],
    test: list[dict],
    output_dir: str | Path,
) -> None:
    """Save splits to disk."""
    output_dir = Path(output_dir)

    for name, data in [("train", train), ("validation", val), ("test", test)]:
        split_dir = output_dir / name
        split_dir.mkdir(parents=True, exist_ok=True)
        path = split_dir / "qrels.json"
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        logger.info(f"Saved {len(data)} records to {path}")


if __name__ == "__main__":
    import sys
    sys.path.insert(0, str(Path(__file__).parent.parent.parent))
    from src.utils.config import get_config, resolve_path

    logging.basicConfig(level=logging.INFO)
    config = get_config()

    qrels_path = resolve_path(config["data"]["qrels_file"])
    with open(qrels_path, "r", encoding="utf-8") as f:
        qrels = json.load(f)

    ratios = config["data"]["split_ratio"]
    train, val, test = split_queries(
        qrels,
        train_ratio=ratios["train"],
        val_ratio=ratios["validation"],
        test_ratio=ratios["test"],
        seed=config["project"]["seed"],
    )

    save_splits(train, val, test, resolve_path("data"))

    print(f"\n=== Split Summary ===")
    print(f"Train: {len(train)} queries")
    print(f"Validation: {len(val)} queries")
    print(f"Test: {len(test)} queries")
    print(f"Leakage: 0 (verified)")
