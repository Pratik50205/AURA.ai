# AURA AI/ML — Task Tracker

## Phase 1 — Project Setup
- [x] Create project directory structure
- [x] Create `configs/config.yaml`
- [x] Create `requirements.txt`
- [x] Create `README.md`
- [x] Create `src/` package init files
- [x] Create `src/utils/config.py`

## Phase 2 — Dataset (108 AI Tools)
- [x] Create `data/processed/aura_tools.json` (108 real AI tools across 23 categories)
- [x] Create `data/processed/aura_queries.json` (210 queries)
- [x] Create `data/processed/aura_qrels.json` (192 records, 930 relevance pairs)
- [x] Run data validation → 0 errors, 0 invalid refs
- [x] Run train/val/test split → 134/28/30, 0 leakage

## Phase 3 — Data Pipeline Code
- [x] `src/data/ingest.py` — ToolBench/ToolRet/AURA adapters
- [x] `src/data/normalize.py` — schema normalization
- [x] `src/data/dedupe.py` — multi-level deduplication
- [x] `src/data/validate.py` — validation + quality report
- [x] `src/data/enrich.py` — semantic document construction
- [x] `src/data/split.py` — leakage-safe splitting

## Phase 4 — Retrieval Pipeline
- [x] `src/retrieval/embed.py` — CPU-optimized embeddings
- [x] `src/retrieval/index.py` — FAISS index
- [x] `src/retrieval/retrieve.py` — semantic retrieval
- [x] `src/retrieval/bm25_baseline.py` — BM25 baseline

## Phase 5 — Ranking Pipeline
- [x] `src/ranking/features.py` — feature engineering
- [x] `src/ranking/train.py` — MLP ranker
- [x] `src/ranking/rerank.py` — cross-encoder
- [x] `src/ranking/predict.py` — inference prediction

## Phase 6 — Evaluation
- [x] `src/evaluation/metrics.py` — P@K, R@K, MRR, NDCG@K
- [x] `src/evaluation/evaluate.py` — experiment comparison

## Phase 7 — Inference Interface
- [x] `src/inference/recommend.py` — recommend_tools()
- [x] `src/inference/api.py` — FastAPI endpoint

## Phase 8 — Tests
- [x] `tests/test_data.py` — data pipeline tests
- [x] `tests/test_metrics.py` — evaluation metrics tests
- [x] Run all tests → 34/34 passed

## Phase 9 — End-to-End Model Verification
- [x] Embeddings generated → 108 tool vectors (384-dim) saved to `data/embeddings/`
- [x] FAISS index constructed → `FlatIP` vector index saved to `data/indexes/`
- [x] MLP Ranker trained → 50 epochs on CPU, validation loss = 0.1200 saved to `models/mlp_ranker.pt`
- [x] Benchmark evaluated → Semantic Search P@1 = 0.833, NDCG@5 = 0.774
- [x] Live Inference tested → Top-5 recommendations generated cleanly for live query

