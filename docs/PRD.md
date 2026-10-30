# AURA — AI/ML Intelligence Layer
## Product Requirements & Technical Specification for Antigravity

**Document:** AURA_AI_ML_PRD.md  
**Scope:** AI/ML intelligence layer only  
**Status:** Implementation specification  
**Primary goal:** Build AURA's intelligent tool discovery, semantic retrieval, ranking, recommendation, and AI-assistance foundation.

---

# 1. Project Overview

AURA is an AI-powered tool discovery and assistance platform.

The AI/ML layer must understand a user's natural-language requirement and identify the most relevant AI tools/APIs/services for that requirement.

Example:

> User: "I need to remove the background from a product image."

AURA should understand the intent and return relevant image-background-removal tools even if the exact words used by the user do not appear in the tool description.

The system must therefore use **semantic understanding**, not simple keyword matching.

The AI/ML layer is a separate workstream from the frontend, backend, database, authentication, and UI.

---

# 2. AI/ML Scope

## In scope

1. Tool/API metadata ingestion and normalization
2. AURA-specific dataset construction
3. Natural-language query processing
4. Query intent/capability understanding
5. Semantic text embeddings
6. Semantic vector retrieval
7. Candidate tool retrieval
8. Tool relevance ranking
9. Optional/custom MLP ranking experiments
10. Optional pretrained cross-encoder reranking experiments
11. Tool quality/trust scoring where data supports it
12. Query → tool relevance evaluation
13. Precision@K, Recall@K, MRR, NDCG@K
14. Model comparison and experiment tracking
15. Model/index persistence
16. A clean inference interface/API contract for the backend/chatbot team
17. AI-assistance logic required to turn retrieval results into structured recommendations

## Out of scope

Do NOT implement these as part of the AI/ML repository:

- Frontend UI
- React/Next.js application
- Website styling
- Authentication
- User account management
- Main application database
- Chat UI
- Payment system
- Admin dashboard
- General backend business logic
- Production API gateway
- Tool execution infrastructure

The AI/ML layer must expose a clean interface that the backend/frontend team can consume.

---

# 3. Core AURA AI/ML Pipeline

The target architecture is:

User Query
    ↓
Query Processing / Intent Understanding
    ↓
Semantic Embedding
    ↓
Vector Retrieval
    ↓
Top-N Candidate Tools
    ↓
Ranking / Re-ranking
    ↓
Quality / Trust Signals
    ↓
Top-K Recommended Tools
    ↓
Structured AI/ML Output
    ↓
Backend / Chatbot / Frontend

Do not hard-code one ranking architecture prematurely. Build a baseline first and compare ranking approaches experimentally.

---

# 4. Dataset Strategy

AURA should NOT simply use ToolBench unchanged.

Use existing public datasets as source material and transform them into an AURA-specific master dataset.

Primary candidate sources:

- ToolRet / ToolRetrieval
- ToolBench
- Other compatible public tool/API datasets where licensing permits

ToolBench is useful as a source of tool/API descriptions, tool-use instructions, retrieval data, and test-query structures.

The uploaded ToolBench README reports:
- 3,451 tools
- 16,464 APIs
- 126,486 instances
- retrieval-related data
- instruction/answer/tool-environment/test data

Use only the fields and subsets actually relevant to AURA.

Before importing any external dataset, record:
- source
- version/date
- license
- original schema
- transformation performed
- provenance

Do not assume all external datasets are interchangeable.

---

# 5. AURA Master Dataset

Create a normalized tool corpus.

## 5.1 Tool record

Recommended fields:

```json
{
  "tool_id": "T001",
  "name": "Background Remover",
  "description": "Automatically removes backgrounds from images.",
  "category": "Image Processing",
  "subcategories": [],
  "capabilities": [
    "background removal",
    "image segmentation",
    "transparent background"
  ],
  "use_cases": [
    "product photography",
    "profile images"
  ],
  "input_types": ["image"],
  "output_types": ["PNG"],
  "platform": [],
  "api_available": true,
  "url": null,
  "documentation_url": null,
  "pricing": null,
  "metadata": {}
}
```

Do not fabricate metadata. Missing fields must remain null/unknown.

## 5.2 Query dataset

```json
{
  "query_id": "Q001",
  "query": "I want to remove the background from my product image",
  "intent": "image_background_removal"
}
```

Intent labels should only be added where they can be reliably derived.

## 5.3 Relevance dataset

```json
{
  "query_id": "Q001",
  "tool_id": "T001",
  "relevance": 3
}
```

Use a consistent relevance scale. Recommended:

- 0 = irrelevant
- 1 = weakly relevant
- 2 = relevant
- 3 = highly relevant

If the source dataset only provides binary relevance, preserve the original labels rather than inventing graded labels.

## 5.4 Hard negatives

For each query, include difficult non-relevant or less-relevant tools.

Example:

```text
Query:
"Remove background from my product image"

Positive:
Background Remover

Hard negatives:
Image Editor
Image Compressor
Image Upscaler
Photo Generator
```

