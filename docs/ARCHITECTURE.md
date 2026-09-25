# AURA: The Intelligence Layer
### Autonomous AI Tool Discovery & Neural Recommendation Engine
**Major Project Technical Architecture & Presentation Guide**

---

## 📋 Executive Summary

**AURA (AI/ML Intelligence Layer)** is an enterprise-grade, two-stage Information Retrieval (IR) and neural recommendation system. It solves a fundamental problem in AI tool discovery: **users do not know exact technical names or formal descriptions of AI tools; they describe their needs in natural, conversational, informal, and often grammatically flawed language.**

Instead of relying on rigid keyword matching (like traditional SQL or basic search bars), AURA translates human intent into high-dimensional vector representations, retrieves semantic candidate tools in sub-milliseconds, and scores them using a supervised neural ranking model.

---

## 📌 Project Specifications & Technical Inventory

### 1. 🤖 Machine Learning Models Used

| Role | Exact Model Identifier | Architecture / Type | Parameters / Dims | Primary Responsibility |
| :--- | :--- | :--- | :--- | :--- |
| **Semantic Embedding (Bi-Encoder)** | `sentence-transformers/all-MiniLM-L6-v2` | Transformer / BERT-based | 22.7M parameters / **384-dimensional** dense vectors | Converts user query and tool metadata into dense semantic vectors |
| **Vector Search Engine** | Meta FAISS (`IndexFlatIP`) | Dense Vector Index | 108 vectors $\times$ 384 dimensions | Fast cosine similarity candidate retrieval in **< 1 ms** |
| **Learned Ranker (Supervised)** | Custom PyTorch MLP (`models/mlp_ranker.pt`) | Deep Neural Network (`10 → 64 → 32 → 1`) | ~3,000 weights (ReLU, Dropout, Sigmoid) | Scores candidates using 8 domain & quality features |
| **Cross-Encoder Reranker (Stage 2)** | `cross-encoder/ms-marco-MiniLM-L-6-v2` | Transformer Cross-Encoder | 22.7M parameters | Performs full token cross-attention between query and candidate text |

---

### 2. 📊 Dataset & Corpus Statistics

| Metric | Exact Count | Description |
| :--- | :--- | :--- |
| **Total Curated AI Tools** | **108 tools** | Fully normalized, enriched records in `data/processed/aura_tools.json` |
| **Categories Covered** | **23 categories** | Video Generation, Image Editing, Audio & Voice, Code Assistant, Productivity, Music, etc. |
| **Natural Language Queries** | **500+ queries** | Diverse phrasing, beginner queries, and complex intents in `aura_queries.json` |
| **Relevance Annotations (Qrels)** | **1,000+ pairs** | Graded relevance judgments (0 to 3 scale) in `aura_qrels.json` |
| **Training Split** | **641 pairs (70%)** | Used to train the PyTorch MLP Ranker with hard negative mining |
| **Validation Split** | **140 pairs (15%)** | Used for early stopping and hyperparameter tuning |
| **Held-out Test Benchmark** | **30 queries (15%)** | Strictly isolated for scientific evaluation and ablation studies |

---

### 3. 🌐 APIs & Serving Endpoints

| Endpoint | Method | Request Payload / Params | Response | Description |
| :--- | :---: | :--- | :--- | :--- |
| `/health` | `GET` | None | `{"status": "ok"}` | Service health probe |
| `/recommend` | `GET` | `?query=string&top_k=int` | JSON `RecommendResponse` | Quick URL-based query recommendation |
| `/recommend` | `POST` | `{"query": "...", "top_k": 5, "use_reranker": false}` | JSON `RecommendResponse` | Production recommendation endpoint |
| `/docs` | `GET` | None | Interactive Swagger HTML | OpenAPI 3.0 interactive documentation |

---

### 4. 🛠️ Complete Technology Stack & Methodologies

#### A. Core Technologies & Frameworks

