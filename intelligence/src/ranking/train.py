"""MLP ranking model for AURA tool recommendation."""
import json
import logging
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset

from src.ranking.features import NUM_FEATURES
from src.utils.config import get_config

logger = logging.getLogger(__name__)


class MLPRanker(nn.Module):
    """Multi-layer perceptron for relevance ranking."""

    def __init__(
        self,
        input_dim: int = NUM_FEATURES,
        hidden_dims: list[int] | None = None,
        dropout: float = 0.3,
    ):
        super().__init__()
        config = get_config()
        hidden_dims = hidden_dims or config["ranking"]["mlp"]["hidden_dims"]
        dropout = dropout or config["ranking"]["mlp"]["dropout"]

        layers = []
        prev_dim = input_dim
        for h_dim in hidden_dims:
            layers.extend([
                nn.Linear(prev_dim, h_dim),
                nn.ReLU(),
                nn.Dropout(dropout),
            ])
            prev_dim = h_dim

        layers.append(nn.Linear(prev_dim, 1))  # output: relevance score
        self.network = nn.Sequential(*layers)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.network(x).squeeze(-1)


def train_ranker(
    features: np.ndarray,
    labels: np.ndarray,
    val_features: np.ndarray | None = None,
    val_labels: np.ndarray | None = None,
    save_path: str | Path | None = None,
) -> MLPRanker:
    """Train the MLP ranker.

    Args:
        features: Training features (N, num_features).
        labels: Training labels (N,) — relevance scores 0-3.
        val_features: Optional validation features.
        val_labels: Optional validation labels.
        save_path: Path to save trained model.

    Returns:
        Trained MLPRanker.
    """
    config = get_config()
    mlp_config = config["ranking"]["mlp"]

    model = MLPRanker(input_dim=features.shape[1])
    optimizer = torch.optim.Adam(model.parameters(), lr=mlp_config["learning_rate"])
    criterion = nn.MSELoss()

    # Normalize labels to 0-1 range
    labels_norm = labels.astype(np.float32) / 3.0
    X = torch.tensor(features, dtype=torch.float32)
    y = torch.tensor(labels_norm, dtype=torch.float32)

    dataset = TensorDataset(X, y)
    loader = DataLoader(dataset, batch_size=mlp_config["batch_size"], shuffle=True)

    best_val_loss = float("inf")
    patience = mlp_config.get("patience", 5)
    patience_counter = 0

    for epoch in range(mlp_config["epochs"]):
        model.train()
        epoch_loss = 0.0
        for batch_X, batch_y in loader:
            optimizer.zero_grad()
            preds = model(batch_X)
            loss = criterion(preds, batch_y)
            loss.backward()
            optimizer.step()
            epoch_loss += loss.item()

        avg_loss = epoch_loss / len(loader)

        # Validation
        val_loss_str = ""
        if val_features is not None and val_labels is not None:
            model.eval()
            with torch.no_grad():
                val_X = torch.tensor(val_features, dtype=torch.float32)
                val_y = torch.tensor(val_labels.astype(np.float32) / 3.0, dtype=torch.float32)
                val_preds = model(val_X)
                val_loss = criterion(val_preds, val_y).item()
                val_loss_str = f", val_loss={val_loss:.4f}"

                # Early stopping
                if val_loss < best_val_loss:
                    best_val_loss = val_loss
                    patience_counter = 0
                else:
                    patience_counter += 1
                    if patience_counter >= patience:
                        logger.info(f"Early stopping at epoch {epoch + 1}")
                        break

        if (epoch + 1) % 10 == 0:
            logger.info(f"Epoch {epoch + 1}: loss={avg_loss:.4f}{val_loss_str}")

    if save_path:
        save_path = Path(save_path)
        save_path.parent.mkdir(parents=True, exist_ok=True)
        torch.save(model.state_dict(), save_path)
        logger.info(f"Model saved to {save_path}")

    return model


def load_ranker(model_path: str | Path) -> MLPRanker:
    """Load trained MLP ranker from disk."""
    model = MLPRanker()
    model.load_state_dict(torch.load(model_path, map_location="cpu", weights_only=True))
    model.eval()
    return model


def train_and_save_model() -> MLPRanker:
    """Train MLP ranker on train split and validate on val split."""
    from src.ranking.features import extract_features
    from src.utils.config import resolve_path

    config = get_config()
    with open(resolve_path(config["data"]["tools_file"]), "r", encoding="utf-8") as f:
        tools = {t["id"]: t for t in json.load(f)}

    with open(resolve_path(config["data"]["queries_file"]), "r", encoding="utf-8") as f:
        queries = {q["query_id"]: q["query"] for q in json.load(f)}

    with open(resolve_path("data/train/qrels.json"), "r", encoding="utf-8") as f:
        train_qrels = json.load(f)

    with open(resolve_path("data/validation/qrels.json"), "r", encoding="utf-8") as f:
        val_qrels = json.load(f)

    def prepare_dataset(qrels):
        X_list, y_list = [], []
        for qrel in qrels:
            qid = qrel["query_id"]
            if qid not in queries:
                continue
            query = queries[qid]
            for rel in qrel.get("relevance", []):
                tid = rel["tool_id"]
                label = rel["label"]
                if tid in tools:
                    feat = extract_features(query, tools[tid], semantic_score=0.5)
                    X_list.append(feat)
                    y_list.append(label)
        return np.array(X_list, dtype=np.float32), np.array(y_list, dtype=np.float32)

    X_train, y_train = prepare_dataset(train_qrels)
    X_val, y_val = prepare_dataset(val_qrels)

    logger.info(f"Training set: {X_train.shape[0]} samples")
    logger.info(f"Validation set: {X_val.shape[0]} samples")

    model_path = resolve_path("models/mlp_ranker.pt")
    model = train_ranker(
        features=X_train,
        labels=y_train,
        val_features=X_val,
        val_labels=y_val,
        save_path=model_path,
    )
    print(f"\n=== Training Complete ===")
    print(f"Model saved to: {model_path}")
    return model


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    train_and_save_model()