Hard negatives must be selected systematically, not randomly only.

---

# 6. Data Quality Requirements

Before training/evaluation:

1. Remove duplicate tools.
2. Normalize tool names.
3. Normalize categories.
4. Detect duplicate or near-duplicate descriptions.
5. Validate required fields.
6. Preserve source provenance.
7. Detect empty/low-information descriptions.
8. Remove or quarantine corrupted records.
9. Prevent train/test leakage.
10. Ensure query/tool IDs are stable.
11. Validate relevance labels.
12. Check license compatibility.

Generate a data-quality report before model training.

---

# 7. NLP / Query Understanding

The system must accept natural-language queries.

Example:

> "I need something that can turn my long PDF into editable text."

The system should derive semantic meaning rather than requiring exact keyword overlap.

Initial query processing may include:

- whitespace/format normalization
- language detection if needed
- basic normalization
- query length validation
- optional intent/capability extraction

Do NOT aggressively remove stopwords or perform destructive stemming/lemmatization before transformer encoding unless experiments show a benefit.

Preserve the original query for semantic embedding.

---

# 8. Semantic Embedding Model

Use a pretrained embedding model initially.

Primary candidate:

**BAAI/bge-m3**

Alternative baseline:

**sentence-transformers/multi-qa-mpnet-base-cos-v1**

The implementation must make the embedding model configurable.

Do not assume BGE-M3 is automatically superior. Benchmark at least one suitable baseline.

The same embedding space/compatible encoding strategy must be used for:
- user queries
- tool descriptions/documents

Create tool embeddings offline and persist them.

---

# 9. Tool Representation for Embeddings

Do not embed only the tool name.

Construct a controlled textual representation from available metadata.

Example:

```text
Tool: Background Remover
Category: Image Processing
Description: Automatically removes backgrounds from images.
Capabilities: background removal; image segmentation; transparent background
Use cases: product photography; profile images
Inputs: image
Outputs: PNG
```

Only include fields that actually exist.

Version the representation template because changing it changes the embedding index.

---

# 10. Semantic Retrieval

Initial retrieval implementation:

**Embedding model → FAISS**

Workflow:

```text
User query
    ↓
Query embedding
    ↓
FAISS similarity search
    ↓
Top-N candidates
```

Default candidate size:

- retrieve Top-20 for reranking
- make N configurable

The system must support cosine/dot-product similarity consistently with the selected embedding model.

Persist:
- FAISS index
- tool ID mapping
- embedding model name/version
- embedding representation version
- dataset version

---

# 11. Ranking / Re-ranking

Semantic retrieval provides candidates. A second stage should improve ordering.

Implement and compare:

### Baseline A
Embedding similarity only.

### Baseline B
Embedding similarity + metadata heuristics.

### Candidate C
Custom MLP ranker.

### Candidate D
Pretrained Cross-Encoder/reranker, where computational resources permit.

Do not force the MLP or Cross-Encoder into production without evaluation.

---

# 12. MLP Ranking Model

The MLP is an optional custom ML component intended to demonstrate learned relevance ranking.

Do NOT train an MLP on cosine similarity alone.

Construct features such as:

```text
query embedding
tool embedding
cosine similarity
query/tool similarity features
category compatibility
capability overlap
input/output compatibility
other validated metadata features
```

Avoid blindly concatenating very high-dimensional embeddings without checking dimensionality, memory, and overfitting.

A practical initial design can use:
- similarity features
- lower-dimensional projected embeddings
- metadata compatibility features

Example:

```text
Features
   ↓
Dense layer
   ↓
ReLU
   ↓
Dropout
   ↓
Dense layer
   ↓
ReLU
   ↓
Output relevance score
```

The exact architecture must be configurable.

Training objective may be:
- pointwise relevance prediction, or
- pairwise ranking loss

Choose based on the available labels and dataset size.

---

# 13. Cross-Encoder Experiment

Where resources permit, test a pretrained reranker such as:

**BAAI/bge-reranker-v2-m3**

Input:

```text
(query, candidate_tool_text)
```

Output:

```text relevance score
```

Use it only after first-stage retrieval.

Do not run a Cross-Encoder against the entire tool corpus because it is computationally more expensive than embedding retrieval.

---

# 14. Quality / Trust Scoring

AURA should eventually distinguish:

```text
semantic relevance
```

from:

```text
tool quality / trust
```

Do not mix them into one arbitrary score without evidence.

Maintain separate signals initially:

```text
semantic_score
ranking_score
quality_score
trust_score
```

Only combine them into a final recommendation score after defining and validating the weighting.

Possible quality signals, only when reliable data exists:

- verified status
- documentation completeness
- availability
- popularity
- user ratings
- reliability
- pricing
- privacy/security information

Never fabricate ratings, reliability, verification, or security information.

---

# 15. Evaluation

Evaluation is mandatory.

## Retrieval metrics

Implement:

- Precision@1
- Precision@3
- Precision@5
- Recall@5
- Recall@10