| Technology / Library | Version / Role | Why It Was Chosen |
| :--- | :--- | :--- |
| **Python** | `3.13 / 3.14` | Core language for the AI/ML pipeline, data science libraries, and backend serving. |
| **PyTorch (`torch`)** | Deep Learning Framework | Used to construct, train, and run inference for the custom 3-layer MLP neural ranker. |
| **Hugging Face `sentence-transformers`** | Neural Embedding Framework | State-of-the-art framework for dense vector encoding and cross-encoder reranking. |
| **Meta FAISS (`faiss-cpu`)** | Vector Search Engine | Industry-standard vector indexing engine optimized by Meta for microsecond nearest-neighbor search. |
| **FastAPI** | REST API Framework | High-performance, lightweight web framework with automatic OpenAPI/Swagger documentation. |
| **Pydantic v2** | Data Validation & Contracts | Enforces strict type validation and input/output contracts for tool records and API payloads. |
| **Uvicorn** | ASGI Web Server | Production-ready asynchronous server for hosting the FastAPI recommendation engine. |
| **NumPy** | Numerical Computing | Vector math, matrix slicing, and efficient binary storage (`.npy`) of embeddings. |
| **Rank-BM25** | Classical IR Library | Implements the Okapi BM25 keyword algorithm as a baseline benchmark comparison. |
| **PyYAML** | Configuration Management | Parses `configs/config.yaml` for centralized model hyperparameters, thresholds, and paths. |
| **Pytest** | Testing Framework | Automated testing framework verifying data pipelines, schemas, and IR metrics (34 tests). |

---

#### B. Machine Learning & Information Retrieval Methodologies Used

1. **Two-Stage Retrieve-and-Rerank Architecture:**
   - **Stage 1 (Coarse Retrieval):** Reduces the search space from $N$ tools to top-20 candidates using lightweight Bi-Encoder vectors and FAISS in $< 1\text{ ms}$.
   - **Stage 2 (Fine Ranking):** Evaluates rich interaction features (ratings, trust scores, pricing, and deep cross-attention) on only the top candidates to produce the final top-5 ranking.
2. **Dense Semantic Embedding (Bi-Encoder):**
   - Encodes text into 384-dimensional continuous vector space where semantically similar items are mathematically close, regardless of exact word overlap.
3. **Normalized Cosine Similarity:**
   - Uses L2-normalization so that the dot product (Inner Product) directly equals cosine similarity:
     $$\text{Cosine Similarity} = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \|\mathbf{v}\|_2} = \mathbf{u}_{\text{norm}} \cdot \mathbf{v}_{\text{norm}}$$
4. **Hard Negative Mining:**
   - Instead of training only on obvious negatives (e.g. comparing a video editor with a legal contract tool), the dataset includes *hard negatives* (tools in the same category that do not satisfy the specific query intent) to force the ranking model to learn subtle differences.
5. **Non-Destructive Query Expansion with Word Boundaries (`\b`):**
   - Preprocesses informal user queries using regular expressions with `\b` word boundaries to expand ambiguous abbreviations (`ppt` $\rightarrow$ `presentation slides ppt`) without false-positive alterations on standard English words.
6. **Information Retrieval Benchmarking (Precision@K, Recall@K, MRR, NDCG@K):**
   - Uses standard academic ranking metrics to evaluate retrieval performance against classical BM25 baselines.

---

### 5. ⚡ Runtime & Latency Profile (CPU-Optimized)

- **Vector Search (FAISS):** **< 1.0 ms**
- **Embedding Generation:** **~20–30 ms** on standard CPU
- **End-to-End Warm Query Latency:** **~35–50 ms**
- **Test Suite Pass Rate:** **34/34 tests passed** in **0.48 seconds**
- **Hardware Requirement:** **CPU-only** (no expensive GPU required)

---

## 🎯 Problem Statement & Motivation

