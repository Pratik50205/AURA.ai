'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '@/app/(dashboard)/layout';
import ToolCard from '@/components/ToolCard';
import { tools } from '@/data/tools';
import { Bookmark, Compass, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function SavedToolsPage() {
  const { savedTools, toggleSaveTool, isLightMode, user } = useDashboard();
  const savedToolsData = tools.filter((tool) => savedTools.includes(tool.id));

  return (
    <div className="max-w-7xl mx-auto pb-16 px-4 sm:px-6">
      <div className="mb-8 pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3 border badge-brand">
          <Sparkles className="w-3.5 h-3.5 text-[#FF3344]" />
          <span>WORKSPACE BOOKMARKS</span>
        </div>
        <h1 className={cn(
          "text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-3",
          isLightMode ? "text-slate-900" : "text-white"
        )}>
          Saved AI Tools
          <span className={cn(
            "text-xs px-3 py-1 rounded-full font-mono font-bold border",
            isLightMode ? "bg-slate-100 border-slate-200 text-slate-600" : "bg-white/5 border-white/10 text-white/60"
          )}>
            {savedToolsData.length} Bookmarked
          </span>
        </h1>
        <p className={cn("mt-2 text-sm sm:text-base max-w-2xl", isLightMode ? "text-slate-600" : "text-white/60")}>
          Access and manage your personal collection of bookmarked AI utilities, tested prompts, and custom generative stacks.
        </p>

        {!user && (
          <div className={cn(
            "mt-5 p-4 rounded-3xl border backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs shadow-sm",
            isLightMode ? "bg-amber-50/90 border-amber-200/90 text-amber-950" : "bg-white/5 border-white/10 text-white/80"
          )}>
            <span className="leading-relaxed">
              💡 <strong>Browsing as Guest:</strong> Sign in with your account to sync your saved bookmarks permanently to cloud database across all devices.
            </span>
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl font-bold text-white bg-gradient-to-r from-[#D9042B] to-[#FF7B00] shrink-0 hover:opacity-95 shadow-sm transition-opacity"
            >
              Sign In to Sync
            </Link>
          </div>
        )}
      </div>

      {savedToolsData.length === 0 ? (
        <div className={cn(
          "flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl border backdrop-blur-xl transition-all",
          isLightMode ? "bg-white border-slate-200 shadow-sm" : "bg-[#12131C] border-white/10"
        )}>
          <div className="w-16 h-16 bg-[#D9042B]/10 border border-[#D9042B]/20 rounded-2xl flex items-center justify-center mb-5 text-[#FF3344] shadow-inner">
            <Bookmark className="w-8 h-8" />
          </div>
          <h2 className={cn("text-2xl font-bold mb-2", isLightMode ? "text-slate-900" : "text-white")}>
            No tools saved yet
          </h2>
          <p className={cn("text-sm max-w-md leading-relaxed mb-6", isLightMode ? "text-slate-500" : "text-white/60")}>
            Explore our curated directory of {tools.length} vector-indexed AI utilities and click the bookmark button on any card to add it to your custom stack.
          </p>

          <Link
            href="/discover"
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#D9042B] to-[#FF7B00] text-white font-bold text-xs sm:text-sm hover:opacity-95 shadow-md shadow-red-500/25 active:scale-95 transition-all flex items-center gap-2"
          >
            <Compass className="w-4 h-4" />
            <span>Explore AI Tools Directory</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedToolsData.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              onToggleSave={toggleSaveTool}
              isSaved={true}
              isLightMode={isLightMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}