## Ranking metrics

Implement:

- MRR
- NDCG@5
- NDCG@10

Also report:

- Top-1 accuracy
- Top-3 hit rate
- Top-5 hit rate
- average inference latency

Do not report only a single accuracy number.

---

# 16. Experimental Comparison

At minimum compare:

```text
Experiment 0:
Keyword/BM25 baseline

Experiment 1:
Embedding model + FAISS

Experiment 2:
Embedding + FAISS + metadata-aware ranking

Experiment 3:
Embedding + FAISS + MLP

Experiment 4:
Embedding + FAISS + Cross-Encoder
```

If fine-tuning is feasible:

```text
Experiment 5:
AURA fine-tuned retrieval/ranking model
```

Record all metrics using the same held-out test set.

Do not select a model because it is theoretically expected to be better. Select based on measured performance and practical latency/resource constraints.

---

# 17. Train / Validation / Test

Use strict separation:

```text
AURA Dataset
    ├── train
    ├── validation
    └── test
```

The test set must remain untouched during model selection and hyperparameter tuning.

Avoid query leakage:
- near-duplicate queries must not cross splits
- duplicated tool records must not create leakage
- generated variants of the same query should remain in one split

---

# 18. Optional Fine-Tuning

Do not fine-tune the embedding model immediately.

Phase 1:
Use pretrained model as baseline.

Phase 2:
Evaluate retrieval.

Phase 3:
If the AURA dataset is sufficiently large/clean and baseline limitations are identified, fine-tune.

Possible objectives:
- contrastive learning
- Multiple Negatives Ranking Loss
- triplet loss
- pairwise ranking

Only implement fine-tuning after establishing a reproducible baseline.

---

# 19. AI Assistant / Chatbot Boundary

The AI/ML team owns the intelligence required to interpret the query and produce structured tool recommendations.

The backend/chatbot team owns:
- API integration
- conversation state
- authentication
- UI
- database persistence
- request routing

AURA AI/ML should expose a clean inference interface.

Example request:

```json
{
  "query": "I need to remove the background from a product image",
  "top_k": 5
}
```

Example response:

```json
{
  "query": "I need to remove the background from a product image",
  "results": [
    {
      "tool_id": "T001",
      "tool_name": "Background Remover",
      "semantic_score": 0.92,
      "ranking_score": 0.95
    }
  ],
  "model_version": "aura-retriever-v1"
}
```

The response must be machine-readable and stable.

---

# 20. AI Assistant Response Generation

If AURA's conversational layer uses an LLM, keep it separate from the retrieval model.

Recommended flow:

```text
User query
    ↓
AURA retrieval/ranking
    ↓
Relevant tools
    ↓
LLM response generation
    ↓
Natural-language answer
```

The LLM must not invent tool metadata.

It should ground recommendations in the retrieved tool records.

---

# 21. Repository Structure

Recommended:

```text
aura-ai-ml/
│
├── data/
│   ├── raw/
│   ├── processed/
│   ├── train/
│   ├── validation/
│   └── test/
│
├── models/
│   ├── embeddings/
│   ├── ranker/
│   └── checkpoints/
│
├── indexes/
│   └── faiss/
│
├── src/
│   ├── data/
│   ├── preprocessing/
│   ├── embeddings/
│   ├── retrieval/
│   ├── ranking/
│   ├── evaluation/
│   ├── inference/
│   └── utils/
│
├── notebooks/
│
├── configs/
│
├── tests/
│
├── reports/
│
├── requirements.txt
├── README.md
└── AURA_AI_ML_PRD.md
```

Keep raw external datasets separate from processed AURA datasets.

---

# 22. Recommended Technology Stack

Primary language:

**Python**

Core libraries/components:

- PyTorch
- Hugging Face Transformers
- Sentence Transformers
- FAISS
- NumPy
- Pandas
- scikit-learn
- optionally PyTorch Lightning if justified
- FastAPI only for the lightweight AI/ML inference interface if required

Do not introduce unnecessary frameworks.

---

# 23. Reproducibility

Every experiment must record:

- dataset version
- dataset split
- source datasets
- model name
- model version/revision
- embedding configuration
- index configuration
- ranker configuration
- random seed
- hyperparameters
- evaluation results

The same configuration should reproduce the reported metrics within reasonable numerical variation.

---

# 24. Deliverables

Antigravity must produce:

### Dataset
- cleaned AURA tool corpus
- query/relevance dataset
- hard-negative dataset
- train/validation/test splits
- data-quality report

### Models
- baseline embedding retrieval
- selected embedding model
- MLP ranker experiment if supported by data
- Cross-Encoder experiment if resources permit
- final selected retrieval/ranking configuration

### Retrieval
- generated embeddings
- FAISS index
- retrieval pipeline

### Evaluation
- Precision@K
- Recall@K
- MRR
- NDCG@K
- Top-K hit rates
- latency

### Engineering
- reproducible scripts
- configuration files
- tests
- inference module
- backend-facing API contract
- README explaining how to run everything