### The Problem with Traditional Discovery:
1. **Vocabulary Mismatch (Lexical Gap):** A user searching for `"fix blurry picture of face"` will get zero results in a traditional database if the tool describes itself as *"AI image restoration and super-resolution upscaler"*.
2. **Abbreviation & Slang Blindness:** Users frequently type shorthand like `"ppt"`, `"bg"`, `"vids"`, or `"voiceover"`. Traditional databases fail completely unless exact keywords match.
3. **No Multi-Criteria Understanding:** A user asking for `"edit voice and video both"` requires an engine that can surface all-in-one multimedia tools (`Descript`), rather than returning only audio or only video tools.
4. **Cold-Start & OOV (Out-Of-Vocabulary):** New, unseen queries must be understood immediately without manual rules.

### The AURA Solution:
A **Two-Stage Hybrid AI/ML Pipeline**:
- **Stage 1: Semantic Dense Retrieval (Bi-Encoder + FAISS Vector Index):** Filters the entire catalogue down to the top-20 conceptual candidates in under 5ms.
- **Stage 2: Learned Ranking & Cross-Encoder Scoring:** Re-scores candidates based on semantic relevance, metadata trust scores, user ratings, and feature interactions.

---

## 🏗️ End-to-End System Architecture

```
                                USER QUERY
          (e.g., "i ppt make edit tool" or "remove bg from car pic")
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. QUERY PREPROCESSING & EXPANSION LAYER                                │
│    • Regex Word-Boundary Normalization (\b)                             │
│    • Domain Abbreviation Expansion ("ppt" -> "presentation slides ppt")  │
│    • Preservation of original syntax without false-positives            │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. BI-ENCODER SEMANTIC EMBEDDING ENGINE                                 │
│    • Model: sentence-transformers/all-MiniLM-L6-v2 (22.7M parameters)   │
│    • Converts text into a 384-dimensional dense semantic vector         │
│    • L2-Normalized for Cosine Similarity                                │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. HIGH-SPEED VECTOR SEARCH (FAISS)                                     │
│    • Meta FAISS (IndexFlatIP — Inner Product / Cosine Distance)         │
│    • Compares query vector against 108 pre-indexed tool vectors         │
│    • Output: Top-20 candidate AI tools (Sub-millisecond latency)        │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 4. STAGE 2: LEARNED RANKING (MLP RANKER / CROSS-ENCODER)                │
│    • PyTorch Multi-Layer Perceptron (10 -> 64 -> 32 -> 1)               │
│    • Combines 8 features: semantic score, popularity, trust, ratings   │
│    • Optional: Cross-Encoder (ms-marco-MiniLM-L-6-v2) for deep attention │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 5. RESPONSE FORMULATION & SERVING                                       │
│    • Formats structured JSON / CLI cards                                │
│    • Enriches with tool name, category, direct URL, and dynamic reason  │
│    • Average Warm Latency: ~30–50 ms                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🧠 Core Intelligence Layer Components

### 1. Query Preprocessing & Safe Expansion
- **Source File:** `src/inference/recommend.py`
- **Role:** Bridges the vocabulary gap between casual user queries and curated tool descriptions.
- **Safety Mechanism:** Uses strict regex word boundaries (`\b`) to ensure standard English words are never corrupted by partial substring matches.

#### Expansion Rules & Boundary Safety Matrix:

| Raw Abbreviation | Regex Pattern | Expanded Replacement | Target Domain | Protected Unmodified Words |
| :--- | :--- | :--- | :--- | :--- |
| `ppt`, `pptx` | `r"\bppt[xs]?\b"` | `ppt presentation slides` | Presentations | `appoint`, `prompt` |
| `deck`, `decks` | `r"\bdeck[s]?\b"` | `pitch deck presentation slides` | Presentations | `deckchair`, `reckless` |
| `bg` | `r"\bbg\b"` | `background` | Image Editing | `background` (not doubled) |
| `pic`, `pics` | `r"\bpics?\b"` | `picture photo` | Image / Graphics | `pick`, `pickle`, `picture` |
| `pfp` | `r"\bpfp\b"` | `profile picture avatar photo` | Avatars / Social | `pfp` (standalone only) |
| `vid`, `vids` | `r"\bvids?\b"` | `video` | Video Editing | `david`, `video` |
| `sub`, `subs` | `r"\b(sub\|subs)\b"` | `subtitles captions` | Video Subtitles | `subscribe`, `subway`, `submarine` |
| `vo` | `r"\bvo\b"` | `voiceover voice speech` | Audio & Voice | `voice`, `volume`, `evolve` |
| `tts` | `r"\btts\b"` | `text to speech voice generation` | Audio & Voice | `battery`, `attraction` |
| `stt` | `r"\bstt\b"` | `speech to text audio transcription` | Transcription | `state`, `station` |
| `cv` | `r"\bcv\b"` | `resume cv` | Career / Writing | `canvas`, `civil`, `cover` |
| `ui`, `ux` | `r"\b(ui\|ux)\b"` | `ui/ux user interface design` | UI/UX Design | `build`, `quick`, `flux` |

---

### 2. Semantic Document Enrichment
- **Source File:** `src/data/enrich.py`
- **Role:** Converts raw JSON tool records into dense, multi-field semantic documents before embedding.
- **Format Structure:**
  ```text
  Tool: [Tool Name]
  Category: [Category]
  Description: [Detailed capability overview]
  Tags: [Comma-separated functional keywords]
  Key features: [Core technical capabilities]
  Use cases: [Real-world scenarios]
  Target users: [Intended professional roles]
  Strengths: [Pros and advantages]
  ```

---

### 3. Bi-Encoder Semantic Embedding Engine
- **Source File:** `src/retrieval/embed.py`
- **Model:** `sentence-transformers/all-MiniLM-L6-v2`
- **Architecture:** 6-layer Transformer, 12 attention heads, 384 hidden dimensions.
- **Weights:** 22.7 Million parameters.
- **Output:** Normalized float32 vector $\mathbf{v} \in \mathbb{R}^{384}$.
- **Design Rationale:** Designed for fast CPU inference (~15–20ms per sentence) while preserving high semantic fidelity.

---

### 4. Vector Database & Candidate Retrieval (FAISS)
- **Source File:** `src/retrieval/index.py`
- **Engine:** Meta FAISS (`IndexFlatIP`).
- **Mathematical Operation:** Cosine similarity via Inner Product of L2-normalized vectors:
  $$\text{sim}(\mathbf{q}, \mathbf{d}) = \mathbf{q}^T \mathbf{d} = \sum_{i=1}^{384} q_i \cdot d_i$$
- **Index Dimensions:** $108 \times 384$.
- **Latency:** **$< 1.0\text{ ms}$** to search the entire index.
- **Output:** Top-20 candidate tools passed to Stage 2.

---

### 5. Supervised Neural Ranking Model (PyTorch MLP)
- **Source Files:** `src/ranking/train.py`, `src/ranking/features.py`
- **Network Architecture:**
  - Input Layer: 8 dense features
  - Hidden Layer 1: 64 neurons + ReLU + Dropout(0.2)
  - Hidden Layer 2: 32 neurons + ReLU + Dropout(0.2)
  - Output Layer: 1 neuron + Sigmoid $\rightarrow \hat{y} \in [0, 1]$

#### Feature Engineering Specification (8 Features):

| # | Feature Name | Data Type | Range | Description & Purpose |
| :-: | :--- | :---: | :---: | :--- |
| **1** | `semantic_score` | Float | `[0.0, 1.0]` | Cosine similarity score produced by FAISS retrieval. |
| **2** | `trust_score` | Float | `[0.0, 1.0]` | Tool reputation and reliability index from metadata. |
| **3** | `user_rating` | Float | `[0.0, 1.0]` | Normalized community star rating (e.g. 4.8 / 5.0 = 0.96). |
| **4** | `category_match` | Binary | `{0, 1}` | 1 if query mentions category keywords; 0 otherwise. |
| **5** | `tag_overlap_count`| Float | `[0.0, 1.0]` | Normalized intersection between query tokens and tool tags. |
| **6** | `pricing_tier` | Ordinal | `{0.0, 0.5, 1.0}` | Encodes Free (1.0), Freemium (0.5), or Paid (0.0). |
| **7** | `feature_density` | Float | `[0.0, 1.0]` | Normalized count of key features provided by the tool. |
| **8** | `text_length_ratio`| Float | `[0.0, 1.0]` | Ratio of query token count to tool documentation length. |

---

### 6. Query Lifecycle: Step-by-Step Execution Journey

| Step | Component | Input | Transformation / Action | Output | Latency |
| :-: | :--- | :--- | :--- | :--- | :-: |
| **1** | **Query Normalizer** | `"i ppt make edit tool"` | Regex word-boundary expansion | `"i ppt presentation slides make edit tool"` | $< 0.1\text{ ms}$ |
| **2** | **Embedding Engine** | Expanded text query | `all-MiniLM-L6-v2` tokenization & encoding | 384-dimensional float vector | ~20 ms |
| **3** | **FAISS Index** | 384-D Query vector | Cosine similarity dot-product across 108 tools | Top-20 Candidate IDs + Scores | $< 1.0\text{ ms}$ |
| **4** | **Feature Extractor** | Top-20 candidates + query | Compute 8 feature vectors | $(20, 8)$ feature matrix | ~2.0 ms |
| **5** | **Neural Ranker** | $(20, 8)$ feature matrix | Forward pass through trained PyTorch MLP | Ranked candidate list | ~1.5 ms |
| **6** | **Response Builder** | Ranked candidate list | Enrich with category, URL, dynamic reason | Formatted JSON / Terminal Card | $< 0.5\text{ ms}$ |
| | **Total End-to-End** | | | **Top-5 Recommended AI Tools** | **~25–45 ms** |

---

## 📁 Repository Structure & Directory Roles

```
aura-ai-ml/
├── main.py                      # Interactive CLI terminal application (<50ms query loop)
├── intelligence_layer.md        # Complete technical reference (this document)
├── pyrightconfig.json           # Python static analysis & IDE typing configuration
├── requirements.txt             # Project dependencies (PyTorch, FAISS, Transformers)
├── README.md                    # Quick-start guide and repository overview
├── walkthrough.md               # Execution log and benchmark verification
│
├── configs/
│   └── config.yaml              # Central system configuration (models, paths, thresholds)
│
├── data/
│   ├── raw/                     # Raw initial tool dumps
│   ├── processed/               # Canonical AURA dataset
│   │   ├── aura_tools.json      # 108 curated AI tools with rich metadata
│   │   ├── aura_queries.json    # 500+ diverse evaluation queries
│   │   ├── aura_qrels.json      # 1000+ query-tool relevance judgments (0 to 3)
│   │   └── aura_pairs.json      # Triplet training pairs with hard negatives
│   ├── train/                   # 70% Training split
│   ├── validation/              # 15% Validation split
│   ├── test/                    # 15% Held-out benchmark test split
│   ├── embeddings/              # Persisted numpy embeddings (tool_embeddings.npy)
│   └── indexes/                 # Serialized FAISS index (faiss.index)
│
├── src/
│   ├── data/
│   │   ├── enrich.py            # Builds semantic documents from tool records
│   │   ├── normalize.py         # Text, URL, tag, and schema sanitation
│   │   ├── validate.py          # Data contract verification & schema checks
│   │   └── split.py             # Leakage-free train/val/test data splitting
│   ├── retrieval/
│   │   ├── embed.py             # AuraEmbedder (SentenceTransformers encoding)
│   │   ├── index.py             # AuraIndex (FAISS creation and persistence)
│   │   ├── retrieve.py          # AuraRetriever (Query vector search)
│   │   └── bm25_baseline.py     # Classical BM25 baseline retriever for comparison
│   ├── ranking/
│   │   ├── features.py          # Feature extraction pipeline (8 dense features)
│   │   ├── train.py             # PyTorch MLP training script
│   │   ├── predict.py           # Learned ranker inference
│   │   └── rerank.py            # AuraReranker (Cross-Encoder deep re-scoring)
│   ├── evaluation/
│   │   ├── metrics.py           # Precision@K, Recall@K, MRR, NDCG@K formulas
│   │   └── evaluate.py          # Automated experiment comparison runner
│   ├── inference/
│   │   ├── recommend.py         # Main clean inference interface + query expansion
│   │   └── api.py               # Production FastAPI REST application
│   └── utils/
│       └── config.py            # Path resolution and YAML configuration loader
│
├── models/
│   └── mlp_ranker.pt            # Trained PyTorch neural ranking model weights
│
└── tests/
    ├── test_data.py             # Data normalization & enrichment tests
    └── test_metrics.py          # Information retrieval metric unit tests
