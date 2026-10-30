# AURA AI/ML — Master Development Task Tracker

## Phase 1 — Project Setup & Architecture
- [x] Create project directory structure (`docs/`, `intelligence/`, `web/`, `scripts/`)
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

## Phase 11 — Enterprise Containerization & Resilience
- [x] Create multi-stage Dockerfiles (`web/Dockerfile` and `intelligence/Dockerfile`)
- [x] Orchestrate with Docker Compose (`docker-compose.yml`)
- [x] Configure persistent SQLite storage volume (`aura-web-data`) for accounts, bookmarks, and reviews
- [x] Pre-cache `sentence-transformers/all-MiniLM-L6-v2` in Docker image for 0s cold-starts and 100% offline boots
- [x] Map port `8000:8000` (FastAPI) and port `3000:3000` (Next.js) for external testing

## Phase 12 — Hybrid Retrieval & Production Guardrails
- [x] `src/retrieval/retrieve.py` — Hybrid Dense FAISS + Sparse BM25 Fusion using Reciprocal Rank Fusion (RRF)
- [x] `src/inference/recommend.py` — Multi-signal intent scoring calibrated with lexical BM25 boosts and dual-retrieval consensus
- [x] `web/src/lib/cache.ts` — Generic Bounded LRU Cache (`BoundedLruCache`) with TTL and max size limits
- [x] `web/src/lib/rate-limit.ts` — Sliding-window rate limiter protecting `/api/recommend` and `/api/assistant`

## Phase 13 — UI Redesign Harmonization & Modern Navigation
- [x] Unified landing page and application theme with modern glassmorphism design system
- [x] Removed redundant dashboard tab in favor of direct `/discover` exploration flow
- [x] Windows command spotlight shortcut (`Ctrl+K` on Windows/Linux, `Cmd+K` on macOS)
- [x] Floating spotlight search modal (`SearchSpotlightModal.tsx`) with full text visibility, prompt acceptance, category quick-jump, and direct discovery actions
- [x] Blank-by-default 3-slot side-by-side comparison drawer (no preset clutter)
- [x] Expanded enterprise Admin console (`/admin`, `/api/admin/stats`, `/api/admin/users`) with real-time telemetry, user management, audit activity logs, and system health status

## Phase 14 — Precision Chatbot & Multi-Provider AI Brain
- [x] `web/src/lib/assistantEngine.ts` — Strict zero-spam intent separation: direct, accurate answers for Math (`25 * 14 = 350`), Science (e.g. Photosynthesis equations), Code (Python string slicing, syntax copyable blocks), and General QA without forced tool recommendations
- [x] `web/src/lib/llmBrain.ts` — Multi-provider AI Brain architecture supporting Google Gemini (`gemini-1.5-flash`), Groq (`llama-3.3-70b-versatile`), OpenAI (`gpt-4o-mini`), Ollama (`llama3` / local models), and Built-in heuristic fallback
- [x] `web/src/components/AuraAssistantModal.tsx` — In-modal "Configure AI Brain Model" slide-over drawer with live API key testing, localStorage persistence, and status indicators

## Phase 15 — Production Docker Containerization & Networking
- [x] `docker-compose.yml` updated with explicit bridge network (`aura-network`), safe secret fallback, and automated health checks
- [x] Added `host.docker.internal:host-gateway` and `OLLAMA_BASE_URL` enabling containerized web app to connect to host-level Ollama instances
- [x] Forwarded LLM Brain API keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `GROQ_API_KEY`) into container environment
- [x] `web/Dockerfile` enhanced with `libc6-compat` and `openssl` for Prisma LibSQL engine on Alpine, plus automatic database seeding
- [x] `intelligence/Dockerfile` updated with `curl`, `libgomp1`, and pre-cached transformer embeddings for instant offline boot
