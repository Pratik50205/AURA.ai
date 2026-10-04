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
| **Input** | Keywords and exact phrases | Natural language human intent & workflow context |
| **Understanding** | Lexical token matching | 384-dimensional dense semantic vector space |
| **Output** | 10 blue links, sponsored ads, SEO blogs | Verified tool cards with trust scores, pricing, and pros/cons |
| **Explainability** | None | Real-time rationale ("Why recommended: 94% semantic match, free tier") |
| **Comparison** | Open 15 browser tabs manually | Direct side-by-side comparison matrix with winner highlights |
| **AI Assistant** | None or generic web summaries | Interactive Copilot with live vector retrieval and 1-click bookmarks |

---

## Key System Features

### 1. 🤖 Interactive AURA Assistant Copilot
- **Floating AI Drawer**: Accessible across the entire platform via a persistent floating orb.
- **Natural Language Tool Discovery**: Understands informal user requirements, budget limits (*free, freemium, paid*), and difficulty level.
- **Direct Side-by-Side Comparison**: Automatically generates comparison matrices comparing pricing, trust scores, primary strengths, and budget winners (e.g., *"Compare Cursor vs GitHub Copilot"*).
- **1-Click Bookmarking**: Save tools to your workspace collection directly from inside the chat bubble.
- **Dynamic Suggested Inquiries**: Horizontal scrolling prompt chips for seamless multi-turn exploration.

### 2. ⚡ Sub-40ms Neural Retrieval Engine
- **Dense Vector Embeddings**: Pre-computed 384-dimensional embeddings generated with `sentence-transformers/all-MiniLM-L6-v2`.
- **Exact Vector Index**: Meta FAISS `FlatIP` cosine inner-product indexing in system RAM.
- **Learned Ranking**: Supervised PyTorch MLP Ranker trained on 930 graded query-tool relevance judgments.
- **Query Preprocessing**: Boundary-enforced query expansion resolving domain slang (*ppt*, *bg*, *sub*, *tts*, *cv*, *ui/ux*).

### 3. 📊 Live Engine Diagnostics & Telemetry
- Embedded in the Settings dashboard (`/settings`), providing live visibility into embedding dimensions, index parameters, catalog size, and FastAPI connection health.

### 4. 🌓 Dual-Theme System with View Transitions API
- Smooth 350ms native crossfade transitions between **Dark Obsidian** and **Clean Light** themes with zero layout shifts.

---

## System Architecture

```text
User Query (Chat or Search Bar)
       │
       ▼
┌─────────────────────────────────────────┐
│ Query Preprocessing & Slang Expansion   │  \bppt\b → presentation slides
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│ Sentence Transformer Semantic Encoding  │  all-MiniLM-L6-v2 (384-dim dense)
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│ FAISS FlatIP Vector Index Retrieval     │  Exact Cosine Search (< 2 ms)
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│ Supervised PyTorch MLP Feature Ranker   │  10 Domain Features (Quality, Trust)
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│ AURA Assistant & Comparison Matrix      │  Explainable Rationale & Actions
└─────────────────────────────────────────┘
```

---

## System Architecture & Folder Layout

The project is structured into **3 core modules**:

```text
┌─────────────────────────────────┐      REST API      ┌─────────────────────────────────┐
│       web/ (Web Application)    │ ◄────────────────► │  intelligence/ (Neural Engine)  │
│   Next.js 16 • React 19 • UI    │    (Port 8000)     │  PyTorch • FAISS • Embeddings   │
│   • Interactive Discovery       │                    │  • Sentence Transformers        │
│   • AI Assistant Chatbot Copilot│                    │  • 384-d Vector Retrieval       │
│   • Dual Theme & Settings       │                    │  • Interactive Terminal CLI     │
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

### Module Breakdown

| Directory | Core Role | Primary Technologies | Key Entry Point |
|---|---|---|---|
| **`web/`** | **Full-Stack Web App** | Next.js 16, React 19, Tailwind CSS 4, Framer Motion | Run `npm run dev` (Port 3000) |
| **`intelligence/`** | **Neural Intelligence Engine** | Python 3.14, PyTorch, FAISS, Sentence-Transformers | Run `python main.py` or FastAPI (Port 8000) |
| **`docs/`** | **Engineering Hub** | Markdown Documentation | Read `ARCHITECTURE.md` & `WALKTHROUGH.md` |
| **`scripts/`** | **Sync Utilities** | Node.js, Python | Syncs ML dataset with frontend catalog |

---

### Clean Directory Map

```text
AURA.ai/
│
├── web/                               # Web Application (Frontend + Gateway + Auth)
│   ├── src/app/                       # App Router pages (Dashboard, Discover, Saved, Settings)
│   ├── src/app/api/assistant/         # Conversational AI assistant endpoint
│   ├── src/app/api/recommend/         # Recommendations API proxy
│   ├── src/components/                # UI components (AuraAssistantModal, ToolCard, Header)
│   ├── src/data/tools.ts              # 320 verified AI tools catalog
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
| **Animations** | Framer Motion | Smooth layout transitions & drawer physics |
| **Icons** | Lucide React | Clean SVG icon set |
| **Authentication** | NextAuth.js | v5 (GitHub, Google, Credentials) |
| **Database** | Prisma ORM | LibSQL / PostgreSQL / SQLite |
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
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run Automated Unit Tests
```bash
cd intelligence
python -m pytest
```

### 4. Full-Stack Docker Deployment (Production Containerized)
Launch both the neural engine and web application together:
```bash
docker compose up -d --build
```
- Web Application: [http://localhost:3000](http://localhost:3000)
- Neural Engine Health: `http://localhost:8000/health` (internal)
- Stop Containers: `docker compose down`

---

## Repository & Links

* **GitHub Repository**: [https://github.com/Pratik50205/AURA.ai](https://github.com/Pratik50205/AURA.ai)
* **API Documentation**: `http://127.0.0.1:8000/docs`
* **Architecture Deep Dive**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
* **Model Walkthrough**: [docs/WALKTHROUGH.md](docs/WALKTHROUGH.md)

---

## License

Internal major academic project. See [docs/PRD.md](docs/PRD.md) for full dataset provenance and schema definitions.
