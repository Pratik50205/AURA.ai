# AURA.ai 🌟

**AURA.ai** is an intelligent, AI-powered tool discovery and recommendation platform built with the modern Next.js 16 App Router. The AI market is rapidly expanding, leaving users overwhelmed by thousands of new utilities. AURA solves the problem of *endless searching* by acting as a context-aware hub. Users can describe what they want to achieve, and AURA will instantly recommend the most reliable, trusted, and verified AI tools for the job.

---

## 🚀 Project Roadmap

The development of AURA.ai is strategically divided into 6 major phases:

- ✅ **Phase 1: Frontend & Authentication**
  - Built a responsive, hyper-modern, glassmorphism UI with Tailwind CSS v4
  - Implemented core pages: Dashboard, Discover, Saved Tools, Settings, Login, Register
  - Added a curated directory of 50+ trending AI tools categorized by utility
  - Developed functional filtering, global search UI, and tool bookmarking states
  - **Complete authentication system**: NextAuth v5 (beta) with GitHub, Google OAuth + Email/Password credentials
  - Protected routes with middleware, JWT session strategy, Prisma adapter

- 🔄 **Phase 2: Backend & Database** (In Progress)
  - PostgreSQL database architecture via Prisma ORM for user accounts, tool directories, and saved states
  - Supabase PostgreSQL integration with driver adapter
  - API routes for handling client-server data flow securely
  - User profile management and saved tools persistence

- ⏳ **Phase 3: Semantic Search & ML**
  - Building the actual semantic search engine to understand user context
  - Implementing algorithms to assign and update dynamic "Trust Scores" based on community data
  - Vector embeddings for AI tool similarity matching

- ⏳ **Phase 4: AI Assistant**
  - Integrating a conversational AI interface (chatbot/assistant) to help users query the directory naturally
  - Natural language tool recommendations

- ⏳ **Phase 5: Polish & Optimization**
  - Comprehensive UI/UX polish, bug squashing, and performance optimization
  - Accessibility improvements, SEO optimization

- ⏳ **Phase 6: Deployment & Testing**
  - E2E testing, load testing, and deploying to production (Vercel + Supabase)
  - CI/CD pipeline, monitoring, analytics

---

## 🛠️ Tech Stack

### Frontend



### Backend & Authentication
| Technology | Version | Purpose |
|------------|---------|---------|
| **NextAuth.js** | 5.0.0-beta.32 | Authentication framework (v5 beta) |
| **@auth/prisma-adapter** | 2.11.3 | Prisma database adapter for NextAuth |
| **bcryptjs** | 3.0.3 | Password hashing |
| **JWT Strategy** | Built-in | Stateless session management |

### Database & ORM
| Technology | Version | Purpose |
|------------|---------|---------|
| **Prisma ORM** | 7.9.1 | Type-safe database access with new config format |
| **@prisma/adapter-pg** | 7.9.1 | PostgreSQL driver adapter for Supabase |
| **PostgreSQL** | 15+ | Primary database (Supabase hosted) |
| **pg** | 8.23.0 | PostgreSQL client for driver adapter |

### Infrastructure & Services
| Technology | Purpose |
|------------|---------|
| **Supabase** | PostgreSQL hosting, real-time, auth helpers |
| **@supabase/ssr** | Server-side Supabase client for Next.js |
| **Vercel** | Deployment platform (planned) |
| **GitHub OAuth** | Social authentication provider |
| **Google OAuth** | Social authentication provider |

### Developer Experience
| Tool | Purpose |
|------|---------|
| **ESLint** | Code linting with Next.js config |
| **TypeScript** | Static type checking |
| **PostCSS** | CSS processing with Tailwind v4 |
| **Turbopack** | Fast development bundler |

---

## 📁 Project Structure

