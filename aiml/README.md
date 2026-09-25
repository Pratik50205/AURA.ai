# AURA AI/ML — Intelligent Tool Discovery & Recommendation

AI-powered tool discovery and recommendation engine that understands natural-language queries and returns the most relevant AI tools using semantic retrieval and learned ranking.

## Architecture

```
User Query → Query Processing → Semantic Embedding → FAISS Retrieval
    → Top-N Candidates → Re-ranking → Quality Signals → Top-K Results
```

## Quick Start

```bash
# 1. Install dependencies (CPU-optimized)
pip install -r requirements.txt

# 2. Run Interactive CLI (Recommended - instant ~50ms responses)
python main.py

# 3. Or run a single query from CLI
python -m src.inference.recommend "I need to remove backgrounds from images"

# 4. Start REST API server (optional)
python -m uvicorn src.inference.api:app --reload --port 8000
# Open Swagger docs at http://localhost:8000/docs
```

## Project Structure

```
aiml/
├── main.py                      # Interactive CLI + FastAPI entry
├── configs/config.yaml          # Central configuration
├── data/
│   ├── processed/               # Curated dataset (108 tools, 210 queries)
│   ├── embeddings/              # Pre-computed 384-dim tool vectors
│   ├── indexes/                 # FAISS vector search index
│   └── splits/                  # Consolidated train/val/test partitions
├── models/                      # Trained MLP ranker weights
├── reports/                     # Evaluation reports & benchmarks
├── src/
│   ├── data/                    # Data pipeline (ingest, normalize, validate)
│   ├── retrieval/               # Embedding + FAISS index retrieval
│   ├── ranking/                 # MLP ranker + Cross-Encoder reranker
│   ├── evaluation/              # Metrics and experiment comparison
│   ├── inference/               # Query expansion + recommendation API
│   └── utils/                   # Config loader, path resolution
├── tests/                       # Unit tests (34 tests)
└── README.md
```

> **Full documentation**: See `../docs/` for PRD, architecture deep-dive, and walkthrough.

## Dataset

- **100+ curated AI tools** across 12+ categories
- **500+ natural-language queries** (diverse formulations)
- **1000+ query-tool relevance pairs** (graded 0–3)
- Hard negatives for ranking training
- Leakage-safe train/validation/test splits

## Experiments

| Experiment | Description |
|---|---|
| Exp 0 | BM25 keyword baseline |
| Exp 1 | Sentence-Transformer + FAISS |
| Exp 2 | Embedding + metadata-aware ranking |
| Exp 3 | Embedding + MLP ranker |
| Exp 4 | Embedding + Cross-Encoder reranker |

## Evaluation Metrics

- Precision@1/3/5, Recall@5/10
- MRR, NDCG@5/10
- Top-K hit rates
- Inference latency

## Inference API

```python
from src.inference.recommend import recommend_tools

results = recommend_tools("I need to remove backgrounds from images", top_k=5)
```

Response:
```json
{
  "query": "I need to remove backgrounds from images",
  "results": [
    {"tool_id": "t17", "name": "Remove.bg", "score": 0.95, "reason": "..."}
  ],
  "model_version": "aura-retriever-v1"
}
```

## Query Preprocessing & Expansion

AURA incorporates a non-destructive query expansion layer that translates colloquial domain abbreviations into rich semantic concepts before vector encoding:

- `ppt`, `deck`, `powerpoint` $\rightarrow$ `presentation slides ppt`
- `bg` $\rightarrow$ `background`
- `pic`, `pics`, `pfp` $\rightarrow$ `picture photo avatar`
- `vid`, `vids` $\rightarrow$ `video`
- `sub`, `subs` $\rightarrow$ `subtitles captions`
- `vo`, `tts`, `stt` $\rightarrow$ `voiceover / text-to-speech / speech-to-text`
- `cv` $\rightarrow$ `resume cv`
- `ui`, `ux` $\rightarrow$ `user interface / user experience design`

All patterns use strict word boundaries (`\b`) to prevent false-positive alterations on standard English words (e.g. `subscribe`, `canvas`, `david`).

## Configuration

All settings in `configs/config.yaml`:
- Model selection (CPU-optimized defaults)
- Retrieval parameters
- Ranking hyperparameters
- Data paths and split ratios

## License

Internal project — see dataset provenance records for source data licensing.
