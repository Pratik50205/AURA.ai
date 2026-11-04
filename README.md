# AURA.ai
**AI-Powered Semantic Tool Discovery & Neural Recommendation Platform**

[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/Pratik50205/AURA.ai)
[![Python 3.14](https://img.shields.io/badge/Python-3.14-green?logo=python)](https://python.org)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.1-black?logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-teal?logo=fastapi)](https://fastapi.tiangolo.com)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.6-red?logo=pytorch)](https://pytorch.org)
[![FAISS](https://img.shields.io/badge/FAISS-FlatIP-orange)](https://github.com/facebookresearch/faiss)

Stop searching endlessly through unorganized directories. Tell AURA what you need in plain, natural language, and our neural semantic engine discovers, compares, and explains the most trusted AI tools in sub-40 milliseconds.

---

## What Makes AURA Different From a Search Engine?

| Dimension | Traditional Search (e.g. Google) | AURA.ai Intelligence Platform |
|---|---|---|
| **Input** | Keywords and exact phrases | Natural language human intent & workflow context (Text or Voice) |
| **Understanding** | Lexical token matching | 384-dimensional dense semantic vector space + BM25 Fusion |
| **Output** | 10 blue links, sponsored ads, SEO blogs | Interactive Generative UI cards, trust scores, pricing, pros/cons |
| **Explainability** | None | Real-time rationale ("Why recommended: 94% semantic match, free tier") |
| **Comparison** | Open 15 browser tabs manually | Direct side-by-side matrix + Floating 4-tool compare dock |
| **AI Assistant** | Generic web summaries | Unified Copilot with multi-provider LLM brains & Generative UI |

---

## Key System Features

### 1. 🤖 Unified AI Assistant Copilot & Multi-Provider Brains
- **Multi-Provider LLM Brain (`llmBrain.ts`)**: Connect your assistant to **Google Gemini (1.5 Flash)**, **Groq (Llama 3.3 70B)**, **OpenAI (GPT-4o mini)**, or local host **Ollama (Llama 3)** with an in-modal configuration drawer and live key validation.
- **Interactive Generative UI (`GenerativeUiRenderer.tsx`)**: Replaces static plain text with dynamic visual components:
  - **Dynamic Tool Comparison Cards**: Rich feature tables with winner badges and pricing breakdowns.
  - **Step-by-Step Workflow Trees**: Multi-tool sequential pipelines with actionable steps and copyable code snippets.
  - **1-Click Actions**: Bookmarking and dock comparisons directly inside chat messages.
- **Natural Voice Input (Web Speech API)**: Microphone button with real-time waveform pulse animations, allowing natural voice queries with intelligent utterance deduplication.
- **Zero-Spam Precision Engine**: Strictly separates conversational intent — answers Math, Code (with copy button), Science, and general QA directly with zero unsolicited tool recommendations.
- **Dynamic Suggested Inquiries**: Horizontal scrolling prompt chips for seamless multi-turn exploration.

### 2. ⚡ Sub-40ms Hybrid Retrieval Engine (Dense FAISS + Sparse BM25 Fusion)
- **Dense Vector Embeddings**: 384-dimensional embeddings generated with `sentence-transformers/all-MiniLM-L6-v2`.
- **Exact Vector Index**: Meta FAISS `FlatIP` cosine inner-product indexing in system RAM.
- **Sparse Lexical Engine**: Okapi BM25 index over all tool documents for 100% exact keyword, entity, and version matching.
- **Reciprocal Rank Fusion (RRF)**: Merges dense semantic relevance and sparse keyword ranks into a unified candidate pool.
- **Learned Ranking**: Supervised PyTorch MLP Ranker trained on 930 graded query-tool relevance judgments.
- **Boundary-Enforced Expansion**: Resolves domain slang and abbreviations (*ppt*, *bg*, *sub*, *tts*, *cv*, *ui/ux*).
- **Subprocess-Free Local Semantic Fallback**: Zero-latency local vector heuristic scoring if the ML microservice is initializing.

### 3. 🔍 Floating Compare Dock & Command Spotlight (`Ctrl+K`)
- **Global Floating Compare Dock (`CompareDock.tsx`)**: Persistent comparison dock tracking up to 4 tools across Discover, Search, and Assistant, with 1-click navigation to the dedicated `/compare` matrix.
- **Command Spotlight Search**: Press `Ctrl+K` (or `Cmd+K` on Mac) for a focused, floating search spotlight accepting natural language prompts and category tags.

### 4. 🗄️ Database Persistence & Seeded Models
- **Prisma ORM Architecture**: Schema definitions for `Tool`, `Workflow`, `WorkflowStep`, `User`, `Account`, `Bookmark`, and `Review`.
- **Automated LibSQL / SQLite Seeding (`seed.mjs`)**: Seeds 320 verified tools and multi-step workflows directly into the local or cloud database.
- **Account-Synced Bookmarks (`/api/saved`)**: Synchronized cloud bookmarking for authenticated users with automatic fallback to browser localStorage for guests.

### 5. 🐳 Production Multi-Container Docker Deployment
- **Isolated Microservice Architecture**: Next.js 16 frontend and FastAPI PyTorch engine linked via internal bridge network `aura-network`.
- **Host Gateway for Ollama**: Includes `extra_hosts: ["host.docker.internal:host-gateway"]` enabling seamless communication with local host Ollama LLMs.
- **Persistent Volumes**: Named volumes `aura-web-data` (SQLite database) and `aura-model-cache` (HuggingFace vector weights).
- **Automated Healthchecks**: Automatic readiness dependency checks and startup health probing.

### 6. 📊 Live Engine Diagnostics & Dual Themes
- **Live ML Telemetry (`/settings`)**: Live visibility into embedding dimensions, index parameters, catalog size, and FastAPI connection health.
- **Dual-Theme System with View Transitions API**: Smooth 350ms native crossfade transitions between **Dark Obsidian** and **Clean Light** themes with zero layout shifts.

---

## System Architecture

```text
User Query (Text or Voice Speech)
       │
       ▼
┌───────────────────────────────────────────────┐
│ Query Preprocessing & Slang Expansion         │  \bppt\b → presentation slides
└───────────────────────┬───────────────────────┘
                        │
         ┌──────────────┴──────────────┐
         ▼                             ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│ Dense Vector Encoding   │   │ Sparse Lexical Matching │
│ all-MiniLM-L6-v2 (384d) │   │ Okapi BM25 Index        │
└────────────┬────────────┘   └────────────┬────────────┘
             │                             │
             ▼                             ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│ FAISS FlatIP Cosine     │   │ BM25 Exact Term Rank    │
│ Top-30 Semantic Match   │   │ Top-30 Keyword Match    │
└────────────┬────────────┘   └────────────┬────────────┘
             │                             │
             └──────────────┬──────────────┘
                            ▼
┌───────────────────────────────────────────────┐
│ Reciprocal Rank Fusion (RRF) Candidate Merge  │  0.6/(60+rank_d) + 0.4/(60+rank_s)
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│ Supervised PyTorch Neural MLP Ranker          │  Intent, Trust, Pricing & Quality
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│ Generative UI Copilot & Compare Matrix        │  Interactive Widgets, Workflows & Dock
└───────────────────────────────────────────────┘
```

---

## System Architecture & Folder Layout

The project is structured into **3 core modules**:

```text
┌─────────────────────────────────┐      REST API      ┌─────────────────────────────────┐
│       web/ (Web Application)    │ ◄────────────────► │  intelligence/ (Neural Engine)  │
│   Next.js 16 • React 19 • UI    │    (Port 8000)     │  PyTorch • FAISS • Embeddings   │
│   • Interactive Discovery       │                    │  • Sentence Transformers        │
│   • Generative UI AI Copilot    │                    │  • 384-d Vector Retrieval       │
│   • Floating Compare Dock       │                    │  • Interactive Terminal CLI     │
└─────────────────────────────────┘                    └─────────────────────────────────┘
                 │                                                      │
                 └───────────────────────┬──────────────────────────────┘
                                         ▼
                               ┌───────────────────┐
                               │  docs/ & scripts/ │
                               │  System Specs &   │
                               │  Synchronization  │
                               └───────────────────┘
```

### Clean Directory Map

```text
AURA.ai/
│
├── web/                               # Web Application (Frontend + Gateway + Auth)
│   ├── src/app/                       # App Router pages (Discover, Compare, Saved, Settings, Admin)
│   ├── src/app/api/assistant/         # Conversational AI assistant endpoint
│   ├── src/app/api/recommend/         # Recommendations API proxy with sub-ms local fallback
│   ├── src/app/api/saved/             # Account-synced bookmark persistence API
│   ├── src/components/                # UI components (AuraAssistantModal, CompareDock, ToolCard, Header)
│   ├── src/components/chat/           # GenerativeUiRenderer (Widgets, Workflows, Comparisons)
│   ├── src/context/                   # Global state (CompareContext for floating tool dock)
│   ├── src/data/tools.ts              # 320 verified AI tools catalog
│   ├── src/lib/llmBrain.ts            # Multi-provider client LLM brain (Gemini, Groq, OpenAI, Ollama)
│   ├── prisma/schema.prisma           # Prisma ORM schema (Tool, Workflow, Bookmark, User, Review)
│   ├── prisma/seed.mjs                # Automated LibSQL database seeding script
│   └── package.json                   # Frontend dependencies
│
├── intelligence/                      # AI/ML Neural Recommendation Engine
│   ├── main.py                        # Terminal CLI search (animated circulating cursor)
│   ├── src/inference/api.py           # FastAPI recommendation server
│   ├── src/retrieval/                 # FAISS vector indexing & SentenceTransformer embedder
│   ├── src/ranking/                   # PyTorch MLP ranker & cross-encoder
│   ├── data/processed/                # Curated dataset (320 tools, 210 queries, 930 pairs)
│   ├── tests/                         # 34 automated unit tests
│   └── requirements.txt               # Python dependencies
│
├── docs/                              # Project Documentation Hub
│   ├── ARCHITECTURE.md                # System deep-dive & Viva question cheat-sheet
│   ├── WALKTHROUGH.md                 # Step-by-step demonstration walkthrough
│   ├── PRD.md                         # Product Requirements Document
│   └── TASK_TRACKER.md                # Roadmap & task completion tracker
│
├── docker-compose.yml                 # Multi-container full-stack launcher
└── README.md                          # Main project guide
```

---

## Tech Stack Inventory

| Component | Technology | Version / Specification |
|---|---|---|
| **Neural Embedder** | Sentence-Transformers | `all-MiniLM-L6-v2` (22.7M params, 384 dims) |
| **Vector Engine** | Meta FAISS | `IndexFlatIP` (Exact cosine similarity) |
| **Ranker Model** | PyTorch | 3-layer MLP (`10 -> 64 -> 32 -> 1`) |
| **Backend API** | FastAPI / Uvicorn | Python 3.14 ASGI server |
| **Frontend Framework** | Next.js | 16.3.1 (Turbopack, App Router) |
| **UI & Styling** | React 19 / Tailwind CSS 4 | Custom glassmorphism design system |
| **Interactive Chat UI** | Generative UI Engine | Dynamic React widgets, comparison tables & workflow trees |
| **Voice Processing** | Web Speech API | Browser-native speech recognition with soundwave pulse |
| **Animations** | Framer Motion | Smooth layout transitions & drawer physics |
| **Authentication** | NextAuth.js | v5 (GitHub, Google, Credentials) |
| **Database & ORM** | Prisma ORM | LibSQL / SQLite / PostgreSQL |
| **Testing** | Pytest | 34 automated pipeline unit tests |

---

## Benchmark Evaluation Results

Evaluated across the isolated test partition of **30 natural language test queries**:

| Metric | Semantic Retrieval (AURA) | BM25 Lexical Baseline | Relative Improvement |
|---|---|---|---|
| **Precision@1** | **0.833** | 0.600 | **+38.8%** |
| **NDCG@5** | **0.774** | 0.521 | **+48.6%** |
| **Mean Reciprocal Rank (MRR)** | **0.873** | 0.770 | **+13.4%** |
| **Recall@5** | **0.789** | 0.703 | **+12.2%** |
| **Median Retrieval Latency** | **32.5 ms** | 0.9 ms | Real-time production grade |

---

## Quick Start Guide
 
### 1. Launch ML Backend (Intelligence Engine)
```bash
cd intelligence
pip install -r requirements.txt

# Run interactive terminal CLI (with animated cursor):
python main.py

# Or start the FastAPI recommendation server:
python -m uvicorn src.inference.api:app --port 8000
```
API Documentation will be live at `http://127.0.0.1:8000/docs`.

### 2. Launch Next.js Frontend (Web App)
```bash
cd web
npm install

# Seed the SQLite database with 320 tools & workflows:
node prisma/seed.mjs

# Run local development server:
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run Automated Unit Tests
```bash
cd intelligence
python -m pytest
```

### 4. Full-Stack Docker Deployment (Production Containerized)
Launch both the neural engine and web application with persistent volume storage and pre-cached AI models:
```bash
docker compose up -d --build
```
- **Web Application / Dashboard:** [http://localhost:3000](http://localhost:3000)
- **Neural API & Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Engine Health Endpoint:** [http://localhost:8000/health](http://localhost:8000/health)
- **View Container Logs:** `docker compose logs -f`
- **Stop Containers:** `docker compose down`

---

## Repository & Links

* **GitHub Repository**: [https://github.com/Pratik50205/AURA.ai](https://github.com/Pratik50205/AURA.ai)
* **API Documentation**: `http://127.0.0.1:8000/docs`
* **Architecture Deep Dive**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
* **Model Walkthrough**: [docs/WALKTHROUGH.md](docs/WALKTHROUGH.md)

---

## License

Internal major academic project. See [docs/PRD.md](docs/PRD.md) for full dataset provenance and schema definitions.
