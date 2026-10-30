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

### Feature A: Precision Assistant & Multi-Provider AI Brain (`llmBrain.ts`)
1. Click the floating gradient **"Ask AURA"** orb in the bottom-right corner.
2. **Zero-Spam Accuracy Test**:
   - Math test: Type `"what is 25 * 14?"` $\rightarrow$ Answers `350` instantly with clean steps and **zero unwanted tool cards**.
   - Code test: Type `"how to reverse a string in python?"` $\rightarrow$ Generates `text[::-1]` in a syntax-highlighted code block with a 1-click **Copy Code** button.
   - Science test: Type `"what is photosynthesis?"` $\rightarrow$ Explains the chemical formula $6\text{CO}_2 + 6\text{H}_2\text{O} \rightarrow \text{C}_6\text{H}_{12}\text{O}_6 + 6\text{O}_2$ cleanly.
   - Comparison test: Type `"Cursor vs Copilot"` $\rightarrow$ Triggers side-by-side comparison matrix with verified pricing, trust scores, and budget winners.
3. **Multi-Model AI Brain Drawer**:
   - Click the **Brain icon** in the assistant modal header to slide out the **Configure AI Brain Model** drawer.
   - Switch between **Google Gemini (1.5 Flash)**, **Groq (Llama 3.3 70B)**, **OpenAI (GPT-4o mini)**, **Ollama (Local Llama 3)**, or **Built-in AURA Engine**.
   - Input an API key and click **Test Key** to verify connectivity live. Preferences persist across reloads in `localStorage`.

### Feature B: Windows Command Spotlight Search (`Ctrl+K`)
1. Press **`Ctrl + K`** (or `Cmd + K` on macOS) from anywhere in the application.
2. Highlight:
   - Full-screen glassmorphism pop-over with prominent, focused search text input.
   - **Accepts Natural Language Prompts**: Type complex prompts like `"I need a tool to generate realistic speech from text"` or `"build a web scraper"` and press Enter to instantly navigate to ranked discovery results.
   - Quick jump pills for top categories and direct keyboard navigation.

### Feature C: 3-Slot Blank-by-Default Comparison Drawer
1. Navigate to `/discover` or open the comparison drawer.
2. Only **3 comparison slots** are provided on the right.
3. Defaults to **clean blank states** with a plus placeholder, letting users deliberately choose which AI tools to pit against one another without intrusive presets.

### Feature D: Enterprise Admin Console (`/admin`)
1. Navigate to `/admin` to demonstrate administrative telemetry:
   - Real-time catalog and user count stats (`/api/admin/stats`).
   - Paginated user list with role indicators and join dates (`/api/admin/users`).
   - Live system health cards for FastAPI backend, FAISS vector index, and NextAuth session store.
   - Audit activity log stream tracking user signups and catalog updates.

### Feature E: System Telemetry & Diagnostics (`/settings`)
1. Click **Settings** in the left navigation sidebar.
2. Point out the **AURA Neural Recommendation Core** dashboard at the top of the page:
   - Model: `all-MiniLM-L6-v2` (384-dimensional dense vectors)
   - Vector Index: `FAISS FlatIP` (Exact cosine similarity)
   - Ingested Catalog: `320 Active Tools`
   - Latency: `~32 ms`
   - Backend Status: `● Operational (127.0.0.1:8000)`
3. Test the **Segmented Theme Selector**: Click between *Dark Mode* and *Light Mode* to demonstrate the smooth 350ms native View Transition crossfade.

### Feature F: Discovery Directory & Detail View (`/discover`)
1. Filter across categories (*AI Chatbot*, *Video Generation*, *Code Assistant*, *Audio & Voice*).
2. Click on any card (e.g. *ChatGPT* or *Cursor*) to open the **Detail View (`/discover/[id]`)**:
   - Inspect the verified community trust score meter.
   - Review pre-tested example prompts by difficulty (*Beginner*, *Intermediate*).
   - Check side-by-side pros and cons cards.

### Feature G: Saved Tools Workspace (`/saved`)
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
