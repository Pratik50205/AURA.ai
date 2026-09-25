# AURA AI/ML — Implementation & Model Verification Walkthrough

The **AURA (Autonomous Tool Discovery & Ranking System)** model pipeline has been executed, trained, benchmarked, and verified end-to-end on CPU.

---

## 🎯 Model Execution & Verification Summary

### 1. ⚡ Embedding Generation (`src/retrieval/embed.py`)
- **Model**: `sentence-transformers/all-MiniLM-L6-v2` (384-dimensional dense vectors).
- **Tools Embedded**: All **108 real AI tools**.
- **Output**: Array of shape `(108, 384)` saved to `data/embeddings/tool_embeddings.npy`.

### 2. 🔍 FAISS Vector Indexing (`src/retrieval/index.py`)
- **Index Type**: FAISS `IndexFlatIP` (Inner Product for normalized cosine similarity).
- **Vectors Indexed**: 108 tool embeddings.
- **Output**: Saved to `data/indexes/faiss.index`.

### 3. 🧠 MLP Ranker Training (`src/ranking/train.py`)
- **Architecture**: 3-layer PyTorch MLP (`[10 -> 64 -> 32 -> 1]`).
- **Dataset**: 641 training samples, 140 validation samples.
- **CPU Training**: 50 epochs with early stopping (`val_loss = 0.1200`).
- **Output**: Trained weights saved to `models/mlp_ranker.pt`.

---

## 📊 Benchmark Evaluation Report (`src/evaluation/evaluate.py`)

Evaluation was conducted on the **30 test queries** from the leakage-free test split across 3 experimental setups:

| Experiment | P@1 | P@5 | R@5 | MRR | NDCG@5 | Latency (ms) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **BM25 Baseline** | 0.633 | 0.320 | 0.703 | 0.770 | 0.684 | **0.9 ms** |
| **Semantic Retrieval (Embedding + FAISS)** | **0.833** | **0.387** | **0.789** | **0.873** | **0.774** | **32.5 ms** |
| **Semantic + Cross-Encoder Reranking** | 0.767 | 0.367 | **0.795** | 0.867 | **0.777** | 527.6 ms |

---

## 🚀 Live Recommendation Test Output (`src/inference/recommend.py`)

**Query**: `"I need an AI tool for writing python code and autocompletion"`

```text
  #1 Codeium (score: 0.7447)
     Codeium (Code Assistant): Free AI code completion tool supporting 70+ programming languages. Offers intelligent autocomplete...

  #2 GitHub Copilot (score: 0.6927)
     GitHub Copilot (Code Assistant): AI pair programmer by GitHub that suggests code completions, functions, and entire code blocks...

  #3 Tabnine (score: 0.6084)
     Tabnine (Code Assistant): AI code assistant providing intelligent code completions trained on permissively licensed code...

  #4 Replit AI (score: 0.5773)
     Replit AI (Code Assistant): AI-powered coding assistant integrated into Replit's browser-based IDE...

  #5 Cursor (score: 0.5606)
     Cursor (Code Assistant): AI-first code editor built on VS Code that integrates powerful AI coding assistance directly...
```

---

## 🧪 Unit Test Suite Verification

All **34 unit tests** passed cleanly in 0.41 seconds:

```text
============================= 34 passed in 0.41s ==============================
```

---

## ⚡ Query Preprocessing & Domain Expansion

To prevent false negatives on colloquial abbreviations (such as `"ppt"`, `"bg"`, `"cv"`), a boundary-enforced non-destructive query expansion layer was added to `src/inference/recommend.py`:
- `\bppt[xs]?\b` $\rightarrow$ `ppt presentation slides`
- `\bbg\b` $\rightarrow$ `background`
- `\bcv\b` $\rightarrow$ `resume cv`
- `\b(sub|subs)\b` $\rightarrow$ `subtitles captions`
- `\b(tts|stt|vo)\b` $\rightarrow$ voice / transcription semantics

All patterns use `\b` word boundaries to ensure normal words (`subscribe`, `canvas`, `david`) remain completely unaffected.

---

## 🛠️ Commands to Run & Serve

- **Interactive CLI (Recommended - models remain loaded in memory, ~50ms per query)**:
  ```bash
  python main.py
  ```

- **Single Query CLI**:
  ```bash
  python -m src.inference.recommend "your query here"
  ```

- **Launch Production REST API**:
  ```bash
  python -m uvicorn src.inference.api:app --reload --port 8000
  ```
  Swagger documentation accessible at `http://localhost:8000/docs`.
