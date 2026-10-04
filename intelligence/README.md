# AURA AI/ML — Neural Semantic Recommendation Engine

The intelligence core for **AURA.ai**, providing high-dimensional vector search, domain-aware query expansion, and supervised neural ranking to match natural language queries with curated AI tools in sub-40 milliseconds.

---

## Architecture Flow

```text
User Query → Query Preprocessing & Slang Expansion → Sentence Transformer Encoding
    → FAISS FlatIP Vector Index → Top-20 Candidates → PyTorch MLP Feature Ranker → Top-K Results
```

---

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Interactive CLI (Animated spinner & pre-warmed vector memory)
python main.py

# 3. Single-query execution from terminal
python main.py "best AI tool for coding"

# 4. Start production REST API server
python -m uvicorn src.inference.api:app --port 8000
```

Interactive OpenAPI Swagger documentation will be available at:
`http://localhost:8000/docs`

---

## Directory Structure

```text
aiml/
├── main.py                      # Interactive CLI terminal application (<50ms query loop)
├── configs/config.yaml          # Central ML and pipeline configuration
├── data/
│   ├── processed/               # Curated dataset (108 tools, 210 queries, 930 pairs)
│   ├── embeddings/              # 384-dimensional dense tool vectors (.npy)
│   ├── indexes/                 # FAISS FlatIP cosine index file
│   └── splits/                  # Leakage-free train (70%), val (15%), test (15%) partitions
├── models/                      # Trained PyTorch MLP Ranker checkpoint (mlp_ranker.pt)
├── reports/                     # Benchmark evaluation reports and ablation studies
├── src/
│   ├── data/                    # Ingestion, normalization, validation, and enrichment
│   ├── retrieval/               # Embedding generation, FAISS indexer, and BM25 baseline
│   ├── ranking/                 # Feature engineering, MLP ranker, and cross-encoder
│   ├── evaluation/              # IR metrics (Precision@K, Recall@K, MRR, NDCG@K)
│   ├── inference/               # Query preprocessing, FastAPI endpoints, CLI UI
│   └── utils/                   # Path resolution and YAML config parser
└── tests/                       # Automated Pytest suite (34 passing tests)
```

---

## Dataset Statistics

- **Curated AI Tools**: 108 normalized tools spanning 23 categories.
- **Natural Language Queries**: 210 diverse formulations.
- **Relevance Judgments**: 930 graded query-tool pairs (labels 0–3).
- **Split Distribution**: 134 train / 28 validation / 30 held-out test queries (zero data leakage).

---

## Benchmark Evaluation Results

Evaluated across the 30 isolated test queries:

| Metric | Semantic Retrieval (AURA) | BM25 Baseline | Relative Improvement |
|---|---|---|---|
| **Precision@1** | **0.833** | 0.600 | **+38.8%** |
| **NDCG@5** | **0.774** | 0.521 | **+48.6%** |
| **Mean Reciprocal Rank (MRR)** | **0.873** | 0.770 | **+13.4%** |
| **Recall@5** | **0.789** | 0.703 | **+12.2%** |
| **Inference Latency** | **32.5 ms** | 0.9 ms | Real-time interactive grade |

---

## Query Preprocessing & Expansion

A boundary-enforced semantic expansion layer translates informal user abbreviations before vector encoding:

- `\bppt[xs]?\b` $\rightarrow$ `ppt presentation slides`
- `\bbg\b` $\rightarrow$ `background`
- `\bcv\b` $\rightarrow$ `resume cv`
- `\b(sub|subs)\b` $\rightarrow$ `subtitles captions`
- `\b(tts|stt|vo)\b` $\rightarrow$ `voiceover text-to-speech`
- `\b(pic|pics|pfp)\b` $\rightarrow$ `picture photo avatar`

---

## REST API Specification

### `POST /recommend`
Request:
```json
{
  "query": "best AI tool for coding",
  "top_k": 5,
  "use_reranker": false
}
```

Response:
```json
{
  "query": "best AI tool for coding",
  "results": [
    {
      "rank": 1,
      "tool_id": "t28",
      "name": "Cursor",
      "category": "Code Assistant",
      "description": "AI-first code editor built on VS Code...",
      "url": "https://cursor.sh",
      "semantic_score": 0.659,
      "reason": "Top semantic match for coding with 95/100 trust score."
    }
  ],
  "model_version": "aura-retriever-v1",
  "latency_ms": 39.1,
  "num_candidates_considered": 20
}
```

---

## Automated Unit Testing

Run all 34 unit tests:
```bash
python -m pytest
```

---

## License

Internal major academic project.
