# AURA AI/ML — Master Development Task Tracker

## Phase 1 — Project Setup & Architecture
- [x] Create project directory structure (`docs/`, `intelligence/`, `app/`, `scripts/`)
- [x] Configure central parameters in `intelligence/configs/config.yaml`
- [x] Define root dependencies in `intelligence/requirements.txt`
- [x] Standardize Python module init files and configuration loader
- [x] Establish pure GitHub-Flavored Markdown documentation standards

## Phase 2 — Curated Dataset Engineering
- [x] Create `data/processed/aura_tools.json` (108 verified AI tools across 23 categories)
- [x] Create `data/processed/aura_queries.json` (210 diverse user queries)
- [x] Create `data/processed/aura_qrels.json` (930 graded query-tool relevance pairs)
- [x] Verify data validation pipeline (0 schema errors, 0 orphaned references)
- [x] Generate leakage-safe train/val/test splits (134 train, 28 val, 30 held-out test)

## Phase 3 — Data Processing Pipeline
- [x] `src/data/ingest.py` — Ingestion adapters for ToolBench, ToolRet, and AURA schemas
- [x] `src/data/normalize.py` — Text cleanup, casing normalization, and schema casting
- [x] `src/data/dedupe.py` — Multi-level deduplication across names, URLs, and descriptions
- [x] `src/data/validate.py` — Comprehensive schema validation and data quality reporter
- [x] `src/data/enrich.py` — Semantic document construction and tag aggregation
- [x] `src/data/split.py` — Query-level stratified splitting to guarantee zero test leakage

## Phase 4 — High-Dimensional Vector Retrieval
- [x] `src/retrieval/embed.py` — Dense embeddings using `sentence-transformers/all-MiniLM-L6-v2`
- [x] `src/retrieval/index.py` — FAISS `IndexFlatIP` vector index builder
- [x] `src/retrieval/retrieve.py` — Top-20 cosine similarity candidate search
- [x] `src/retrieval/bm25_baseline.py` — BM25 lexical search baseline for comparison

## Phase 5 — Supervised Neural Ranking
- [x] `src/ranking/features.py` — 10 engineered quality, category, and similarity features
- [x] `src/ranking/train.py` — 3-layer PyTorch MLP ranker training with early stopping
- [x] `src/ranking/rerank.py` — Transformer cross-encoder reranker integration
- [x] `src/ranking/predict.py` — Production ranking score prediction

## Phase 6 — Scientific Evaluation & Benchmarking
- [x] `src/evaluation/metrics.py` — Information retrieval metrics (P@K, R@K, MRR, NDCG@K)
- [x] `src/evaluation/evaluate.py` — Automated ablation experiments and comparative reporting
- [x] Semantic search achieved **0.833 Precision@1** and **0.774 NDCG@5** vs **0.600 BM25 baseline**

## Phase 7 — Production Inference & Serving
- [x] `src/inference/recommend.py` — Non-destructive query preprocessing and expansion
- [x] `src/inference/cli_ui.py` — Interactive animated terminal UI with circulating spinner
- [x] `src/inference/api.py` — Production FastAPI REST API server with startup pre-warming
- [x] Verified sub-40ms retrieval latency

## Phase 8 — Automated Testing & Quality Assurance
- [x] `tests/test_data.py` — Schema integrity and split leakage tests
- [x] `tests/test_metrics.py` — Metric mathematical correctness tests
- [x] All 34 automated unit tests passing cleanly

## Phase 9 — Full-Stack Web Application (Next.js 16)
- [x] Next.js 16 (Turbopack) App Router architecture
- [x] Interactive tool discovery catalog (`/discover`) and detail inspection views (`/discover/[id]`)
- [x] Saved tools collection bookmarking (`/saved`)
- [x] NextAuth.js v5 authentication with session protection

## Phase 10 — Conversational Assistant & Polish
- [x] Build **AURA Assistant Chatbot Copilot** drawer (`AuraAssistantModal.tsx`)
- [x] Implement `/api/assistant` supporting conversational retrieval and tool comparisons
- [x] Add side-by-side tool comparison matrices with budget winner highlights
- [x] Implement 1-click in-chat tool bookmarking and horizontal follow-up prompt carousel
- [x] Embed live **AURA Neural Recommendation Core Diagnostics** in Settings (`/settings`)
- [x] Integrate native CSS View Transitions API for smooth theme switching
- [x] Configure NextAuth secret handling and disable Next.js development overlay badges
- [x] Publish to GitHub: `https://github.com/Pratik50205/AURA.ai`
