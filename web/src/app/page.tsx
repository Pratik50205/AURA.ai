'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { 
  Sparkles, 
  Search, 
  ArrowRight, 
  Bot, 
  Cpu, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  Compass, 
  TrendingUp, 
  Bookmark, 
  Star,
  ExternalLink,
  ChevronRight,
  Flame,
  Layers,
  Award,
  Clock,
  Heart,
  ArrowLeftRight,
  Sun,
  Moon,
  SlidersHorizontal,
  Code2,
  Video,
  Mic,
  Palette,
  Shield,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { tools } from '@/data/tools';
import type { Tool } from '@/lib/site';
import AuraAssistantModal from '@/components/AuraAssistantModal';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const FEATURED_CHIPS = [
  { label: 'Prompt: Write SEO Blog', query: 'write detailed blog post with engaging introduction' },
  { label: 'Prompt: Scaffold API Routes', query: 'generate REST API routes with prisma database' },
  { label: 'Code Copilots', query: 'best AI coding assistant' },
  { label: 'Prompt: Photorealistic Render', query: 'hyper-realistic minimalist architectural tech studio background' },
  { label: 'Voice Synthesis', query: 'realistic AI voice generator voiceover' },
  { label: 'Vector Search & RAG', query: 'embedding retrieval RAG database' },
];

const CURATED_WORKFLOWS = [
  {
    id: 'wf_avatar_presenter',
    title: 'Avatar Presenter Studio',
    description: 'Produce photorealistic video presentations with synthetic AI avatars without cameras or physical studio hardware.',
    difficulty: 'Beginner',
    duration: '1 hour',
    steps: 2,
    toolsUsed: ['HeyGen', 'ElevenLabs', 'Midjourney'],
    category: 'Video & Audio',
    likesCount: 142
  },
  {
    id: 'wf_backend_builder',
    title: 'Autonomous Backend Builder',
    description: 'Scaffold production REST/GraphQL APIs, Prisma database models, vector tables, and auth services from architecture prompts.',
    difficulty: 'Intermediate',
    duration: '3 hours',
    steps: 3,
    toolsUsed: ['Cursor', 'Prisma', 'Supabase'],
    category: 'Engineering',
    likesCount: 289
  },
  {
    id: 'wf_brand_style',
    title: 'Brand Identity & Vector Forge',
    description: 'Synthesize cohesive vector iconsets, typography scales, conversion color palettes, and interactive design kits.',
    difficulty: 'Beginner',
    duration: '1.5 hours',
    steps: 3,
    toolsUsed: ['Adobe Firefly', 'Midjourney', 'Canva AI'],
    category: 'Design & Media',
    likesCount: 195
  },
  {
    id: 'wf_code_ship',
    title: 'Prompt to Production Pipeline',
    description: 'Accelerated development pipeline: specification drafting, test-driven refactoring, security scan, and Vercel edge deployment.',
    difficulty: 'Advanced',
    duration: '2 hours',
    steps: 4,
    toolsUsed: ['Claude 3.5 Sonnet', 'Cursor', 'GitHub Copilot', 'Vercel'],
    category: 'Fullstack Dev',
    likesCount: 421
  },
  {
    id: 'wf_seo_ranker',
    title: 'AI SEO & Semantic Content Engine',
    description: 'Mine search intent gaps, synthesize data-backed technical articles, and optimize lexical density for rank authority.',
    difficulty: 'Beginner',
    duration: '2 hours',
    steps: 3,
    toolsUsed: ['Perplexity', 'ChatGPT Plus', 'Surfer SEO'],
    category: 'Content Marketing',
    likesCount: 167
  },
  {
    id: 'wf_podcast_mastering',
    title: 'Podcast Mastering & Studio Audio',
    description: 'Remove microphone room reverb, generate dynamic synthetic intro tracks, and publish chapter timestamps automatically.',
    difficulty: 'Beginner',
    duration: '45 mins',
    steps: 3,
    toolsUsed: ['Adobe Podcast', 'Descript', 'AIVA'],
    category: 'Music & Audio',
    likesCount: 230
  }
];

const TAXONOMY_CATEGORIES = [
  { id: 'coding', name: 'Coding & Development', count: '36 Tools', desc: 'AI coding copilots, automated refactoring, and dev tools' },
  { id: 'data', name: 'Data & Analytics', count: '24 Tools', desc: 'Autonomous SQL queries, analytics synthesis, and vector engines' },
  { id: 'image', name: 'Image & Design', count: '42 Tools', desc: 'Text-to-image synthesis, neural canvas, and visual generation' },
  { id: 'audio', name: 'Music & Audio', count: '18 Tools', desc: 'Soundtrack composition, voice cloning, and audio mastering' },
  { id: 'business', name: 'Business & Marketing', count: '28 Tools', desc: 'High-conversion copywriting, market intel, and CRM automation' },
  { id: 'chatbot', name: 'AI Chatbots & Agents', count: '48 Tools', desc: 'Frontier reasoning LLMs, autonomous agents, and assistants' },
];

