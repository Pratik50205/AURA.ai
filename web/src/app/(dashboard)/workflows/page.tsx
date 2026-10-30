'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Layers, 
  Clock, 
  Award, 
  ArrowRight, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink,
  ChevronRight,
  Flame,
  Zap,
  Filter
} from 'lucide-react';
import { useDashboard } from '@/app/(dashboard)/layout';
import { cn } from '@/lib/utils';
import { tools } from '@/data/tools';

interface Workflow {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  stepsCount: number;
  category: string;
  toolsUsed: string[];
  likesCount: number;
  steps: {
    title: string;
    description: string;
    toolName: string;
    promptTemplate?: string;
  }[];
}

const ALL_WORKFLOWS: Workflow[] = [
  {
    id: 'wf_avatar_presenter',
    title: 'Avatar Presenter Studio',
    description: 'Produce photorealistic video presentations with synthetic AI avatars without physical cameras or studio equipment.',
    difficulty: 'Beginner',
    duration: '1 hour',
    stepsCount: 3,
    category: 'Video & Audio',
    likesCount: 142,
    toolsUsed: ['HeyGen', 'ElevenLabs', 'Midjourney'],
    steps: [
      {
        title: 'Step 1: Voice Persona Generation',
        description: 'Generate high-fidelity vocal tracks with expressive inflection using cloned or synthetic neural voices.',
        toolName: 'ElevenLabs',
        promptTemplate: 'Generate a confident, informative product explanation voiceover for high-growth tech executives.'
      },
      {
        title: 'Step 2: Studio Visual Backdrop',
        description: 'Design ultra-clean modern minimalist office studio backgrounds in 4K resolution.',
        toolName: 'Midjourney',
        promptTemplate: 'hyper-realistic minimalist architectural tech studio background, bokeh soft lighting, neutral tones, 8k --ar 16:9'
      },
      {
        title: 'Step 3: Avatar Video Synthesis',
        description: 'Sync the audio track with photorealistic lip movement and natural head kinematics.',
        toolName: 'HeyGen'
      }
    ]
  },
  {
    id: 'wf_backend_builder',
    title: 'Autonomous Backend Builder',
    description: 'Scaffold production-grade REST & GraphQL APIs, Prisma database schemas, vector tables, and auth services from architecture prompts.',
    difficulty: 'Intermediate',
    duration: '3 hours',
    stepsCount: 3,
    category: 'Engineering',
    likesCount: 289,
    toolsUsed: ['Cursor', 'Prisma', 'Supabase'],
    steps: [
      {
        title: 'Step 1: Relational & Vector Schema Modeling',
        description: 'Generate normalized database entities with pgvector columns and strict foreign keys.',
        toolName: 'Prisma',
        promptTemplate: 'Generate a PostgreSQL schema with NextAuth user accounts, tool records, and 1536-dimensional embedding vectors.'
      },
      {
        title: 'Step 2: AI Code Completion & Route Handlers',
        description: 'Write type-safe API endpoints with zod validation and error boundaries in Next.js.',
        toolName: 'Cursor'
      },
      {
        title: 'Step 3: Serverless Deployment & Real-time Webhooks',
        description: 'Deploy auto-scaling database with real-time replication and Row Level Security.',
        toolName: 'Supabase'
      }
    ]
  },
  {
    id: 'wf_brand_style',
    title: 'Brand Identity & Vector Forge',
    description: 'Synthesize cohesive vector iconsets, typography scales, conversion color palettes, and interactive design kits.',
    difficulty: 'Beginner',
    duration: '1.5 hours',
    stepsCount: 3,
    category: 'Design & Media',
    likesCount: 195,
    toolsUsed: ['Midjourney', 'Adobe Firefly', 'Canva AI'],
    steps: [
      {
        title: 'Step 1: Moodboard & Visual Semantics',
        description: 'Explore aesthetic palettes with futuristic crimson and burnt orange neon accents.',
        toolName: 'Midjourney',
        promptTemplate: 'minimalist dark aesthetic brand system, cybernetic red accents, swiss typography, dribbble trending --v 6.0'
      },
      {
        title: 'Step 2: Vector Asset Tracing & SVG Export',
        description: 'Convert raster mockups into infinite-scale geometric SVGs.',
        toolName: 'Adobe Firefly'
      },
      {
        title: 'Step 3: Social & Marketing Banner Kits',
        description: 'Generate multi-channel launch banners with consistent typography and auto-resizing.',
        toolName: 'Canva AI'
      }
    ]
  },
  {
    id: 'wf_code_ship',
    title: 'Prompt to Production Pipeline',
    description: 'Accelerated development pipeline: specification drafting, test-driven refactoring, security scan, and Vercel edge deployment.',
    difficulty: 'Advanced',
    duration: '2 hours',
    stepsCount: 4,
    category: 'Fullstack Dev',
    likesCount: 421,
    toolsUsed: ['Claude 3.5 Sonnet', 'Cursor', 'GitHub Copilot', 'Vercel'],
    steps: [
      {
        title: 'Step 1: Architecture Specification Drafting',
        description: 'Produce thorough architectural markdown document with endpoints, payloads, and state trees.',
        toolName: 'Claude 3.5 Sonnet',
        promptTemplate: 'Draft a complete architectural RFC for an AI recommendation portal with hybrid BM25 and FAISS dense retrieval.'
      },
      {
        title: 'Step 2: Test-Driven Component Refactoring',
        description: 'Generate unit tests with Vitest and refactor code to achieve 90%+ branch coverage.',
        toolName: 'Cursor'
      },
      {
        title: 'Step 3: Automated Security & Code Review',
        description: 'Scan code for secrets, SQL injection vectors, and dependency vulnerabilities.',
        toolName: 'GitHub Copilot'
      },
      {
        title: 'Step 4: Zero-downtime Edge Deployment',
        description: 'Push git branch to automatically trigger preview deployments and performance audits.',
        toolName: 'Vercel'
      }
    ]
  },
  {
    id: 'wf_seo_ranker',
    title: 'AI SEO & Semantic Content Engine',
    description: 'Mine search intent gaps, synthesize data-backed technical articles, and optimize lexical density for rank authority.',
    difficulty: 'Intermediate',
    duration: '2 hours',
    stepsCount: 3,
    category: 'Marketing',
    likesCount: 178,
    toolsUsed: ['Perplexity', 'ChatGPT', 'Grammarly'],
    steps: [
      {
        title: 'Step 1: Real-time Keyword & SERP Research',
        description: 'Extract recent SERP questions, citations, and intent clusters using live search indexes.',
        toolName: 'Perplexity'
      },
      {
        title: 'Step 2: Longform Semantic Drafting',
        description: 'Structure comprehensive technical tutorials with real code snippets and FAQ blocks.',
        toolName: 'ChatGPT'
      },
      {
        title: 'Step 3: Tone Optimization & Readability Calibration',
        description: 'Refine sentence cadence and verify clarity across reading grade levels.',
        toolName: 'Grammarly'
      }
    ]
  }
];