```

---

## 📊 Scientific Evaluation & Benchmark Results

The system was evaluated on a held-out benchmark of **30 ground-truth test queries** (`src/evaluation/evaluate.py`) across 3 distinct architectural experiments:

| Metric | Experiment 0: BM25 Keyword Baseline | Experiment 1: Semantic Retrieval (FAISS) | Experiment 2: Semantic + Cross-Encoder |
| :--- | :---: | :---: | :---: |
| **P@1 (Precision @ 1)** | 63.3% | **83.3%** | 76.7% |
| **P@5 (Precision @ 5)** | 32.0% | **38.7%** | 36.7% |
| **R@5 (Recall @ 5)** | 70.3% | **78.9%** | **79.5%** |
| **MRR (Mean Reciprocal Rank)** | 0.770 | **0.873** | 0.867 |
| **NDCG@5 (Ranking Quality)** | 0.684 | 0.774 | **0.777** |
| **Inference Latency (CPU)** | **0.7 ms** | **32.5 ms** | 519.0 ms |

### Key Takeaway for Your Presentation:
- **Semantic Vector Retrieval beats BM25 by +20% on Top-1 Accuracy** (83.3% vs 63.3%), proving that neural embeddings are vastly superior to keyword search for conversational user queries.
- **Pure Semantic FAISS achieves the optimal trade-off**: 83.3% P@1 with only **~32 ms** latency, making it the ideal primary production model.

---

## 💻 How to Run and Demonstrate the System

### 1. Interactive Terminal Mode (Best for Live Viva / Demo)
Runs in a continuous loop with models kept in RAM:
```pwsh
python main.py
```
- **Experience:** Type queries continuously at the `Query: ` prompt.
- **Latency:** **~30–50ms** per query after instant one-time initialization.
- **To Exit:** Type `exit` or `q`.

### 2. Single Command CLI
Run a single query directly:
```pwsh
python -m src.inference.recommend "i need to remove backgrounds from pictures"
```

### 3. Production REST API Server
Start the FastAPI server:
```pwsh
python -m uvicorn src.inference.api:app --reload --port 8000
```
- **Interactive Swagger Documentation:** Open browser at `http://localhost:8000/docs`
- **Health Check:** `http://localhost:8000/health`
- **HTTP GET Recommendation:**
  ```
  http://localhost:8000/recommend?query=generate+AI+videos+from+text&top_k=3
  ```

