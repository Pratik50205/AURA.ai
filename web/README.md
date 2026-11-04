# AURA.ai Frontend Web Application
**Intelligent AI Tool Discovery & Neural Recommendation Platform**

This is the official Next.js 16 web application for **AURA.ai**. Built with the Next.js App Router, React 19, Tailwind CSS 4, and Framer Motion, it features an interactive **AI Assistant Copilot with Generative UI**, **Natural Voice Input**, a **Global Floating Compare Dock**, real-time **side-by-side tool comparison matrices**, and a **Live ML Recommendation Core Telemetry Dashboard**.

---

## Key Highlights

- **Interactive Generative UI (`GenerativeUiRenderer.tsx`)**: Replaces plain text with dynamic visual components:
  - Dynamic comparison tables with winner highlights and pricing comparisons.
  - Step-by-step workflow trees with actionable copyable snippets and direct links.
  - 1-click in-chat bookmarking and compare dock actions.
- **Natural Voice Input (Web Speech API)**: Microphone button with real-time waveform pulse animations, allowing natural voice queries with intelligent utterance deduplication.
- **Global Floating Compare Dock (`CompareDock.tsx`)**: Persistent comparison dock tracking up to 4 tools across Discover, Search, and Assistant, with 1-click navigation to the dedicated `/compare` matrix.
- **Multi-Provider AI Brain (`llmBrain.ts`)**: Assistant copilot equipped with client-level providers: **Google Gemini (1.5 Flash)**, **Groq (Llama 3.3 70B)**, **OpenAI (GPT-4o mini)**, **Ollama (local)**, and Built-in fallback. Configurable via in-modal slide drawer with live key testing.
- **Zero-Spam Precision Engine**: Direct, accurate responses for Math, Code (with copy buttons), Science, and QA with zero unsolicited tool spamming.
- **Windows Command Spotlight (`Ctrl+K`)**: Floating command search modal with full input visibility, prompt acceptance, category quick-jump, and direct discovery actions.
- **Dynamic Catalog Discovery (`/discover`)**: Instant filtering across 23 AI categories, search with query expansion, and sortable tool cards.
- **Detailed Tool Inspection (`/discover/[id]`)**: Deep-dive views showcasing verified trust scores, key features, pros & cons, example prompts, and alternatives.
- **Account-Synced Bookmarks (`/api/saved`)**: Synchronized cloud bookmarking for authenticated users with automatic fallback to browser localStorage for guests.
- **Enterprise Admin Console (`/admin`)**: Real-time platform telemetry, user management, audit activity logs, and system health status.
- **Settings & ML Diagnostics (`/settings`)**: Live telemetry card showing model parameters (*all-MiniLM-L6-v2*, *384-d*, *FAISS FlatIP*, *latency ~32ms*), profile persistence, and dual-theme controls.
- **Ultra-Smooth Theme Transitions**: Native CSS View Transitions API crossfading smoothly between **Dark Obsidian** and **Clean Light** themes.

---

## Project Roadmap & Status

- [x] **Phase 1: Modern Glassmorphic UI & Architecture**
  - Full-stack App Router with responsive layouts.
  - AURA brand identity (`#D9042B` → `#FF7B00`).
  - Reusable component library (`Header`, `Sidebar`, `ToolCard`).

- [x] **Phase 2: Authentication & Session Management**
  - NextAuth.js v5 with JWT session strategy.
  - Login, register, and protected routes.
  - Graceful fallback for local developer sessions.

- [x] **Phase 3: Neural Semantic Search Integration**
  - Direct bridge between Next.js `/api/recommend` and the FastAPI ML service.
  - Fast in-memory caching and fallback execution.
  - 320 curated tools synchronized from the ML dataset.

- [x] **Phase 4: AURA Assistant Chatbot Copilot**
  - Floating slide-out chat drawer with Framer Motion physics.
  - Automated intent recognition (discover, compare, filter free).
  - Side-by-side comparison matrix with winner detection.
  - 1-click bookmarking straight from inside chat bubbles.
  - Horizontal scrolling prompt carousel.

- [x] **Phase 5: UI/UX Refinement & Accessibility**
  - Native CSS View Transitions API for theme switches.
  - Live ML core diagnostics dashboard in Settings.
  - Fixed NextAuth secret configurations and removed dev indicators.
  - Removed promotional banners for a clean navigation flow.

