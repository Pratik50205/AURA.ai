# AURA — Embedding Model Benchmarking & Evaluation Report

## Executive Summary
This report documents the rigorous evaluation of alternative open-weights embedding models against
AURA's production baseline (`sentence-transformers/all-MiniLM-L6-v2`) across three standardized experiments:
- **Experiment A (Dense):** Pure FAISS Cosine retrieval across top-1, 3, 5, 10, 20.
- **Experiment B (Hybrid):** Dense + Fixed BM25Okapi + Reciprocal Rank Fusion (RRF).
- **Experiment C (End-to-End Ranking):** Retrieval fed into the PyTorch MLPRanker.

## 1. Retrieval Quality Comparison (Experiment A — Dense)

| Model | Params | Dim | P@1 | P@5 | P@10 | R@5 | MRR (95% CI) | NDCG@10 (95% CI) | Failure Rate |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **all-MiniLM-L6-v2 (Production Baseline)** | 22.7M | 384 | 0.7000 | 0.3067 | 0.1867 | 0.6777 | 0.7803 [0.6487, 0.9001] | 0.7036 [0.6011, 0.7994] | 6.7% |

## 2. Hybrid Retrieval Lift (Experiment B — Dense + BM25 + RRF)

| Model | Dense MRR | Hybrid MRR | Delta MRR | Dense NDCG@10 | Hybrid NDCG@10 | Delta NDCG@10 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **all-MiniLM-L6-v2 (Production Baseline)** | 0.7803 | 0.7565 | -0.0238 | 0.7036 | 0.6784 | -0.0252 |

## 3. Latency, Throughput & Resource Consumption

| Model | Median Latency | P95 Latency | Throughput | RAM Peak | Load Time | Index Size |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **all-MiniLM-L6-v2 (Production Baseline)** | 22.67 ms | 31.45 ms | 28.1 docs/s | 108.5 MB | 6.97 s | 480.0 KB |

## 4. Query-Level Error Analysis & Qualitative Diagnosis

The following analysis details queries where models diverged in top-1 precision or suffered zero hits:

- **Query [q072]:** *"Turn my hand-drawn sketch into a digital wireframe"*
  - MRR: `1.0`, NDCG@10: `0.8609`, Zero-hit: `False`
  - Top 3 tools retrieved: `['t50', 't137', 't316']`
- **Query [q151]:** *"What tool can generate realistic video from a single photo?"*
  - MRR: `1.0`, NDCG@10: `0.7969`, Zero-hit: `False`
  - Top 3 tools retrieved: `['t90', 't20', 't19']`
- **Query [q115]:** *"Compare different AI models in one place"*
  - MRR: `0.0`, NDCG@10: `0.0`, Zero-hit: `True`
  - Top 3 tools retrieved: `['t151', 't85', 't82']`
- **Query [q057]:** *"Translate my website content into multiple languages"*
  - MRR: `1.0`, NDCG@10: `0.8176`, Zero-hit: `False`
  - Top 3 tools retrieved: `['t37', 't207', 't66']`
- **Query [q108]:** *"I need an open source AI image generator I can run locally"*
  - MRR: `0.1429`, NDCG@10: `0.3333`, Zero-hit: `False`
  - Top 3 tools retrieved: `['t180', 't177', 't10']`
- **Query [q199]:** *"I need an accessible way to consume written articles by listening"*
  - MRR: `1.0`, NDCG@10: `0.8828`, Zero-hit: `False`
  - Top 3 tools retrieved: `['t55', 't145', 't104']`
- **Query [q173]:** *"Make my writing sound more engaging and clear"*
  - MRR: `1.0`, NDCG@10: `0.9091`, Zero-hit: `False`
  - Top 3 tools retrieved: `['t76', 't35', 't75']`
- **Query [q051]:** *"Check my grammar and improve my writing"*
  - MRR: `1.0`, NDCG@10: `0.9295`, Zero-hit: `False`
  - Top 3 tools retrieved: `['t35', 't76', 't36']`