---

# 25. Acceptance Criteria

The AI/ML component is considered complete only when:

1. AURA accepts arbitrary natural-language tool requests.
2. Semantic retrieval works without exact keyword matching.
3. Tool embeddings can be generated reproducibly.
4. FAISS/vector retrieval returns relevant candidates.
5. A ranking stage is implemented and evaluated.
6. MLP is evaluated as a candidate ranker rather than assumed to be useful.
7. A pretrained reranker is evaluated where feasible.
8. Train/validation/test leakage is checked.
9. Precision@K, Recall@K, MRR and NDCG@K are reported.
10. A held-out test set is used for final evaluation.
11. The final model/index can be saved and loaded.
12. Inference returns structured results.
13. The backend/chatbot team can consume the output without depending on internal ML code.
14. No fabricated tool metadata is introduced.
15. Dataset/model licenses and provenance are documented.
16. The system has a clear model version and dataset version.

---

# 26. Implementation Order

Antigravity should implement in this order:

### Phase 1 — Project setup
- repository
- environment
- configuration
- dependency management

### Phase 2 — Data
- acquire permitted datasets
- inspect schemas
- normalize tool metadata
- build AURA master dataset
- construct query/relevance data
- generate hard negatives
- quality checks
- split train/validation/test

### Phase 3 — Baseline
- implement keyword/BM25 baseline
- establish baseline metrics

### Phase 4 — Semantic retrieval
- integrate embedding model
- create tool embeddings
- build FAISS index
- implement query retrieval
- evaluate

### Phase 5 — Ranking
- metadata-aware features
- MLP ranker
- Cross-Encoder experiment
- compare results

### Phase 6 — Optimization
- tune only based on validation data
- test batch size/latency
- optimize index and inference

### Phase 7 — Final evaluation
- lock test set
- run all selected experiments
- generate metrics/report
- select final configuration

### Phase 8 — Integration contract
- create inference interface
- document request/response schema
- provide integration example for backend/chatbot team

---

# 27. Important Instructions to Antigravity

1. **Do not start by training a large LLM.**
2. **Do not build the frontend.**
3. **Do not build the main backend application.**
4. **Do not assume ToolBench alone is the AURA dataset.**
5. **Do not fabricate missing tool metadata.**
6. **Do not hard-code BGE-M3, MLP, or a Cross-Encoder as the final winner before evaluation.**
7. **Establish a baseline first.**
8. **Keep test data isolated.**
9. **Do not report metrics on training data as final performance.**
10. **Do not over-engineer the first version.**
11. **Keep every external dataset's license and provenance.**
12. **Prefer a strong pretrained model plus AURA-specific data over training a model from scratch.**
13. **The final system must be usable by the separate backend/chatbot team through a stable interface.**
14. **Document every major design decision and experiment.**

---

# 28. Definition of Done

AURA AI/ML V1 is done when:

```text
Natural-language query
        ↓
NLP/query processing
        ↓
Pretrained semantic encoder
        ↓
Vector retrieval
        ↓
Candidate tools
        ↓
Learned/validated ranking
        ↓
Top-K relevant tools
        ↓
Quality/trust signals
        ↓
Structured result
        ↓
Backend/chatbot
```

works end-to-end on unseen queries, has reproducible evaluation results, and has a documented dataset/model/inference pipeline.

The project should prioritize **measurable semantic retrieval and recommendation quality** over unnecessary model size or complexity.

---

# 29. AURA Custom Tool Dataset — Canonical Schema

The AURA dataset must represent each AI tool as a structured record suitable for semantic retrieval, recommendation, ranking, comparison, and future chatbot grounding.

Example canonical record:

```json
{
  "id": "t1",
  "name": "ChatGPT",
  "pricing": "Freemium",
  "category": "AI Tools",
  "description": "Advanced language model by OpenAI. Capable of generating text, translating languages, writing creative content, and answering questions.",
  "icon": "https://...",
  "url": "https://...",
  "trustScore": 99,
  "users": "100M+",
  "tags": ["Chatbot", "LLM", "OpenAI"],
  "verified": true,
  "bestPrompts": [
    {"title": "Write a Blog Post", "category": "Creative", "prompt": "...", "description": "..."}
  ],
  "useCases": [
    {"title": "Content Creation", "description": "...", "targetAudience": "Marketers, creators", "difficulty": "Beginner"}
  ],
  "keyFeatures": ["Multimodal", "Code execution"],
  "pros": ["Strong general-purpose capabilities"],
  "cons": ["Can hallucinate"],
  "alternatives": ["t2", "t41"],
  "pricingDetails": [
    {"plan": "Free", "price": "$0/month", "features": ["Basic access"]}
  ]
}
```

## Field policy

- Required: `id`, `name`, `pricing`, `category`, `description`, `url`, `tags`, `useCases`, `keyFeatures`
- Optional: `icon`, `trustScore`, `users`, `verified`, `bestPrompts`, `pros`, `cons`, `alternatives`, `pricingDetails`
- Never invent unavailable metadata. Use `null` or `[]` for missing optional fields.
- Keep source/provenance metadata internally even if it is not exposed to users.