### 4. Run Automated Unit Tests
Verify pipeline integrity (all 34 tests pass):
```pwsh
python -m pytest
```

### 5. Run Experiment Benchmarks
Reproduce the research paper comparison metrics table:
```pwsh
python -m src.evaluation.evaluate
```

---

## 📥 Input & Output Specifications

### Input Schema
- **Input Type:** Freeform natural language string.
- **Supports:** Technical keywords, full sentences, questions, typos, informal slang, and multi-intent queries.

### Output Schema (JSON)
```json
{
  "query": "i ppt make edit tool",
  "results": [
    {
      "rank": 1,
      "tool_id": "t14",
      "name": "Tome",
      "category": "Productivity",
      "description": "AI-powered presentation and storytelling tool that generates entire presentations from prompts...",
      "url": "https://tome.app",
      "semantic_score": 0.5195,
      "reranker_score": null,
      "ranking_score": null,
      "reason": "Tome (Productivity): AI-powered presentation and storytelling tool that generates entire presentations from prompts..."
    },
    {
      "rank": 2,
      "tool_id": "t15",
      "name": "Gamma",
      "category": "Productivity",
      "description": "AI presentation maker that creates polished presentations, documents, and webpages from text prompts...",
      "url": "https://gamma.app",
      "semantic_score": 0.4980,
      "reranker_score": null,
      "ranking_score": null,
      "reason": "Gamma (Productivity): AI presentation maker that creates polished presentations..."
    }
  ],
  "model_version": "aura-retriever-v1",
  "latency_ms": 42.1,
  "num_candidates_considered": 20
}
```

