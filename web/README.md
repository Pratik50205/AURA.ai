# AURA.ai Frontend Web Application
**Intelligent AI Tool Discovery & Neural Recommendation Platform**

This is the official Next.js 16 web application for **AURA.ai**. Built with the Next.js App Router, React 19, Tailwind CSS 4, and Framer Motion, it features an interactive **AI Assistant Chatbot Copilot**, real-time **side-by-side tool comparison matrices**, and a **Live ML Recommendation Core Telemetry Dashboard**.

---

## Key Highlights

- **Multi-Provider AI Brain (`llmBrain.ts`)**: Assistant copilot equipped with client-level providers: **Google Gemini**, **Groq (Llama 3.3 70B)**, **OpenAI (GPT-4o mini)**, **Ollama (local)**, and Built-in fallback. Configurable via in-app slide drawer with live key testing.
- **Zero-Spam Precision Engine**: Direct, accurate responses for Math, Code (with copy buttons), Science, and QA with zero unsolicited tool spamming.
- **Windows Command Spotlight (`Ctrl+K`)**: Floating command search modal with full input visibility, prompt acceptance, category quick-jump, and direct discovery actions.
- **Dynamic Catalog Discovery (`/discover`)**: Instant filtering across 23 AI categories, search with query expansion, and sortable tool cards.
- **Detailed Tool Inspection (`/discover/[id]`)**: Deep-dive views showcasing verified trust scores, key features, pros & cons, example prompts, and alternatives.
- **3-Slot Blank-by-Default Comparison Drawer**: Clean, uncluttered comparison slots allowing users to pick tools manually.
- **Enterprise Admin Console (`/admin`)**: Real-time platform telemetry, user management, audit activity logs, and system health status.
- **Saved Tools Workspace (`/saved`)**: Custom collection bookmarking with an interactive directory explorer empty state.
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

---

## Tech Stack Overview

| Category | Technology |
|---|---|
| **Framework** | Next.js 16.3.1 (Turbopack, App Router) |
| **Library** | React 19.2.8 |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4, Vanilla CSS Custom Properties |
| **Motion** | Framer Motion 12 |
| **Icons** | Lucide React |
| **Auth** | NextAuth.js v5 (beta 32) |
| **Database** | Prisma ORM 7, LibSQL / SQLite / Supabase |

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

# 2. Run local development server
npm run dev

# 3. Synchronize tools from ML pipeline
npm run sync:tools

# 4. Production build
npm run build

# 5. Start production server
npm run start
```

---

## License

Internal major academic project.