export default function LandingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLightMode, setIsLightMode] = useState(true);
  const [likedTools, setLikedTools] = useState<Record<string, boolean>>({});
  const [savedTools, setSavedTools] = useState<Record<string, boolean>>({});
  const [comparedTools, setComparedTools] = useState<Record<string, boolean>>({});
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const user = session?.user;
  const isAdmin = (user as any)?.role === 'ADMIN';

  // Read theme on mount - default to LIGHT unless explicitly dark
  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem('aura-theme-preference');
      const isDark = storedTheme === 'false' || storedTheme === '"dark"';
      setIsLightMode(!isDark);
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    } catch {
      setIsLightMode(true);
      document.documentElement.setAttribute('data-theme', 'light');
    }

    // Load saved tools
    try {
      const saved = localStorage.getItem('aura-saved-tools');
      if (saved) {
        const arr: string[] = JSON.parse(saved);
        const map: Record<string, boolean> = {};
        arr.forEach(id => { map[id] = true; });
        setSavedTools(map);
      }
    } catch {
      // ignore
    }
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    const nextMode = !isLightMode;
    setIsLightMode(nextMode);
    document.documentElement.setAttribute('data-theme', nextMode ? 'light' : 'dark');
    try {
      localStorage.setItem('aura-theme-preference', JSON.stringify(nextMode));
    } catch {
      // ignore
    }
  };

  const showToast = (message: string) => {
    setFeedbackToast(message);
    setTimeout(() => setFeedbackToast(null), 2500);
  };

  const handleToggleLike = (toolId: string) => {
    setLikedTools(prev => {
      const current = Boolean(prev[toolId]);
      showToast(current ? 'Removed from favorites' : 'Added to favorites');
      return { ...prev, [toolId]: !current };
    });
  };

  const handleToggleSave = (toolId: string) => {
    setSavedTools(prev => {
      const next = { ...prev, [toolId]: !prev[toolId] };
      try {
        const activeIds = Object.keys(next).filter(id => next[id]);
        localStorage.setItem('aura-saved-tools', JSON.stringify(activeIds));
      } catch {
        // ignore
      }
      showToast(prev[toolId] ? 'Removed from saved tools' : 'Saved to your workspace');
      return next;
    });
  };

  const handleToggleCompare = (toolId: string) => {
    setComparedTools(prev => {
      const next = { ...prev, [toolId]: !prev[toolId] };
      showToast(prev[toolId] ? 'Removed from comparison tray' : 'Added to comparison tray');
      return next;
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/discover?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/discover');
    }
  };

  const handleChipClick = (query: string) => {
    router.push(`/discover?q=${encodeURIComponent(query)}`);
  };

  // Slice tools for showcase
  const recommendedTools = tools.slice(0, 6);
  const trendingTools = tools.slice(6, 12);
  const topRatedTools = [...tools].sort((a, b) => b.trustScore - a.trustScore).slice(0, 6);

  return (
    <div className={cn(
      "min-h-screen selection:bg-[#D9042B] selection:text-white overflow-x-hidden font-sans transition-colors duration-300",
      isLightMode 
        ? "bg-[#F8FAFC] text-slate-900" 
        : "bg-[#090A0F] text-white"
    )}>
      {/* Toast Notification */}
      <AnimatePresence>
        {feedbackToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[6000] px-4 py-2.5 rounded-full shadow-2xl text-xs font-semibold backdrop-blur-xl border flex items-center gap-2 bg-[#D9042B] text-white border-red-400/40 shadow-red-500/20"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>{feedbackToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Ambient Radial Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={cn(
          "absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[550px] rounded-full blur-[130px] transition-opacity duration-700",
          isLightMode
            ? "bg-gradient-to-tr from-[#D9042B]/10 via-[#FF7B00]/8 to-transparent opacity-80"
            : "bg-gradient-to-tr from-[#D9042B]/22 via-[#FF7B00]/12 to-transparent opacity-100"
        )} />
        <div className={cn(
          "absolute top-1/3 -left-48 w-[600px] h-[600px] rounded-full blur-[140px] transition-opacity duration-700",
          isLightMode
            ? "bg-purple-500/5 opacity-60"
            : "bg-purple-600/12 opacity-80"
        )} />
        <div className={cn(
          "absolute top-2/3 -right-48 w-[600px] h-[600px] rounded-full blur-[140px] transition-opacity duration-700",
          isLightMode
            ? "bg-[#D9042B]/6 opacity-60"
            : "bg-[#D9042B]/12 opacity-80"
        )} />
      </div>

      <Header
        isLightMode={isLightMode}
        toggleTheme={toggleTheme}
        userName={user?.name || undefined}
        userEmail={user?.email || undefined}
        userRole={user?.role || undefined}
        userAvatar={user?.image || undefined}
      />


      <main className="relative z-10 flex-1">
        {/* ========================================================
            Hero Section with Craly & AURA Unified Design
           ======================================================== */}
        <section className="relative pt-16 sm:pt-20 pb-20 px-4 sm:px-6 text-center max-w-5xl mx-auto">
          {/* Top Sparkling Badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold mb-6 backdrop-blur-xl shadow-sm bg-gradient-to-r from-red-500/10 via-orange-500/10 to-red-500/10 text-red-600 dark:text-red-300 border-red-500/30"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FF3344] animate-pulse" />
            <span className="tracking-wide uppercase font-bold text-[11px]">AI UTILITY RECOMMENDATION PLATFORM</span>
          </motion.div>

          {/* Hero Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className={cn(
              "text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.12] mb-6",
              isLightMode ? "text-slate-900" : "text-white"
            )}
          >
            Discover, Benchmark & Master <br />
            <span className="text-gradient">Artificial Intelligence</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.18 }}
            className={cn(
              "text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-8",
              isLightMode ? "text-slate-600" : "text-white/70"
            )}
          >
            Stop wasting hours across cluttered lists and sponsored SEO links. Explore 320+ curated AI tools, execute guided multi-step creative pipelines, and copy tested prompts designed for creators, builders, and developers.
          </motion.p>

          {/* Hero Natural Language Search Box */}
          <motion.form
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.25 }}
            onSubmit={handleSearchSubmit}
            className="relative max-w-2xl mx-auto mb-6"
          >
            <div className={cn(
              "relative flex items-center p-2 rounded-2xl border shadow-xl backdrop-blur-2xl transition-all focus-within:border-red-500/60 focus-within:ring-4 focus-within:ring-red-500/10",
              isLightMode
                ? "bg-white/90 border-slate-200/90 shadow-slate-200/60"
                : "bg-[#13131e]/90 border-white/15 shadow-2xl"
            )}>
              <Search className="w-5 h-5 text-slate-400 dark:text-white/40 ml-4 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type any prompt or search 320+ tools (e.g. 'write blog post with SEO', 'Cursor')..."
                className={cn(
                  "w-full bg-transparent px-4 py-3 text-sm sm:text-base focus:outline-none transition-colors",
                  isLightMode
                    ? "text-slate-900 placeholder:text-slate-400"
                    : "text-white placeholder:text-white/40"
                )}
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-[#D9042B] to-[#FF7B00] text-white hover:opacity-95 shadow-md shadow-red-500/30 active:scale-95 transition-all shrink-0 flex items-center gap-2"
              >
                <span>Discover</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.form>

          {/* Popular Suggestion Chips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.32 }}
            className="flex flex-wrap items-center justify-center gap-2 text-xs mb-10"
          >
            <span className={cn(
              "font-semibold mr-1",
              isLightMode ? "text-slate-500" : "text-white/50"
            )}>
              Popular:
            </span>
            {FEATURED_CHIPS.map((chip) => (
              <button
                key={chip.label}
                onClick={() => handleChipClick(chip.query)}
                className={cn(
                  "px-3 py-1.5 rounded-xl border transition-all text-xs font-medium",
                  isLightMode
                    ? "bg-white border-slate-200 text-slate-700 hover:border-red-500/40 hover:text-red-600 shadow-sm"
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                {chip.label}
              </button>
            ))}
          </motion.div>

          {/* Dual Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.38 }}
            className="flex items-center justify-center gap-3.5 flex-wrap mb-14"
          >
            <Link
              href="/discover"
              className="px-7 py-3.5 rounded-2xl text-sm sm:text-base font-bold text-white bg-gradient-to-r from-[#D9042B] to-[#FF7B00] shadow-xl shadow-red-500/25 hover:opacity-95 active:scale-95 transition-all flex items-center gap-2"
            >
              <span>Explore All AI Tools</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#workflows"
              className={cn(
                "px-7 py-3.5 rounded-2xl text-sm sm:text-base font-semibold border backdrop-blur-xl transition-all flex items-center gap-2",
                isLightMode
                  ? "bg-white border-slate-200 text-slate-800 hover:bg-slate-50 shadow-sm"
                  : "bg-white/5 border-white/15 text-white hover:bg-white/10 shadow-lg"
              )}
            >
              <Layers className="w-4 h-4 text-[#FF7B00]" />
              <span>Browse AI Workflows</span>
            </a>
          </motion.div>

          {/* Floating Metrics Capsule (Craly & AURA Unified) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.44 }}
            className={cn(
              "inline-flex items-center justify-center gap-6 sm:gap-8 px-6 sm:px-10 py-4 rounded-full border backdrop-blur-2xl shadow-xl flex-wrap",
              isLightMode
                ? "bg-white/90 border-slate-200 shadow-slate-200/50"
                : "bg-white/[0.04] border-white/10 shadow-2xl"
            )}
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" />
              <span className={cn("font-bold", isLightMode ? "text-slate-900" : "text-white")}>320+</span>
              <span className={cn("text-xs", isLightMode ? "text-slate-500" : "text-white/60")}>Verified Tools</span>
            </div>
            <div className={cn("w-px h-4", isLightMode ? "bg-slate-200" : "bg-white/10")} />
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-500" />
              <span className={cn("font-bold", isLightMode ? "text-slate-900" : "text-white")}>40+</span>
              <span className={cn("text-xs", isLightMode ? "text-slate-500" : "text-white/60")}>Actionable Pipelines</span>
            </div>
            <div className={cn("w-px h-4", isLightMode ? "bg-slate-200" : "bg-white/10")} />
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-500" />
              <span className={cn("font-bold", isLightMode ? "text-slate-900" : "text-white")}>23</span>
              <span className={cn("text-xs", isLightMode ? "text-slate-500" : "text-white/60")}>Curated Categories</span>
            </div>
            <div className={cn("w-px h-4 hidden md:block", isLightMode ? "bg-slate-200" : "bg-white/10")} />
            <div className="hidden md:flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#FF3344]" />
              <span className={cn("font-bold", isLightMode ? "text-slate-900" : "text-white")}>&lt; 40ms</span>
              <span className={cn("text-xs", isLightMode ? "text-slate-500" : "text-white/60")}>Dense Vector Search</span>
            </div>
          </motion.div>
        </section>

        {/* ========================================================
            Live Directory Highlight Banner (Craly Style)
           ======================================================== */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-20">
          <div className={cn(
            "p-8 sm:p-12 rounded-3xl border backdrop-blur-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden transition-all shadow-xl",
            isLightMode
              ? "bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/80 border-blue-200/80 shadow-indigo-100/50"
              : "bg-gradient-to-r from-blue-950/40 via-purple-950/30 to-slate-950/50 border-blue-500/30 shadow-black/60"
          )}>
            <div className="max-w-2xl">
              <div className="inline-flex mb-3">
                <span className="badge badge-brand text-xs px-3 py-1 font-bold">LIVE DIRECTORY</span>
              </div>
              <h2 className={cn(
                "text-2xl sm:text-3xl font-black mb-2 tracking-tight",
                isLightMode ? "text-slate-900" : "text-white"
              )}>
                Discover Curated AI Tools & Automated Workflows
              </h2>
              <p className={cn(
                "text-sm sm:text-base leading-relaxed",
                isLightMode ? "text-slate-600" : "text-white/70"
              )}>
                Benchmark capabilities, copy tested prompts, and supercharge your creative and technical output with verified trust ratings.
              </p>
            </div>
            <Link
              href="/discover"
              className="px-6 py-3.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-[#D9042B] to-[#FF7B00] shadow-lg shadow-red-500/25 hover:opacity-95 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <span>Explore Directory</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* ========================================================
            Section 1: Recommended AI Tools (Tailored For You)
           ======================================================== */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-24">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Tailored For You
                </span>
              </div>
              <h2 className={cn("text-2xl sm:text-3xl font-extrabold tracking-tight", isLightMode ? "text-slate-900" : "text-white")}>
                Recommended AI Tools
              </h2>
              <p className={cn("text-xs sm:text-sm mt-1", isLightMode ? "text-slate-500" : "text-white/60")}>
                Intelligently selected based on vector similarity, popularity, and trust benchmarks
              </p>
            </div>
            <Link
              href="/discover"
              className={cn(
                "text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors",
                isLightMode ? "text-red-600 hover:text-red-700" : "text-red-400 hover:text-red-300"
              )}
            >
              <span>Tune Interests</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedTools.map((tool: Tool) => (
              <div
                key={tool.id}
                className={cn(
                  "p-6 rounded-3xl border flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden",
                  isLightMode
                    ? "bg-white border-slate-200/90 shadow-sm hover:shadow-xl hover:border-red-500/30"
                    : "bg-[#12131C] border-white/10 hover:border-red-500/40 hover:bg-[#161724]"
                )}
              >
                <div>
                  {/* Tool Header: Icon + Name + Category + Action Icons */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <Link href={`/discover/${tool.id}`} className="flex items-center gap-3.5 no-underline group-hover:opacity-95">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center p-2.5 overflow-hidden shrink-0 border transition-transform group-hover:scale-105",
                        isLightMode ? "bg-slate-100 border-slate-200" : "bg-[#1E2333] border-white/10"
                      )}>
                        <img
                          src={tool.icon}
                          alt={tool.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = `https://logo.clearbit.com/${tool.name.toLowerCase().replace(/\s+/g, '')}.com`;
                          }}
                        />
                      </div>
                      <div>
                        <h3 className={cn(
                          "text-base font-bold transition-colors line-clamp-1",
                          isLightMode ? "text-slate-900 group-hover:text-red-600" : "text-white group-hover:text-red-400"
                        )}>
                          {tool.name}
                        </h3>
                        <span className={cn("text-xs font-medium", isLightMode ? "text-slate-500" : "text-white/50")}>
                          {tool.category}
                        </span>
                      </div>
                    </Link>

                    {/* Quick Card Controls: Compare + Save */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleToggleCompare(tool.id)}
                        className={cn(
                          "p-2 rounded-xl border transition-all active:scale-95",
                          comparedTools[tool.id]
                            ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30"
                            : isLightMode
                              ? "bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-900"
                              : "bg-white/5 border-white/10 text-white/50 hover:text-white"
                        )}
                        title="Add to compare tray"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleSave(tool.id)}
                        className={cn(
                          "p-2 rounded-xl border transition-all active:scale-95",
                          savedTools[tool.id]
                            ? "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30"
                            : isLightMode
                              ? "bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-900"
                              : "bg-white/5 border-white/10 text-white/50 hover:text-white"
                        )}
                        title="Save to workspace"
                      >
                        <Bookmark className={cn("w-3.5 h-3.5", savedTools[tool.id] && "fill-current")} />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <p className={cn(
                    "text-xs sm:text-sm line-clamp-2 leading-relaxed mb-4",
                    isLightMode ? "text-slate-600" : "text-white/70"
                  )}>
                    {tool.description}
                  </p>

                  {/* Tag Pills */}
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {tool.tags.slice(0, 3).map((tag: string, idx: number) => (
                      <span key={idx} className="tag-pill">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Bar: Pricing + Likes + Visit + Details */}
                <div className={cn(
                  "flex items-center justify-between pt-4 border-t",
                  isLightMode ? "border-slate-100" : "border-white/10"
                )}>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-xs px-2.5 py-1 rounded-lg font-semibold",
                      tool.pricing === 'Free' ? "badge-emerald" : tool.pricing === 'Freemium' ? "badge-brand" : "badge-amber"
                    )}>
                      {tool.pricing}
                    </span>
                    <button
                      onClick={() => handleToggleLike(tool.id)}
                      className={cn(
                        "text-xs flex items-center gap-1 transition-colors",
                        likedTools[tool.id] ? "text-red-500 font-bold" : isLightMode ? "text-slate-500 hover:text-slate-800" : "text-white/50 hover:text-white"
                      )}
                    >
                      <Heart className={cn("w-3.5 h-3.5", likedTools[tool.id] && "fill-current text-red-500")} />
                      <span>{likedTools[tool.id] ? (tool.trustScore + 1) : tool.trustScore}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1",
                        isLightMode
                          ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800"
                          : "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                      )}
                    >
                      <span>Visit</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <Link
                      href={`/discover/${tool.id}`}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#D9042B] to-[#FF7B00] shadow-sm hover:opacity-95 transition-all"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================
            Section 2: Trending AI Tools (Viral & Surging)
           ======================================================== */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-24">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-[#EF4444]" />
                <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                  Viral & Surging
                </span>
              </div>
              <h2 className={cn("text-2xl sm:text-3xl font-extrabold tracking-tight", isLightMode ? "text-slate-900" : "text-white")}>
                Trending AI Tools
              </h2>
              <p className={cn("text-xs sm:text-sm mt-1", isLightMode ? "text-slate-500" : "text-white/60")}>
                Fastest-growing AI utilities with the highest community engagement & benchmarks
              </p>
            </div>
            <Link
              href="/discover"
              className={cn(
                "text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors",
                isLightMode ? "text-red-600 hover:text-red-700" : "text-red-400 hover:text-red-300"
              )}
            >
              <span>See All Trending</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingTools.map((tool: Tool) => (
              <div
                key={tool.id}
                className={cn(
                  "p-6 rounded-3xl border flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden",
                  isLightMode
                    ? "bg-white border-slate-200/90 shadow-sm hover:shadow-xl hover:border-red-500/30"
                    : "bg-[#12131C] border-white/10 hover:border-red-500/40 hover:bg-[#161724]"
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <Link href={`/discover/${tool.id}`} className="flex items-center gap-3.5 no-underline group-hover:opacity-95">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center p-2.5 overflow-hidden shrink-0 border transition-transform group-hover:scale-105",
                        isLightMode ? "bg-slate-100 border-slate-200" : "bg-[#1E2333] border-white/10"
                      )}>
                        <img
                          src={tool.icon}
                          alt={tool.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = `https://logo.clearbit.com/${tool.name.toLowerCase().replace(/\s+/g, '')}.com`;
                          }}
                        />
                      </div>
                      <div>
                        <h3 className={cn(
                          "text-base font-bold transition-colors line-clamp-1",
                          isLightMode ? "text-slate-900 group-hover:text-red-600" : "text-white group-hover:text-red-400"
                        )}>
                          {tool.name}
                        </h3>
                        <span className={cn("text-xs font-medium", isLightMode ? "text-slate-500" : "text-white/50")}>
                          {tool.category}
                        </span>
                      </div>
                    </Link>

                    <span className="badge badge-amber text-xs font-bold px-2 py-0.5">
                      ★ {tool.trustScore}% Trust
                    </span>
                  </div>

                  <p className={cn(
                    "text-xs sm:text-sm line-clamp-2 leading-relaxed mb-4",
                    isLightMode ? "text-slate-600" : "text-white/70"
                  )}>
                    {tool.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {tool.tags.slice(0, 3).map((tag: string, idx: number) => (
                      <span key={idx} className="tag-pill">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className={cn(
                  "flex items-center justify-between pt-4 border-t",
                  isLightMode ? "border-slate-100" : "border-white/10"
                )}>
                  <span className={cn("text-xs font-semibold", isLightMode ? "text-slate-500" : "text-white/60")}>
                    {tool.users} active builders
                  </span>

                  <div className="flex items-center gap-2">
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1",
                        isLightMode
                          ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800"
                          : "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                      )}
                    >
                      <span>Visit</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <Link
                      href={`/discover/${tool.id}`}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#D9042B] to-[#FF7B00] shadow-sm hover:opacity-95 transition-all"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================
            Section 3: Step-by-Step AI Workflows (Automated Pipelines)
           ======================================================== */}
        <section id="workflows" className="max-w-7xl mx-auto px-4 sm:px-6 mb-24">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Automated Pipelines
                </span>
              </div>
              <h2 className={cn("text-2xl sm:text-3xl font-extrabold tracking-tight", isLightMode ? "text-slate-900" : "text-white")}>
                Step-by-Step AI Workflows
              </h2>
              <p className={cn("text-xs sm:text-sm mt-1", isLightMode ? "text-slate-500" : "text-white/60")}>
                Multi-tool generative pipelines to create videos, rank articles, synthesize code, and build apps
              </p>
            </div>
            <Link
              href="/discover"
              className={cn(
                "text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors",
                isLightMode ? "text-red-600 hover:text-red-700" : "text-red-400 hover:text-red-300"
              )}
            >
              <span>View All Pipelines</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CURATED_WORKFLOWS.map((wf) => (
              <div
                key={wf.id}
                className={cn(
                  "p-6 sm:p-7 rounded-3xl border flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden",
                  isLightMode
                    ? "bg-white border-slate-200/90 shadow-sm hover:shadow-xl hover:border-red-500/30"
                    : "bg-[#12131C] border-white/10 hover:border-red-500/40 hover:bg-[#161724]"
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-xs px-2.5 py-0.5 rounded-full font-bold",
                        wf.difficulty === 'Beginner' ? "badge-emerald" : wf.difficulty === 'Intermediate' ? "badge-blue" : "badge-amber"
                      )}>
                        {wf.difficulty}
                      </span>
                      <span className={cn(
                        "inline-flex items-center gap-1 text-xs font-medium",
                        isLightMode ? "text-slate-500" : "text-white/50"
                      )}>
                        <Clock className="w-3 h-3" />
                        {wf.duration}
                      </span>
                    </div>

                    <span className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-md",
                      isLightMode ? "bg-slate-100 text-slate-600" : "bg-white/5 text-white/60"
                    )}>
                      {wf.category}
                    </span>
                  </div>

                  <h3 className={cn(
                    "text-lg font-bold mb-2 transition-colors",
                    isLightMode ? "text-slate-900 group-hover:text-red-600" : "text-white group-hover:text-red-400"
                  )}>
                    {wf.title}
                  </h3>

                  <p className={cn(
                    "text-xs sm:text-sm line-clamp-2 leading-relaxed mb-5",
                    isLightMode ? "text-slate-600" : "text-white/70"
                  )}>
                    {wf.description}
                  </p>

                  {/* Pipeline Steps Badge Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-6">
                    {wf.toolsUsed.map((toolName, tIdx) => (
                      <span
                        key={tIdx}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1",
                          isLightMode
                            ? "bg-slate-50 border-slate-200 text-slate-700"
                            : "bg-white/5 border-white/10 text-white/80"
                        )}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF3344]" />
                        {toolName}
                      </span>
                    ))}
                  </div>
                </div>

                <div className={cn(
                  "flex items-center justify-between pt-4 border-t",
                  isLightMode ? "border-slate-100" : "border-white/10"
                )}>
                  <div className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-semibold">
                    <Layers className="w-3.5 h-3.5" />
                    <span>{wf.steps} Step Pipeline</span>
                  </div>

                  <Link
                    href={`/discover?q=${encodeURIComponent(wf.title)}`}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#D9042B] to-[#FF7B00] shadow-sm hover:opacity-95 transition-all flex items-center gap-1"
                  >
                    <span>View Pipeline</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================
            Section 4: Browse By Category (Capability Tiles)
           ======================================================== */}
        <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 mb-24">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Compass className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Taxonomy Collections
                </span>
              </div>
              <h2 className={cn("text-2xl sm:text-3xl font-extrabold tracking-tight", isLightMode ? "text-slate-900" : "text-white")}>
                Browse By Category
              </h2>
              <p className={cn("text-xs sm:text-sm mt-1", isLightMode ? "text-slate-500" : "text-white/60")}>
                Explore vetted tools by modality, architectural capability, and technical application
              </p>
            </div>
            <Link
              href="/discover"
              className={cn(
                "text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors",
                isLightMode ? "text-red-600 hover:text-red-700" : "text-red-400 hover:text-red-300"
              )}
            >
              <span>All 23 Categories</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TAXONOMY_CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={`/discover?category=${encodeURIComponent(cat.name)}`}
                className={cn(
                  "p-6 rounded-3xl border flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden min-h-[150px]",
                  isLightMode
                    ? "bg-white border-slate-200/90 shadow-sm hover:shadow-xl hover:border-red-500/30"
                    : "bg-[#12131C] border-white/10 hover:border-red-500/40 hover:bg-[#161724]"
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={cn(
                      "text-base font-bold transition-colors",
                      isLightMode ? "text-slate-900 group-hover:text-red-600" : "text-white group-hover:text-red-400"
                    )}>
                      {cat.name}
                    </h3>
                    <span className="badge badge-brand text-xs px-2.5 py-0.5">
                      {cat.count}
                    </span>
                  </div>
                  <p className={cn(
                    "text-xs sm:text-sm leading-relaxed",
                    isLightMode ? "text-slate-600" : "text-white/70"
                  )}>
                    {cat.desc}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 mt-5 group-hover:translate-x-1 transition-transform">
                  <span>Explore Collection</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ========================================================
            Section 5: Enterprise Core Architecture & Features (AURA)
           ======================================================== */}
        <section id="architecture" className="max-w-7xl mx-auto px-4 sm:px-6 mb-24">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="badge badge-brand text-xs px-3 py-1 font-bold mb-3">ENTERPRISE CORE FEATURES</span>
            <h2 className={cn("text-3xl sm:text-4xl font-extrabold tracking-tight mt-2", isLightMode ? "text-slate-900" : "text-white")}>
              Engineered for Precision, Trust & Speed
            </h2>
            <p className={cn("text-sm sm:text-base mt-3", isLightMode ? "text-slate-600" : "text-white/60")}>
              High-throughput vector indexing and multi-signal semantic fusion built for enterprise discovery
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className={cn(
              "p-8 rounded-3xl border transition-all duration-300 relative overflow-hidden group hover:-translate-y-1",
              isLightMode
                ? "bg-white border-slate-200/90 shadow-sm hover:shadow-xl hover:border-red-500/30"
                : "bg-[#12131C] border-white/10 hover:border-red-500/30"
            )}>
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-[#FF3344] mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className={cn("text-xl font-bold mb-3", isLightMode ? "text-slate-900" : "text-white")}>
                Hybrid Dense & Lexical Search
              </h3>
              <p className={cn("text-xs sm:text-sm leading-relaxed", isLightMode ? "text-slate-600" : "text-white/60")}>
                Combines 384-dimensional dense semantic vectors (<code className="text-red-500 font-mono text-[11px]">all-MiniLM-L6-v2</code>) via Meta FAISS FlatIP with Okapi BM25 sparse keyword ranking through Reciprocal Rank Fusion.
              </p>
            </div>

            <div className={cn(
              "p-8 rounded-3xl border transition-all duration-300 relative overflow-hidden group hover:-translate-y-1",
              isLightMode
                ? "bg-white border-slate-200/90 shadow-sm hover:shadow-xl hover:border-purple-500/30"
                : "bg-[#12131C] border-white/10 hover:border-purple-500/30"
            )}>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className={cn("text-xl font-bold mb-3", isLightMode ? "text-slate-900" : "text-white")}>
                Role-Based Access Control
              </h3>
              <p className={cn("text-xs sm:text-sm leading-relaxed", isLightMode ? "text-slate-600" : "text-white/60")}>
                Integrated Administrator and User permission tiers. Admins manage tool verification, user accounts, and review moderation directly from the dedicated Admin Console.
              </p>
            </div>

            <div className={cn(
              "p-8 rounded-3xl border transition-all duration-300 relative overflow-hidden group hover:-translate-y-1",
              isLightMode
                ? "bg-white border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-500/30"
                : "bg-[#12131C] border-white/10 hover:border-blue-500/30"
            )}>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 mb-6">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className={cn("text-xl font-bold mb-3", isLightMode ? "text-slate-900" : "text-white")}>
                Interactive AURA Copilot
              </h3>
              <p className={cn("text-xs sm:text-sm leading-relaxed", isLightMode ? "text-slate-600" : "text-white/60")}>
                Floating neural chat assistant equipped with side-by-side product comparison matrices, budget winner calculation, and 1-click workspace bookmarking.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================
            Section 6: Call To Action Banner
           ======================================================== */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-24 text-center">
          <div className={cn(
            "p-10 sm:p-16 rounded-3xl border shadow-2xl relative overflow-hidden backdrop-blur-2xl transition-all",
            isLightMode
              ? "bg-gradient-to-b from-red-50/70 via-white to-orange-50/60 border-red-200/80 shadow-red-100/40"
              : "bg-gradient-to-b from-red-950/20 via-[#0B0C14] to-black border-red-500/20 shadow-black"
          )}>
            <div className="inline-flex mb-4">
              <span className="badge badge-brand text-xs px-3.5 py-1 font-bold">READY TO SCALE</span>
            </div>
            <h2 className={cn(
              "text-3xl sm:text-5xl font-black tracking-tight mb-5",
              isLightMode ? "text-slate-900" : "text-white"
            )}>
              Accelerate Your AI Workflow Today
            </h2>
            <p className={cn(
              "text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-8",
              isLightMode ? "text-slate-600" : "text-white/70"
            )}>
              Create your account in seconds, explore vector-indexed AI utilities, and build your personalized generative workflow stack.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
              {user ? (
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-sm sm:text-base font-bold text-white bg-gradient-to-r from-[#D9042B] to-[#FF7B00] shadow-xl shadow-red-500/25 hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span>Go to Your Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-sm sm:text-base font-bold text-white bg-gradient-to-r from-[#D9042B] to-[#FF7B00] shadow-xl shadow-red-500/25 hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Get Started for Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/login"
                    className={cn(
                      "w-full sm:w-auto px-8 py-3.5 rounded-2xl text-sm sm:text-base font-semibold border transition-all",
                      isLightMode
                        ? "bg-white border-slate-200 text-slate-800 hover:bg-slate-50"
                        : "bg-white/5 border-white/15 text-white hover:bg-white/10"
                    )}
                  >
                    Sign In
                  </Link>
                </>
              )}
              <Link
                href="/discover"
                className={cn(
                  "w-full sm:w-auto px-8 py-3.5 rounded-2xl text-sm sm:text-base font-semibold border transition-all",
                  isLightMode
                    ? "bg-white border-slate-200 text-slate-800 hover:bg-slate-50"
                    : "bg-white/5 border-white/15 text-white hover:bg-white/10"
                )}
              >
                Explore Directory
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Aura AI Assistant Modal & FAB Trigger */}
      <AuraAssistantModal />

      <Footer isLightMode={isLightMode} />

    </div>
  );
}