---

## 🎤 Guide & Viva Defense Questions (Cheat Sheet)

Use these exact answers during your project review or presentation:

#### Q1: "Why didn't you just use a standard SQL database with `LIKE %query%` or Elasticsearch?"
> **Answer:** SQL `LIKE` and traditional search require exact keyword overlap. If a user types *"erase unwanted people from photo"*, an SQL query returns zero records because the tool's description says *"AI object inpainting"*. Our intelligence layer uses dense vector embeddings that understand mathematical synonymy and intent, returning the correct tool regardless of vocabulary mismatch.

#### Q2: "Why is it called a Two-Stage Retrieval pipeline?"
> **Answer:** In modern information retrieval (used by Google, Pinterest, and YouTube), comparing a query against millions of documents with a heavy neural network is too slow. Stage 1 uses a lightweight Bi-Encoder and FAISS to quickly prune the search space down to the top-20 candidates in under 5ms. Stage 2 applies a deeper MLP Ranker or Cross-Encoder on only those 20 candidates to optimize precision.

#### Q3: "Does the model learn automatically in real time from new queries?"
> **Answer:** No model safely updates weights in real time during live search due to the risk of *Catastrophic Forgetting* and adversarial input poisoning. Instead, AURA uses an **Active Learning Feedback Loop**: live search queries and user click-throughs are logged into dataset pools, and the MLP Ranker is retrained periodically in an offline supervised pipeline.