- [x] **Phase 6: Production Verification & GitHub Sync**
  - 100% Next.js production build pass rate (`20/20 routes compiled`).
  - Sub-40ms response latency.
  - Repository published to [GitHub](https://github.com/Pratik50205/AURA.ai).

- [x] **Phase 7: Resilience, Security & Docker Orchestration**
  - Zero-dependency Bounded LRU Cache (`BoundedLruCache`) with TTL preventing memory leaks.
  - IP-based sliding-window rate limiter (`checkRateLimit`) protecting `/api/recommend` and `/api/assistant`.
  - Multi-container Docker Compose with persistent SQLite volume (`aura-web-data`) for accounts, bookmarks, and reviews.
  - Pre-cached PyTorch embedding models for 0-second cold-starts and offline startup.

- [x] **Phase 8: UI Redesign Harmonization & Modern Navigation**
  - Unified aesthetic across all pages with modern glassmorphism design system.
  - Direct `/discover` exploration flow replacing redundant dashboard tab.
  - Windows command spotlight shortcut (`Ctrl+K` on Windows/Linux, `Cmd+K` on macOS).
  - Floating spotlight search modal (`SearchSpotlightModal.tsx`) with full input visibility and prompt handling.
  - 3-slot blank-by-default comparison drawer.
  - Enterprise Admin console (`/admin`, `/api/admin/stats`, `/api/admin/users`).

- [x] **Phase 9: Precision Chatbot & Multi-Provider AI Brain**
  - Strict zero-spam intent filtering in `assistantEngine.ts` (accurate direct answers for Math, Science, Code, QA).
  - Multi-provider AI Brain architecture (`llmBrain.ts`) supporting Google Gemini, Groq, OpenAI, Ollama, and Built-in fallback.
  - In-modal "Configure AI Brain Model" slide-over drawer with live API key testing and localStorage persistence.

- [x] **Phase 10: Full Docker Networking & Ollama Host Gateway**
  - Bridge network `aura-network` connecting Next.js and FastAPI.
  - `host.docker.internal:host-gateway` enabling containerized web app to reach host Ollama instances.
  - Container healthchecks and automated SQLite database seeding.

- [x] **Phase 11: Generative UI, Voice Commands & Floating Compare Dock**
  - Interactive Generative UI Engine (`GenerativeUiRenderer.tsx`) with comparison tables and step-by-step workflow trees.
  - Browser-native speech recognition via Web Speech API with audio pulse waveforms and utterance deduplication.
  - Global Floating Compare Dock (`CompareDock.tsx` and `CompareContext.tsx`) syncing up to 4 tools across pages.
  - Unified single-modal Copilot experience (removed redundant standalone `/bot` tab).
  - Database persistence for `Tool`, `Workflow`, `WorkflowStep` with automated LibSQL seeding (`seed.mjs`).
  - Account-synced bookmark API endpoint (`/api/saved`).
  - Subprocess-free local vector heuristic fallback replacing runtime Python spawns in Next.js.

---

## Tech Stack Overview

| Category | Technology |
|---|---|
| **Framework** | Next.js 16.3.1 (Turbopack, App Router) |
| **Library** | React 19.2.8 |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4, Vanilla CSS Custom Properties |
| **Motion** | Framer Motion 12 |
| **Voice** | Web Speech API |
| **Icons** | Lucide React |
| **Auth** | NextAuth.js v5 (beta 32) |
| **Database** | Prisma ORM 7, LibSQL / SQLite / PostgreSQL |

---

## Environment Setup

Create `.env.local` in `web/` (or copy `.env.example`):

```env
# NextAuth Configuration
AUTH_SECRET="aura-production-secret-encryption-key-32-chars-minimum"
NEXTAUTH_SECRET="aura-production-secret-encryption-key-32-chars-minimum"
NEXTAUTH_URL="http://localhost:3000"

# AI/ML Backend Service
AURA_INTELLIGENCE_URL="http://127.0.0.1:8000"
# (AURA_AIML_URL is also supported as legacy fallback)
```

---

## Development & Build Commands

```bash
# 1. Install dependencies
npm install

# 2. Seed SQLite database with 320 tools & workflows
node prisma/seed.mjs

# 3. Run local development server
npm run dev

# 4. Synchronize tools from ML pipeline
npm run sync:tools

# 5. Production build
npm run build

# 6. Start production server
npm run start
```

---

## License

Internal major academic project.
