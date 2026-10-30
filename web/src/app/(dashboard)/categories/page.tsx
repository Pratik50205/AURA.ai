'use client';

import Link from 'next/link';
import { 
  Sparkles, 
  Grid, 
  ArrowRight, 
  Bot, 
  Code2, 
  Palette, 
  Video, 
  Mic, 
  Briefcase, 
  ShieldCheck, 
  TrendingUp, 
  Layers,
  Cpu
} from 'lucide-react';
import { useDashboard } from '@/app/(dashboard)/layout';
import { cn } from '@/lib/utils';
import { getCategories, tools } from '@/data/tools';

const CATEGORY_META: Record<string, { icon: any; color: string; desc: string }> = {
  'Coding & Development': {
    icon: Code2,
    color: 'from-blue-500 to-cyan-500',
    desc: 'AI coding assistants, pair programmers, test synthesizers, and full-stack scaffolding tools.'
  },
  'Design & Creative': {
    icon: Palette,
    color: 'from-pink-500 to-rose-500',
    desc: 'Generative image studios, vector graphics generators, branding kits, and UI prototyping engines.'
  },
  'Video & Animation': {
    icon: Video,
    color: 'from-red-500 to-amber-500',
    desc: 'Synthetic video generation, automated subtitling, talking avatars, and video enhancers.'
  },
  'Audio & Voice': {
    icon: Mic,
    color: 'from-amber-500 to-yellow-500',
    desc: 'Neural voice cloning, music generation, acoustic mastering, and speech-to-text models.'
  },
  'Writing & Content': {
    icon: Bot,
    color: 'from-emerald-500 to-teal-500',
    desc: 'Longform technical drafting, SEO copy optimization, editorial assistants, and summarization.'
  },
  'Productivity & Workflow': {
    icon: Briefcase,
    color: 'from-purple-500 to-indigo-500',
    desc: 'Meeting transcription copilots, email synthesizers, automated task schedulers, and agents.'
  },
  'Research & Science': {
    icon: Cpu,
    color: 'from-violet-500 to-purple-600',
    desc: 'Dense paper citation engines, mathematical solvers, biological modelers, and RAG search.'
  },
  'Business & Marketing': {
    icon: TrendingUp,
    color: 'from-orange-500 to-red-500',
    desc: 'Conversion rate optimizers, multi-channel ad copy engines, CRM intelligence, and analytics.'
  }
};

export default function CategoriesPage() {
  const { isLightMode } = useDashboard();
  const categories = getCategories();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-12 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-3 border badge-brand">
          <Grid className="w-3.5 h-3.5 text-[#FF3344]" />
          <span>CURATED DOMAINS</span>
        </div>
        <h1 className={cn(
          "text-3xl sm:text-5xl font-black tracking-tight",
          isLightMode ? "text-slate-900" : "text-white"
        )}>
          Explore AI by Category
        </h1>
        <p className={cn("mt-3 text-sm sm:text-base leading-relaxed", isLightMode ? "text-slate-600" : "text-white/70")}>
          Navigate our indexed taxonomy of verified artificial intelligence utilities categorized by operational discipline.
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const meta = CATEGORY_META[cat.key] || {
            icon: Sparkles,
            color: 'from-red-500 to-orange-500',
            desc: `Explore top-rated AI tools, models, and workflows curated for ${cat.key}.`
          };
          const Icon = meta.icon;
          const matchingTools = tools.filter((t) => t.category.toLowerCase().includes(cat.key.toLowerCase())).slice(0, 3);

          return (
            <Link
              key={cat.key}
              href={`/discover?category=${encodeURIComponent(cat.key)}`}
              className={cn(
                "p-6 rounded-3xl border transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between relative overflow-hidden",
                isLightMode
                  ? "bg-white border-slate-200/90 shadow-sm hover:shadow-xl hover:border-red-500/30"
                  : "bg-[#12131C] border-white/10 hover:border-red-500/40 hover:bg-[#161724] shadow-xl"
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl bg-gradient-to-tr flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform",
                    meta.color
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={cn(
                    "text-xs px-3 py-1 rounded-full font-mono font-bold border",
                    isLightMode ? "bg-slate-100 border-slate-200 text-slate-700" : "bg-white/5 border-white/10 text-white/70"
                  )}>
                    {cat.count} Tools
                  </span>
                </div>

                <h3 className={cn(
                  "text-xl font-bold tracking-tight transition-colors group-hover:text-red-500",
                  isLightMode ? "text-slate-900" : "text-white"
                )}>
                  {cat.key}
                </h3>
                <p className={cn("text-xs sm:text-sm mt-2 leading-relaxed line-clamp-2", isLightMode ? "text-slate-600" : "text-white/60")}>
                  {meta.desc}
                </p>

                {/* Sample Tool Thumbnails */}
                <div className="mt-5 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top:</span>
                  <div className="flex -space-x-2 overflow-hidden">
                    {matchingTools.map((t) => (
                      <div
                        key={t.id}
                        className={cn(
                          "w-6 h-6 rounded-lg border flex items-center justify-center p-0.5 overflow-hidden shrink-0",
                          isLightMode ? "bg-white border-slate-200" : "bg-[#1E2333] border-white/10"
                        )}
                        title={t.name}
                      >
                        <img src={t.icon} alt={t.name} className="w-full h-full object-contain" />
                      </div>
                    ))}
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 ml-1">
                    {matchingTools.map((t) => t.name).join(', ')}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs font-bold text-red-500 group-hover:translate-x-0.5 transition-transform">
                <span>Browse {cat.key}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
