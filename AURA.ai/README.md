# AURA.ai Frontend Web Application
**Intelligent AI Tool Discovery & Neural Recommendation Platform**

This is the official Next.js 16 web application for **AURA.ai**. Built with the Next.js App Router, React 19, Tailwind CSS 4, and Framer Motion, it features an interactive **AI Assistant Chatbot Copilot**, real-time **side-by-side tool comparison matrices**, and a **Live ML Recommendation Core Telemetry Dashboard**.

---

## Key Highlights

- **AURA Assistant Chatbot**: Persistent floating orb expanding into a full slide-out chat drawer. Performs neural vector tool matching, side-by-side tool comparisons (*"Compare Cursor vs GitHub Copilot"*), and 1-click in-chat bookmarking.
- **Dynamic Catalog Discovery (`/discover`)**: Instant filtering across 23 AI categories, search with query expansion, and sortable tool cards.
- **Detailed Tool Inspection (`/discover/[id]`)**: Deep-dive views showcasing verified trust scores, key features, pros & cons, example prompts, and alternatives.
- **Saved Tools Workspace (`/saved`)**: Custom collection bookmarking with an interactive directory explorer empty state.
- **Settings & ML Diagnostics (`/settings`)**: Live telemetry card showing model parameters (*all-MiniLM-L6-v2*, *384-d*, *FAISS FlatIP*, *latency ~39ms*), profile persistence, and dual-theme controls.
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
  - 108 curated tools synchronized from the ML dataset.

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
  - 100% Next.js production build pass rate (`12/12 routes compiled`).
  - Sub-40ms response latency.
  - Repository published to [GitHub](https://github.com/Pratik50205/AURA.ai).

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

Create `.env.local` in `AURA.ai/`:

```env
# NextAuth Configuration
AUTH_SECRET="aura-production-secret-encryption-key-32-chars-minimum"
NEXTAUTH_SECRET="aura-production-secret-encryption-key-32-chars-minimum"
NEXTAUTH_URL="http://localhost:3000"

# AI/ML Backend Service
AURA_AIML_URL="http://127.0.0.1:8000"
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
