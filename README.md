![AURA.ai Logo](AURA.ai/public/aura-logo.svg)

# AURA.ai
**AI-Powered Semantic Tool Discovery & Recommendation Engine**

*Stop searching endlessly. Tell AURA what you need, and our semantic intelligence engine finds the most trusted AI tools instantly.*

---

## What Makes AURA Different From a Search Engine?

| | Google Search | AURA.ai |
|---|---|---|
| **Input** | Keywords → web pages | Natural language intent → structured recommendations |
| **Understanding** | Matches words | Understands meaning (semantic embeddings, 384-dim vectors) |
| **Output** | 10 blue links, ads, blogs | Ranked tools with trust scores, pricing, pros/cons |
| **Explainability** | None | "Recommended because: semantic match 94%, free tier, verified" |
| **Comparison** | Open 15 tabs manually | Side-by-side in one view |

## System Architecture

```
User Query
    │
    ▼
┌─────────────────────────────┐
│   Query Preprocessing       │  Abbreviation expansion, normalization
│   & Intent Analysis         │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│   Sentence Transformer      │  all-MiniLM-L6-v2 (384-dim embeddings)
│   Semantic Encoding         │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│   FAISS Vector Retrieval    │  FlatIP index, top-20 candidates
│   + BM25 Lexical Boost      │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│   Cross-Encoder Reranking   │  ms-marco-MiniLM-L-6-v2
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│   MLP Feature Ranker        │  10 engineered features, trained 50 epochs
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│   Explainable Top-5         │  Trust scores, reasoning, alternatives
│   Recommendations           │
└─────────────────────────────┘
```

## Project Structure

```
AURA/
├── README.md                    ← You are here
├── docker-compose.yml           ← Container orchestration
├── .env.example                 ← Environment variables template
│
├── docs/                        ← Documentation hub
│   ├── PRD.md                   ← Product Requirements Document
│   ├── ARCHITECTURE.md          ← ML pipeline deep-dive
│   ├── WALKTHROUGH.md           ← Step-by-step project walkthrough
│   └── TASK_TRACKER.md          ← Development progress tracker
│
├── aiml/                        ← AI/ML Recommendation Engine (Python)
│   ├── main.py                  ← Interactive CLI entry point
│   ├── configs/config.yaml      ← Central ML configuration
│   ├── data/
│   │   ├── processed/           ← Curated dataset (108 tools, 210 queries, 930 pairs)
│   │   ├── embeddings/          ← Pre-computed 384-dim tool vectors
│   │   ├── indexes/             ← FAISS vector search index
│   │   └── splits/              ← Train/validation/test partitions
│   ├── models/                  ← Trained MLP ranker weights
│   ├── reports/                 ← Evaluation reports & benchmarks
│   ├── src/
│   │   ├── data/                ← Data pipeline (ingest → normalize → validate → enrich → split)
│   │   ├── retrieval/           ← Semantic embedding + FAISS retrieval + BM25 baseline
│   │   ├── ranking/             ← MLP feature ranker + cross-encoder reranker
│   │   ├── evaluation/          ← IR metrics (P@K, R@K, MRR, NDCG@K)
│   │   └── inference/           ← Production recommendation API (FastAPI)
│   └── tests/                   ← Unit tests (34 passing)
│
├── AURA.ai/                     ← Frontend Web Application (Next.js)
│   ├── src/
│   │   ├── app/                 ← Next.js App Router pages
│   │   ├── components/          ← Reusable UI components
│   │   ├── data/                ← Generated tool catalog (synced from ML)
│   │   ├── hooks/               ← Custom React hooks
│   │   └── lib/                 ← Utilities, auth, recommendations
│   ├── public/                  ← Static assets (logos, icons)
│   └── prisma/                  ← Database schema & migrations
│
└── scripts/                     ← Build & maintenance utilities
    ├── sync-frontend-tools.mjs  ← Sync ML dataset → frontend catalog
    └── enrich-dataset.py        ← Data enrichment pipeline
```

## Tech Stack

| Layer | Technology |
|---|---|
| **ML Engine** | Python 3.14, PyTorch, Sentence-Transformers, FAISS, scikit-learn |
| **API** | FastAPI, Uvicorn |
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion |
| **Database** | Prisma ORM, LibSQL / Supabase |
| **Auth** | NextAuth.js v5 (GitHub, Google OAuth) |
| **Infrastructure** | Docker, Docker Compose |

## Dataset

| Asset | Count |
|---|---|
| AI Tools (curated) | 108 across 23 categories |
| Natural Language Queries | 210 (diverse formulations) |
| Relevance Judgments | 930 graded pairs (labels 0–3) |
| Train / Val / Test Split | 134 / 28 / 30 (zero leakage) |

## Evaluation Results

| Metric | Semantic Search | BM25 Baseline |
|---|---|---|
| Precision@1 | **0.833** | 0.600 |
| NDCG@5 | **0.774** | 0.521 |

## Quick Start

### ML Engine
```bash
cd aiml
pip install -r requirements.txt

# Interactive CLI with animated UI
python main.py

# REST API server
python -m uvicorn src.inference.api:app --port 8000
```

### Frontend
```bash
cd AURA.ai
npm install
npm run dev
# Open http://localhost:3000
```

### Full Stack (Docker)
```bash
cp .env.example .env
# Edit .env with your secrets
docker compose up --build
```

## License

Internal academic project. See `docs/PRD.md` for dataset provenance.