---

# 30. Custom Dataset Generation Pipeline

Build AURA's dataset from permitted public datasets/APIs such as ToolRet and ToolBench, then normalize and enrich it with AURA-specific data.

```text
ToolRet / ToolBench / permitted APIs
                ↓
            Raw records
                ↓
       Normalize + deduplicate
                ↓
       Validate metadata/source
                ↓
         AURA enrichment
                ↓
      Semantic tool documents
                ↓
       Query/relevance data
                ↓
          Hard negatives
                ↓
       Train / validation / test
```

Each record should retain provenance internally:

```json
{"source":"ToolRet","source_id":"...","license":"...","retrieved_at":"YYYY-MM-DD"}
```

Keep raw source files unchanged.

---

# 31. Semantic Tool Document

Do not embed the complete JSON object blindly. Build a compact semantic representation from fields useful for meaning:

```text
Tool: ChatGPT
Category: AI Tools
Description: Advanced language model...
Tags: Chatbot, LLM, OpenAI
Capabilities: writing, coding, research, multimodal
Use cases: content creation, programming, research
Target users: developers, students, researchers
```

Use metadata separately for ranking/filtering:

- `trustScore` → quality feature
- `pricingDetails` → price/filter feature
- `url` / `icon` → reference/UI only
- `pros` / `cons` → explanation context

This prevents irrelevant fields from distorting semantic embeddings.

---

# 32. Query and Relevance Dataset

Create AURA-specific natural-language queries, not just copied dataset queries.

Example:

```json
{"query_id":"q001","query":"I need to remove the background from a product image"}
```

Generate genuinely different formulations:

```text
Remove the background from my product image.
Make my product photo background transparent.
I need an AI tool for image background removal.
Can something isolate the subject in this image?
```

For relevance:

```json
{"query_id":"q001","tool_id":"t1","relevance":3}
```

Use:

- `0` irrelevant
- `1` weakly relevant
- `2` relevant
- `3` highly relevant

If an imported source only has binary relevance, preserve its original labels.

---

# 33. Hard Negatives

Create difficult negatives for ranking rather than only random negatives.

Example:

```text
Query: Create a presentation from my research notes

Positive: Presentation generator

Hard negatives:
- General chatbot
- Document summarizer
- Graphic design tool
```

Useful sources:

1. Same category, wrong capability
2. Similar description, wrong task
3. Similar tags, wrong output
4. Similar use case, wrong input
5. High-ranked retrieval results that are actually irrelevant

These pairs feed the MLP/reranking experiments.

---

# 34. Best Prompts and Use Cases

Retain `bestPrompts` because AURA may eventually recommend both a tool and a useful way to use it.

Prompt record:

```json
{"title":"Write a Blog Post","category":"Creative","prompt":"...","description":"..."}
```

Prompts are associated with tools; they are not separate tools.

Use cases should retain:

```json
{"title":"Programming & Development","description":"Write, debug, refactor...","targetAudience":"Developers, engineers, students","difficulty":"Beginner"}
```

Use cases can be used to create query/relevance examples.

---

# 35. Trust and Quality Data

`trustScore` must not be an arbitrary number. If AURA calculates it, document the formula and inputs.

Keep these signals separate initially:

```text
semantic_score
ranking_score
quality_score
trust_score
```

Possible validated quality inputs include verification, documentation quality, source reliability, freshness, availability, and reliable user/community signals.

Never fabricate ratings, user counts, verification, reliability, or security claims.

---

# 36. Dataset Size and Outputs

Initial target rather than a hard requirement:

```text
1,000–5,000 high-quality tools
5,000–20,000 queries
10,000+ query/tool relevance pairs
```

Prefer quality over volume.

Expected outputs:

```text
data/
├── raw/
├── processed/
│   ├── aura_tools.json
│   ├── aura_tools.csv
│   ├── aura_queries.json
│   ├── aura_qrels.json
│   └── aura_pairs.json
├── train/
├── validation/
└── test/
```

---

# 37. Concise Dataset Code Requirements

Dataset-generation code must be short, modular, and readable. Avoid giant scripts, repeated logic, unnecessary comments, unused helpers, and hard-coded API responses.

Preferred modules:

```text
src/data/
    ingest.py
    normalize.py
    dedupe.py
    enrich.py
    generate_queries.py
    build_pairs.py
    split.py
```

Example style:

```python
def normalize_tool(x):
    return {
        "id": x["id"],
        "name": x["name"],
        "description": x.get("description", ""),
        "category": x.get("category"),
        "tags": x.get("tags", [])
    }
```

Use modern concise Python. Poetry may be used for dependency management if useful, but do not add tooling only for appearance.

---

# 38. Dataset Acceptance Criteria

The custom AURA dataset is ready when:

1. Tool IDs are unique and stable.
2. Duplicate/near-duplicate records are handled.
3. Tool descriptions contain useful semantic information.
4. Provenance and licensing are recorded.
5. Queries represent real user intent.
6. Query/tool relevance is explicitly labeled.
7. Hard negatives exist.
8. Train/validation/test leakage is checked.
9. Missing metadata is never fabricated.
10. Generation is reproducible.
11. A data-quality report exists.
12. The resulting dataset feeds the embedding, retrieval, and ranking pipeline directly.

The custom dataset is the bridge between pretrained models and AURA-specific intelligence.


# 41. DATASET GENERATION & PREPARATION SPECIFICATION

This section converts the dataset requirements into an implementation-ready specification. The dataset must be generated in a reproducible, traceable, and validation-first manner.

## 41.1 Dataset Architecture

AURA must maintain two related but separate datasets:

### A. Tool Knowledge Dataset

One record represents one AI tool/service/API.

Purpose:
- tool discovery
- semantic embedding
- retrieval
- ranking
- display metadata

Canonical record:

```json
{
  "id": "t1",
  "name": "Tool name",
  "pricing": "Freemium",
  "category": "AI Tools",
  "description": "Concise factual description.",
  "icon": null,
  "url": "https://example.com",
  "trustScore": null,
  "users": null,
  "tags": [],
  "verified": false,
  "bestPrompts": [],
  "useCases": [],
  "keyFeatures": [],
  "pros": [],
  "cons": [],
  "alternatives": [],
  "pricingDetails": []
}
```

Rules:
- `id`, `name`, `description`, `category`, `url`, `tags`, `useCases`, and `keyFeatures` are the preferred core fields.
- Optional fields may be null or empty when reliable information is unavailable.
- Never invent pricing, user counts, trust scores, features, capabilities, or verification status.
- Preserve source provenance internally even if provenance is not displayed to the end user.
- Do not treat marketing claims as verified facts without evidence.
- Keep `trustScore` separate from semantic relevance. It must never silently replace relevance ranking.

### B. Query-Relevance Dataset

One record represents a user request and its relationship to candidate tools.

Recommended structure:

```json
{
  "query_id": "q001",
  "query": "I need an AI tool that can remove backgrounds from product photos.",
  "relevant_tools": ["t17"],
  "hard_negatives": ["t21", "t33"],
  "relevance": [
    {"tool_id": "t17", "label": 3},
    {"tool_id": "t21", "label": 0},
    {"tool_id": "t33", "label": 0}
  ],
  "source": "synthetic_plus_curated"
}
```

Use a graded relevance scale when appropriate:

```text
0 = irrelevant
1 = weak/indirectly relevant
2 = useful but not an ideal match
3 = highly relevant / strong match
```

The exact label policy must remain consistent across train, validation, and test sets.

---

## 41.2 Data Sources

Use multiple sources rather than depending on a single dataset.

Priority:

1. ToolRet / tool-retrieval benchmark data where licensing and access permit.
2. ToolBench as a source/reference for tool/API metadata and retrieval examples.
3. Publicly available tool/API metadata with compatible licensing.
4. Carefully curated AURA-specific records.
5. Synthetic query generation based on verified tool capabilities and use cases.

ToolBench and ToolRet are source material, not the final AURA dataset.

Every imported record should retain:

```json
{
  "source": "toolbench",
  "source_id": "...",
  "source_url": "...",
  "license": "...",
  "retrieved_at": "..."
}
```

If a source does not provide a field, leave the field empty rather than fabricating it.

---

## 41.3 Normalization Pipeline

The generator must follow this order:

```text
Raw Sources
    ↓
Source Adapters
    ↓
Schema Normalization
    ↓
Text Cleaning
    ↓
Deduplication
    ↓
Metadata Validation
    ↓
Semantic Document Construction
    ↓
Tool Dataset
```

Normalization should:
- standardize field names
- normalize URLs
- normalize categories
- normalize tags
- remove duplicate whitespace
- clean malformed text
- convert missing values consistently
- preserve source IDs
- preserve provenance

---

## 41.4 Deduplication

Deduplication must happen at multiple levels:

1. Exact duplicate IDs.
2. Canonical URL duplicates.
3. Exact/near-exact names.
4. Highly similar descriptions where they clearly represent the same underlying tool.

Do not merge two genuinely different tools merely because they have similar descriptions.

The deduplication process must produce a report:

```text
records_before
exact_duplicates_removed
near_duplicates_reviewed
records_after
```

---

## 41.5 Semantic Document Construction

Do not embed the complete JSON object blindly.

Build a semantic text document from the fields that describe what the tool does:

```text
Tool: ChatGPT
Category: AI Tools
Description: Advanced language model...
Tags: chatbot, LLM, OpenAI
Capabilities: writing, coding, research, multimodal
Use cases: content creation, programming, research
Target users: developers, students, researchers
```

The semantic document should prioritize:
- description
- capabilities
- tags
- use cases
- key features
- target audience
- relevant API/tool descriptions