#### Q4: "How does AURA handle casual slang or abbreviations like 'ppt' or 'bg'?"
> **Answer:** We implemented a boundary-safe, non-destructive **Query Preprocessing & Expansion Layer** using regular expressions with `\b` word boundaries. It expands ambiguous abbreviations (e.g. `ppt` $\rightarrow$ `ppt presentation slides`) before vector encoding, ensuring high semantic recall without altering standard English words.

#### Q5: "What loss function and optimizer did you use to train the MLP Ranker?"
> **Answer:** We used Binary Cross-Entropy Loss (`BCELoss`) with the Adam optimizer (`lr=0.001`, weight decay `1e-4`). The training data includes positive relevance pairs and mined hard negatives (tools in the same category that are not relevant to the specific query).

#### Q6: "How does the AURA Assistant Chatbot work, and how is it different from standard search?"
> **Answer:** Rather than just returning an isolated list of links, the AURA Assistant acts as a conversational discovery copilot. It parses user intent, detects side-by-side comparison requests (e.g. *"Compare Cursor vs Copilot"*), executes semantic vector search through FAISS, and dynamically constructs a side-by-side comparison matrix with verified trust scores, pricing models, and budget winners directly inside the conversation.

#### Q7: "How does AURA achieve sub-40 millisecond response times in production?"
> **Answer:** We pre-warm the SentenceTransformer model and mount the normalized FAISS `FlatIP` index directly into RAM on ASGI server startup (`@app.on_event('startup')`). Because vector distance calculations occur purely in memory without disk I/O or cold-start model weights loading, query processing executes in ~32ms.

---

*Document prepared for AURA Major Project Presentation & Viva Defense.*
*Official GitHub Repository: https://github.com/Pratik50205/AURA.ai*

