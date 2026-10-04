# AURA.ai — System Walkthrough & Demonstration Guide

This guide walks through testing, demonstrating, and presenting the **AURA.ai** platform, covering the neural recommendation pipeline, the interactive CLI, the FastAPI REST backend, and the full-stack Next.js web application with the AI Assistant Chatbot.

---

## 1. 🤖 Interactive ML Terminal CLI

The fastest way to demonstrate AURA's neural vector retrieval live in a terminal:

```bash
cd intelligence
python main.py
```

### What Happens:
1. Loads the **320 curated AI tools** across 23 taxonomy categories into RAM.
2. Initializes the `sentence-transformers/all-MiniLM-L6-v2` embedding model (384 dense dimensions).
3. Mounts the pre-computed **FAISS FlatIP vector index**.
4. Displays an animated diagnostic dashboard confirming vector space readiness in `< 50ms`.

### Recommended Demonstration Queries:
- `"best AI tool for coding"` $\rightarrow$ Retrieves *Codeium*, *Replit AI*, *GitHub Copilot*, *Cursor*, *Tabnine*.
- `"make ppt for college presentation"` $\rightarrow$ Tests domain expansion (`\bppt\b` $\rightarrow$ *presentation slides*) and returns *Gamma*, *Beautiful.ai*.
- `"free voice generator for youtube shorts"` $\rightarrow$ Tests multi-constraint filtering and returns *ElevenLabs*, *Murf.ai*, *Speechify*.

---

## 2. ⚡ FastAPI REST API Backend

To run the standalone ASGI recommendation server:

```bash
cd intelligence
python -m uvicorn src.inference.api:app --port 8000
```

- **Interactive Swagger Documentation**: Open [http://localhost:8000/docs](http://localhost:8000/docs) in your browser.
- **Health Check Probe**: `GET http://localhost:8000/health` $\rightarrow$ `{"status": "ok"}`
- **Vector Recommendation**: `POST http://localhost:8000/recommend`

---

## 3. 🌐 Full-Stack Web Application (Next.js 16)

Launch the Next.js frontend:

```bash
cd web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 4. 🌟 Key Features to Showcase in Viva / Demonstrations

### Feature A: The AURA Assistant Chatbot Copilot
1. Click the floating gradient **"Ask AURA"** orb in the bottom-right corner of the dashboard.
2. Click the starter prompt: **`⚡ Cursor vs GitHub Copilot`** (or type any comparison).
3. Highlight to evaluators:
   - **Direct Comparison Matrix**: Shows pricing, trust scores, and an emerald winner tag for *Budget*, *Trust*, and *Adoption*.
   - **Interactive Tool Cards**: Hover over cards, inspect trust scores, and click the **Bookmark icon** to save tools directly from the conversation.
   - **Horizontal Follow-Up Prompt Carousel**: Click `+ Show free alternatives` to trigger immediate follow-up queries.

### Feature B: System Telemetry & Diagnostics (`/settings`)
1. Click **Settings** in the left navigation sidebar.
2. Point out the **AURA Neural Recommendation Core** dashboard at the top of the page:
   - Model: `all-MiniLM-L6-v2` (384-dimensional dense vectors)
   - Vector Index: `FAISS FlatIP` (Exact cosine similarity)
   - Ingested Catalog: `320 Active Tools`
   - Latency: `~39 ms`
   - Backend Status: `● Operational (127.0.0.1:8000)`
3. Test the **Segmented Theme Selector**: Click between *Dark Mode* and *Light Mode* to demonstrate the smooth 350ms native View Transition crossfade.

### Feature C: Discovery Directory (`/discover`)
1. Filter across categories (*AI Chatbot*, *Video Generation*, *Code Assistant*, *Audio & Voice*).
2. Click on any card (e.g. *ChatGPT* or *Cursor*) to open the **Detail View (`/discover/[id]`)**:
   - Inspect the verified community trust score meter.
   - Review pre-tested example prompts by difficulty (*Beginner*, *Intermediate*).
   - Check side-by-side pros and cons cards.

### Feature D: Saved Tools Workspace (`/saved`)
1. View bookmarked tools saved during exploration or from the assistant chat.
2. If empty, demonstrate the clean directory CTA button navigating directly into `/discover`.

---

## 5. 🧪 Running the Automated Test Suite

Run all 34 automated unit tests:

```bash
cd intelligence
python -m pytest
```

Expected Output:
```text
============================= 34 passed in 0.47s ==============================
```

---

## 6. 📦 Production Build Verification

Verify that the Next.js frontend builds cleanly without TypeScript or routing errors:

```bash
cd web
npm run build
```

Expected Output:
```text
✓ Compiled successfully
✓ Finished TypeScript
✓ Generating static pages (12/12)
Finalizing page optimization ...
```

---

## 7. 🐳 Multi-Container Docker Deployment

To launch the complete containerized stack in isolated microservices:

```bash
docker compose up -d --build
```

### Verification & Health Probes:
- Check container status: `docker compose ps`
- Access Web Application: [http://localhost:3000](http://localhost:3000)
- Stream combined service logs: `docker compose logs -f`
- Stop and clean up containers: `docker compose down`