Avoid embedding UI-only fields such as icon URLs.

---

## 41.6 Query Generation

Generate natural user queries from tool capabilities and use cases.

Queries should vary in wording and specificity:

### Example

Tool capability:
```text
AI image background removal
```

Possible queries:
```text
"Remove the background from this product photo."
"I need an AI tool for transparent product images."
"What can automatically cut a person out of a photo?"
"Suggest an AI image editor for background removal."
```

Queries must represent actual user intent rather than simply repeating the tool description.

Query categories should include:
- direct task requests
- problem-based requests
- outcome-based requests
- novice wording
- technical wording
- short queries
- detailed queries
- ambiguous but realistic queries
- multi-requirement queries

Avoid excessive template repetition.

---

## 41.7 Positive Relevance Construction

Positive query/tool pairs may come from:

1. Existing benchmark relevance labels.
2. Curated human labels.
3. Tool use cases.
4. Verified capabilities.
5. Carefully generated synthetic queries followed by validation.

Synthetic positives must be checked against the actual tool record.

A generated query must not become a positive example merely because the language model produced it.

---

## 41.8 Hard Negative Construction

Hard negatives are required because AURA must distinguish between semantically similar tools.

Examples:

```text
Query:
"I need a tool to generate images from text."

Positive:
Text-to-image generator

Hard negatives:
Image upscaler
Photo editor
Image background remover
```

Hard negatives should come from:
- same category
- overlapping tags
- similar descriptions
- related use cases
- competing tools
- tools retrieved by embedding similarity but judged less relevant

Do not use only random negatives.

Maintain both:
- easy negatives
- hard negatives

This is important for training and evaluating the ranking model.

---

## 41.9 Query-Relevance Split

Use query-level splits, not random row-level splitting.

Recommended:

```text
Train:      70%
Validation: 15%
Test:       15%
```

A query and its near-duplicates must never appear across multiple splits.

Where possible:
- prevent tool leakage when evaluating generalization
- prevent synthetic template leakage
- prevent duplicate queries across splits
- document the split seed

---

## 41.10 Data Validation

Before model training, run automated checks.

Required checks:

```text
Schema validation
Missing-value analysis
Duplicate detection
URL validation
Category validation
Tag validation
Description length checks
Query quality checks
Relevance-label checks
Train/validation/test leakage checks
Source/license/provenance checks
```

A validation report must include:

```text
total_tools
total_queries
total_query_tool_pairs
duplicate_count
missing_required_fields
invalid_urls
invalid_labels
split_leakage_count
source_distribution
category_distribution
```

The pipeline must fail loudly for critical errors instead of silently producing corrupted data.

---

## 41.11 Initial Dataset Targets

These are development targets, not mandatory numbers:

### Pilot
- 100–500 tools
- 500–2,000 queries
- 1,000+ relevance pairs

### Development
- 1,000–5,000 tools
- 5,000–20,000 queries
- 10,000+ relevance pairs

Scale only after the pilot dataset passes validation.

Quality is more important than raw record count.

---

# 42. IMPLEMENTATION-READY PROJECT STRUCTURE

Use a clean modular structure:

```text
aura-ai-ml/
│
├── data/
│   ├── raw/
│   ├── processed/
│   ├── queries/
│   ├── embeddings/
│   └── indexes/
│
├── src/
│   ├── data/
│   │   ├── ingest.py
│   │   ├── normalize.py
│   │   ├── dedupe.py
│   │   ├── validate.py
│   │   ├── enrich.py
│   │   ├── generate_queries.py
│   │   ├── build_pairs.py
│   │   └── split.py
│   │
│   ├── retrieval/
│   │   ├── embed.py
│   │   ├── index.py
│   │   └── retrieve.py
│   │
│   ├── ranking/
│   │   ├── features.py
│   │   ├── train.py
│   │   ├── rerank.py
│   │   └── predict.py
│   │
│   └── evaluation/
│       ├── metrics.py
│       └── evaluate.py
│
├── configs/
│   └── config.yaml
│
├── tests/
│
├── reports/
│
├── notebooks/
│
├── pyproject.toml
└── README.md
```

Code must remain concise and modular. Do not create unnecessarily long scripts or duplicate logic across notebooks and Python modules.

Poetry may be used for dependency management if convenient.

---

# 43. ANTIGRAVITY IMPLEMENTATION INSTRUCTIONS

This section is specifically intended for an AI coding agent such as Antigravity.

## 43.1 Primary Objective

Implement the AURA AI/ML intelligence layer described in this PRD.

The implementation must be incremental and validation-first.

Do not attempt to build the entire system in one uncontrolled generation.

---

## 43.2 Non-Goals

Do NOT build:
- the frontend
- the main web application
- the final chatbot UI
- authentication
- the production backend
- a foundation LLM from scratch
- unnecessary hardware components

The AI/ML layer must expose a clean interface that another backend/chatbot component can consume.

---

## 43.3 Implementation Order

Follow exactly this sequence:

### Phase 1 — Repository and environment
Create the project structure, dependency configuration, configuration file, README, and tests.

### Phase 2 — Dataset ingestion
Implement source adapters for permitted ToolRet/ToolBench data and custom AURA records.

Do not assume a dataset file exists. If source data is unavailable locally, create the adapter/interface and clearly document the expected input format instead of fabricating source data.

### Phase 3 — Normalization and deduplication
Convert source records to the AURA canonical schema.

Generate validation and deduplication reports.

### Phase 4 — Query/relevance dataset
Generate or import query/tool relevance examples.

Create hard negatives.

Create leakage-safe train/validation/test splits.

### Phase 5 — Dataset validation
Run all validation checks.

Do not proceed to model training if critical validation failures remain.

### Phase 6 — Baseline retrieval
Implement a simple lexical/BM25 baseline.

Evaluate it.

### Phase 7 — Semantic retrieval
Implement:
- pretrained sentence/document embeddings
- tool embedding generation
- query embedding
- FAISS index
- Top-N retrieval

Start with a strong pretrained embedding model such as BGE-M3 or an appropriate equivalent.

Do not fine-tune the embedding model initially.

### Phase 8 — Re-ranking
Add a pretrained reranker/cross-encoder.

Compare:
- lexical baseline
- embedding retrieval
- embedding + reranker

### Phase 9 — AURA-specific ranking model
Build the custom ranking component only after the retrieval pipeline works.

Candidate features may include:
- semantic similarity
- reranker score
- category compatibility
- capability overlap
- use-case compatibility
- input/output compatibility
- validated quality/trust features

The ranking model must be trained from AURA relevance data.

Do not claim that pretrained BGE/reranker components are custom-trained AURA models.

### Phase 10 — Evaluation
Implement:
- Precision@1/3/5
- Recall@5/10
- MRR
- NDCG@5/10
- Hit Rate@K
- latency

Generate a comparison report for each pipeline version.

### Phase 11 — Inference interface
Expose a clean function/API concept:

```python
recommend_tools(query, top_k=5)
```

Return structured results containing at minimum:

```json
{
  "query": "...",
  "results": [
    {
      "tool_id": "t1",
      "name": "Tool name",
      "score": 0.0,
      "reason": "...",
      "use_case": "...",
      "url": "..."
    }
  ]
}
```

The exact production API belongs to the backend team; this layer only needs a clean inference contract.

---

# 44. ANTIGRAVITY CODING RULES

1. Keep code short, readable, and modular.
2. Prefer functions with one clear responsibility.
3. Avoid unnecessary abstraction.
4. Avoid giant single-file scripts.
5. Avoid duplicating logic.
6. Use configuration files for paths/model names rather than hard-coding them throughout the code.
7. Add concise comments only where they clarify non-obvious logic.
8. Use type hints where useful.
9. Add basic tests for important data-processing and ranking functions.
10. Log important pipeline stages and dataset counts.
11. Never silently fabricate missing data.
12. Preserve provenance.
13. Do not silently change the canonical schema.
14. Do not move to the next phase when a previous phase has critical validation failures.
15. Prefer reproducibility over cleverness.

---

# 45. ANTIGRAVITY EXECUTION CHECKPOINTS

At the end of each phase, produce:

```text
1. What was implemented
2. Files created/changed
3. Dataset/model counts
4. Validation results
5. Tests executed
6. Known limitations
7. Exact next phase
```

The agent must not merely say "done." It must provide measurable evidence.

For example:

```text
Tools processed: 428
Duplicates removed: 31
Valid tools: 397
Queries generated: 1,284
Query-tool pairs: 3,912
Train queries: 899
Validation queries: 192
Test queries: 193
Leakage detected: 0
```

Use actual values, never invented example values.

---

# 46. DEFINITION OF DONE

The AURA AI/ML layer is considered complete when:

- the canonical tool dataset is generated and validated;
- provenance is retained;
- the query/relevance dataset exists;
- hard negatives exist;
- train/validation/test splits are leakage-safe;
- a lexical baseline exists;
- semantic embedding retrieval works;
- FAISS retrieval works;
- reranking works;
- the AURA-specific ranking model works or a documented experiment shows why it is unnecessary;
- evaluation metrics are implemented;
- baseline vs improved systems are compared;
- an inference interface returns Top-K recommendations;
- tests pass;
- documentation explains the complete pipeline;
- the output can be handed to the backend/chatbot developer.

Do not mark the project complete merely because the code runs. The dataset, evaluation, and measurable retrieval quality are part of the deliverable.

---

# 47. IMPORTANT AGENT BEHAVIOR

If a requirement is ambiguous:
1. inspect this PRD first;
2. inspect existing project files;
3. preserve the established architecture;
4. choose the smallest reasonable implementation;
5. document the assumption.

Do not replace the architecture with a completely different approach without evidence that the current approach cannot work.

Do not train large models unnecessarily.

The target is a strong, explainable, measurable **tool recommendation/retrieval intelligence layer**, not a new foundation model.
