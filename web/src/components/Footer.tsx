'use client';

import Link from 'next/link';
import { 
  Sparkles, 
  Shield, 
  Heart, 
  ExternalLink, 
  Compass, 
  Layers, 
  ArrowLeftRight, 
  Bookmark, 
  LayoutDashboard,
  CheckCircle2,
  Terminal,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FooterProps {
  isLightMode?: boolean;
}

export default function Footer({ isLightMode = true }: FooterProps) {
  return (
    <footer className={cn(
      "border-t transition-colors duration-300 w-full mt-auto relative z-20",
      isLightMode 
        ? "border-slate-200/90 bg-white/95 text-slate-600" 
        : "border-white/10 bg-[#0B0D14]/95 text-white/60"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 sm:gap-12 mb-12">
          {/* Brand Info & Mission */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-3 group select-none">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden shadow-lg shadow-red-500/25 group-hover:scale-105 transition-all">
                <img src="/aura-icon.svg" alt="AURA" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col line-tight">
                <span className={cn(
                  "text-lg font-black tracking-tight transition-colors",
                  isLightMode ? "text-slate-900" : "text-white"
                )}>
                  AURA<span className="text-[#FF3344]">.ai</span>
                </span>
                <span className="text-[9px] font-bold tracking-widest text-[#FF7B00] uppercase -mt-0.5">
                  AI UTILITY RECOMMENDATION
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm leading-relaxed">
              Autonomous neural recommendation engine matching modern builders, creators, and engineering teams with verified AI utilities.
            </p>
          </div>

          {/* Column 1: Explore Directory */}
          <div>
            <h4 className={cn("text-xs font-bold uppercase tracking-wider mb-4", isLightMode ? "text-slate-900" : "text-white")}>
              Explore Directory
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="/discover" className="hover:text-[#D9042B] transition-colors flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#FF3344]" />
                  <span>All 320+ AI Tools</span>
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-[#D9042B] transition-colors">
                  Categorized Collections
                </Link>
              </li>
              <li>
                <Link href="/workflows" className="hover:text-[#D9042B] transition-colors flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#FF7B00]" />
                  <span>Step-by-Step Workflows</span>
                </Link>
              </li>
              <li>
                <Link href="/compare" className="hover:text-[#D9042B] transition-colors flex items-center gap-1.5">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-blue-500" />
                  <span>Comparison Matrix</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Workspace & Tools */}
          <div>
            <h4 className={cn("text-xs font-bold uppercase tracking-wider mb-4", isLightMode ? "text-slate-900" : "text-white")}>
              Workspace & AI
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link href="/saved" className="hover:text-[#D9042B] transition-colors flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                  <span>Saved Bookmarks</span>
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[#D9042B] transition-colors flex items-center gap-1.5">
                  <LayoutDashboard className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Analytics Dashboard</span>
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-[#D9042B] transition-colors">
                  Personal Preferences
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-[#D9042B] transition-colors">
                  Admin Console
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform & Trust */}
          <div>
            <h4 className={cn("text-xs font-bold uppercase tracking-wider mb-4", isLightMode ? "text-slate-900" : "text-white")}>
              Platform & Trust
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified AI Directory</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#FF7B00]" />
                <span>BM25 + FAISS Dense Search</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-blue-500" />
                <span>Reciprocal Rank Fusion (RRF)</span>
              </li>
              <li className="pt-2">
                <span className={cn(
                  "text-[11px] px-2.5 py-1 rounded-lg border font-mono inline-block",
                  isLightMode ? "bg-slate-100 border-slate-200 text-slate-600" : "bg-white/5 border-white/10 text-white/50"
                )}>
                  Latency: ~24ms FAISS Query
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className={cn(
          "pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs",
          isLightMode ? "border-slate-200 text-slate-500" : "border-white/10 text-white/50"
        )}>
          <div>
            © 2026 AURA.ai. All rights reserved. Built with neural precision.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/discover" className="hover:text-[#D9042B] transition-colors">Directory</Link>
            <Link href="/workflows" className="hover:text-[#D9042B] transition-colors">Workflows</Link>
            <Link href="/compare" className="hover:text-[#D9042B] transition-colors">Compare</Link>
            <span className="flex items-center gap-1 text-slate-400">
              Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-current inline-block" /> for AI builders
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