export default function WorkflowsPage() {
  const { isLightMode } = useDashboard();
  const [activeCategory, setActiveCategory] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = ['All', 'Video & Audio', 'Engineering', 'Design & Media', 'Fullstack Dev', 'Marketing'];

  const filteredWorkflows = activeCategory === 'All'
    ? ALL_WORKFLOWS
    : ALL_WORKFLOWS.filter((wf) => wf.category.toLowerCase().includes(activeCategory.toLowerCase()));

  const handleCopyPrompt = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-10 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-3 border badge-brand">
          <Layers className="w-3.5 h-3.5 text-[#FF7B00]" />
          <span>ACTIONABLE PIPELINES</span>
        </div>
        <h1 className={cn(
          "text-3xl sm:text-5xl font-black tracking-tight",
          isLightMode ? "text-slate-900" : "text-white"
        )}>
          Tested AI Workflows
        </h1>
        <p className={cn("mt-3 text-sm sm:text-base leading-relaxed", isLightMode ? "text-slate-600" : "text-white/70")}>
          Stop wondering how to combine individual AI tools. Follow step-by-step verified creative pipelines with copyable prompt templates.
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 mb-10 scrollbar-hide">
        {categories.map((cat) => {
          const isSelected = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 shadow-sm",
                isSelected
                  ? "bg-gradient-to-r from-[#D9042B] to-[#FF7B00] text-white border-transparent shadow-red-500/25"
                  : isLightMode
                    ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    : "bg-[#12131C] border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Workflows Grid */}
      <div className="space-y-8">
        {filteredWorkflows.map((wf) => (
          <div
            key={wf.id}
            className={cn(
              "p-6 sm:p-8 rounded-3xl border transition-all duration-300 relative overflow-hidden",
              isLightMode
                ? "bg-white border-slate-200/90 shadow-sm hover:shadow-xl"
                : "bg-[#12131C] border-white/10 hover:border-red-500/30 shadow-xl"
            )}
          >
            {/* Top Row: Meta Badges + Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-white/10">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full badge-brand">
                    {wf.category}
                  </span>
                  <span className={cn(
                    "text-[11px] font-semibold px-2.5 py-0.5 rounded-full border",
                    wf.difficulty === 'Beginner' ? "badge-emerald" : wf.difficulty === 'Intermediate' ? "badge-blue" : "badge-amber"
                  )}>
                    {wf.difficulty}
                  </span>
                  <span className={cn("text-xs flex items-center gap-1", isLightMode ? "text-slate-500" : "text-white/50")}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{wf.duration}</span>
                  </span>
                </div>
                <h2 className={cn("text-2xl font-black tracking-tight", isLightMode ? "text-slate-900" : "text-white")}>
                  {wf.title}
                </h2>
                <p className={cn("text-sm mt-1 max-w-3xl leading-relaxed", isLightMode ? "text-slate-600" : "text-white/70")}>
                  {wf.description}
                </p>
              </div>

              {/* Tools Used Pills */}
              <div className="flex flex-col sm:items-end gap-2 shrink-0">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Required Tools</span>
                <div className="flex flex-wrap gap-1.5">
                  {wf.toolsUsed.map((toolName) => (
                    <Link
                      key={toolName}
                      href={`/discover?q=${encodeURIComponent(toolName)}`}
                      className={cn(
                        "text-xs px-3 py-1 rounded-xl font-bold border transition-colors flex items-center gap-1",
                        isLightMode
                          ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800"
                          : "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                      )}
                    >
                      <span>{toolName}</span>
                      <ExternalLink className="w-3 h-3 text-red-500" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Steps Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {wf.steps.map((step, idx) => {
                const stepKey = `${wf.id}_step_${idx}`;
                return (
                  <div
                    key={idx}
                    className={cn(
                      "p-4 rounded-2xl border flex flex-col justify-between transition-colors",
                      isLightMode ? "bg-slate-50/80 border-slate-200" : "bg-[#161726]/80 border-white/5"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#FF3344]">
                          {step.title}
                        </span>
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-md font-bold font-mono border",
                          isLightMode ? "bg-white border-slate-200 text-slate-700" : "bg-white/5 border-white/10 text-white/70"
                        )}>
                          {step.toolName}
                        </span>
                      </div>
                      <p className={cn("text-xs leading-relaxed mb-3", isLightMode ? "text-slate-600" : "text-white/60")}>
                        {step.description}
                      </p>
                    </div>

                    {step.promptTemplate && (
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-white/10">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-slate-400">Prompt Snippet:</span>
                          <button
                            onClick={() => handleCopyPrompt(step.promptTemplate!, stepKey)}
                            className="text-[10px] font-bold text-red-500 hover:text-red-600 flex items-center gap-1"
                          >
                            {copiedId === stepKey ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-500" />
                                <span className="text-emerald-500">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className={cn(
                          "text-[11px] font-mono p-2 rounded-lg border line-clamp-2 select-all",
                          isLightMode ? "bg-white border-slate-200 text-slate-700" : "bg-black/30 border-white/5 text-white/70"
                        )}>
                          &ldquo;{step.promptTemplate}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