```
AURA.ai/
├── prisma/
│   ├── schema.prisma          # Database schema (User, Account, Session, VerificationToken, SavedTool)
│   └── migrations/            # Database migration history
├── prisma.config.ts           # Prisma config (new format, no datasource in schema)
├── src/
│   ├── app/
│   │   ├── (auth)/            # Auth route group (no layout)
│   │   │   ├── login/page.tsx     # Login page with OAuth + credentials
│   │   │   └── register/page.tsx  # Register redirect to login?mode=register
│   │   ├── (dashboard)/       # Dashboard route group (with layout)
│   │   │   ├── layout.tsx         # Dashboard layout + DashboardProvider
│   │   │   ├── dashboard/page.tsx # Main dashboard with search & categories
│   │   │   ├── discover/page.tsx  # Tool discovery with filters
│   │   │   ├── discover/[id]/     # Tool detail page
│   │   │   ├── saved/page.tsx     # User's saved tools
│   │   │   └── settings/page.tsx  # Profile settings (connected to session)
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/route.ts  # NextAuth handler
│   │   │   │   └── register/route.ts       # Email/password registration
│   │   ├── layout.tsx         # Root layout with SessionProvider + ThemeInitializer
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── ui/                # Reusable UI components (Button, Input)
│   │   ├── Header.tsx         # Navigation with user avatar, theme toggle
│   │   ├── Sidebar.tsx        # Category navigation
│   │   ├── ToolCard.tsx       # AI tool display card
│   │   └── ThemeInitializer.tsx # Theme persistence (localStorage + SSR)
│   ├── lib/
│   │   ├── auth/
│   │   │   └── config.ts      # NextAuth configuration with providers & callbacks
│   │   ├── supabase/
│   │   │   └── client.ts      # Supabase SSR client
│   │   ├── prisma.ts          # Prisma singleton with driver adapter
│   │   ├── utils.ts           # cn() helper, formatting utilities
│   │   └── site.ts            # Site configuration metadata
│   ├── data/
│   │   └── tools.ts           # Curated AI tools dataset (50+ tools)
│   └── middleware.ts          # Route protection (redirects to /login)
├── public/                    # Static assets (icons, images)
├── .env                       # Environment variables (gitignored)
├── .env.example               # Environment template
├── next.config.ts             # Next.js configuration
├── tailwind.config.js         # Tailwind v4 config (CSS-first)
├── tsconfig.json              # TypeScript config
├── package.json
└── README.md
```

---

## 🔐 Authentication System

### Providers Configured
- **GitHub OAuth** - `GITHUB_ID`, `GITHUB_SECRET`
- **Google OAuth** - `GOOGLE_ID`, `GOOGLE_SECRET`
- **Email/Password Credentials** - Custom implementation with bcrypt

### Security Features
- **JWT Session Strategy** - Stateless, scalable sessions
- **Password Hashing** - bcryptjs with 12 rounds
- **CSRF Protection** - Built into NextAuth v5
- **Route Protection** - Middleware redirects unauthenticated users to `/login?callbackUrl=...`
- **Session Provider** - Wraps entire app for `useSession()` hook access

### Database Models (Prisma)
```prisma
User            // Core user account
Account         // OAuth provider accounts (GitHub, Google)
Session         // Active sessions (JWT-based, but stored for adapter)
VerificationToken // Email verification tokens
SavedTool       // User's bookmarked AI tools (many-to-one with User)
```

---

## 🎨 UI/UX Features

- **Glassmorphism Design** - Frosted glass cards with backdrop blur
- **Dark/Light Mode** - Persisted in localStorage, SSR-safe with ThemeInitializer
- **Responsive Layout** - Mobile-first, collapsible sidebar
- **Animations** - Framer Motion page transitions, hover effects
- **Loading States** - Suspense boundaries for async components
- **Accessibility** - Semantic HTML, ARIA labels, focus management

---

## 📦 Getting Started

### Prerequisites
- Node.js 20+
- npm/pnpm/yarn
- Supabase account (for PostgreSQL)
- GitHub/Google OAuth apps (optional)

### Installation

1. **Clone and install dependencies**
   ```bash
   cd AURA.ai
   npm install
   ```

### Run the AIML service locally

Run the Next.js app and the warm Python service in separate terminals. The Python service loads the embedding model once and keeps it in memory, so recommendations do not reload the model for every search.

Terminal 1:

```powershell
cd "c:\Pratik\Major Project copy\major project\aiml"
python -m uvicorn src.inference.api:app --host 127.0.0.1 --port 8000
```

Terminal 2:

```powershell
cd "c:\Pratik\Major Project copy\major project\AURA.ai"
npm run dev
```

The Next.js API calls `http://127.0.0.1:8000` automatically. To use another URL, set `AURA_AIML_URL` in the AURA.ai environment.

### Run the complete stack with Docker

From the `major project` folder, create a `.env` file with at least `NEXTAUTH_SECRET`, then run:

```powershell
docker compose up --build -d
```

This starts both services, keeps the embedding model warm, caches its model files in a Docker volume, and exposes only AURA.ai at `http://localhost:3000`. Check service status with:

```powershell
docker compose ps
docker compose logs -f aura aiml
```

For deployment, use the same compose stack on a VPS or deploy the two containers separately. Set `AURA_AIML_URL` to the private or public URL of the AIML service and provide production values for `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, and `DATABASE_URL`.

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your credentials:
   ```env
   # Database (Supabase PostgreSQL)
   DATABASE_URL="postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres?schema=public"
   DIRECT_URL="postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres?schema=public"

   # NextAuth
   NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
   NEXTAUTH_URL="http://localhost:3000"

   # GitHub OAuth (optional)
   GITHUB_ID=""
   GITHUB_SECRET=""

   # Google OAuth (optional)
   GOOGLE_ID=""
   GOOGLE_SECRET=""

   # Supabase (for direct client usage)
   NEXT_PUBLIC_SUPABASE_URL="https://PROJECT.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   ```

3. **Set up database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate dev --name init
   
   # Optional: Open Prisma Studio
   npx prisma studio
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000`

### Generate NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```

---

## 🧪 Testing the Auth Flow

1. **Register**: Visit `/register` → redirects to `/login?mode=register`
2. **Sign Up**: Fill form → creates user in Supabase → auto-signs in → redirects to `/dashboard`
3. **Sign In**: Visit `/login` → OAuth buttons or email/password → redirects to `/dashboard`
4. **Settings**: Visit `/settings` → view/update profile from live session
5. **Protected Routes**: `/dashboard`, `/discover`, `/saved`, `/settings` require authentication

---

## 🗄️ Database Commands

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name migration_name

# Push schema without migration (dev only)
npx prisma db push

# Open Prisma Studio (GUI)
npx prisma studio

# Reset database (dev only)
npx prisma migrate reset

# Deploy migrations (production)
npx prisma migrate deploy
```

---

## 📝 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Supabase PostgreSQL connection string with `?schema=public` |
| `DIRECT_URL` | ✅ | Same as DATABASE_URL for Prisma migrations |
| `NEXTAUTH_SECRET` | ✅ | 32+ char secret for JWT signing |
| `NEXTAUTH_URL` | ✅ | Base URL of your app (localhost:3000 for dev) |
| `GITHUB_ID` | ❌ | GitHub OAuth App Client ID |
| `GITHUB_SECRET` | ❌ | GitHub OAuth App Client Secret |
| `GOOGLE_ID` | ❌ | Google Cloud OAuth Client ID |
| `GOOGLE_SECRET` | ❌ | Google Cloud OAuth Client Secret |
| `NEXT_PUBLIC_SUPABASE_URL` | ❌ | Supabase project URL for client-side |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ❌ | Supabase anon/public key |

---

## 🚢 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

### Supabase Setup
1. Create project at supabase.com
2. Get connection string from Settings → Database
3. Enable GitHub/Google auth in Supabase Auth providers (optional)
4. Run migrations: `npx prisma migrate deploy`

---

## 📄 License

MIT License - feel free to use this project for learning or as a starter.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run build` and `npm run lint`
5. Submit a PR

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [NextAuth.js](https://next-auth.js.org/) - Authentication for Next.js
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [Lucide](https://lucide.dev/) - Beautiful icons
- [shadcn/ui](https://ui.shadcn.com/) - Component inspiration

---

**Built with ❤️ using Next.js 16, React 19, and the modern TypeScript ecosystem.**
