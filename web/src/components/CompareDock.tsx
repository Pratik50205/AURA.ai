'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, X, ArrowRight, Trash2, Sparkles } from 'lucide-react';
import { useCompare } from '@/context/CompareContext';

export default function CompareDock() {
  const { selectedTools, selectedCount, maxTools, removeTool, clearCompare } = useCompare();
  const pathname = usePathname();

  // Hide dock if no tools selected or if user is currently on the dedicated compare page
  if (selectedCount === 0 || pathname === '/compare') {
    return null;
  }

  const toolIds = selectedTools.map((t) => t.id).join(',');
  const canCompare = selectedCount >= 2;

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        aria-label="Tool Comparison Bar"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[94vw] w-auto"
      >
        <div className="flex items-center gap-3 sm:gap-4 px-4 py-2.5 sm:px-5 sm:py-3 rounded-full bg-slate-900/90 dark:bg-black/90 backdrop-blur-xl border border-red-500/40 shadow-2xl shadow-red-950/40 text-foreground">
          {/* Compare Badge Indicator */}
          <div className="flex items-center gap-2 pr-2 border-r border-white/10">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#FF3344] to-[#FF7B00] flex items-center justify-center text-white shadow-sm shadow-red-500/30">
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </div>
            <div className="hidden sm:block">
              <span className="text-xs font-bold text-white tracking-wide">Compare</span>
              <span className="text-[11px] font-semibold text-slate-400 ml-1.5">
                {selectedCount}/{maxTools}
              </span>
            </div>
            <span className="sm:hidden text-xs font-bold text-white">
              {selectedCount}/{maxTools}
            </span>
          </div>

          {/* Selected Tool Chips */}
          <div className="flex items-center gap-2">
            {selectedTools.map((tool) => (
              <div
                key={tool.id}
                className="group relative flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-full bg-white/5 border border-white/10 hover:border-red-500/30 text-xs transition-colors"
              >
                <div className="w-4 h-4 rounded-full bg-red-500/20 text-[#FF7B00] flex items-center justify-center text-[10px] font-bold">
                  {tool.name.charAt(0)}
                </div>
                <span className="max-w-[70px] sm:max-w-[110px] truncate text-slate-200 font-medium">
                  {tool.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeTool(tool.id)}
                  className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-0.5"
                  title={`Remove ${tool.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            <Link
              href={`/compare?ids=${toolIds}`}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-full text-xs font-bold transition-all shadow-md ${
                canCompare
                  ? 'bg-gradient-to-r from-[#FF3344] to-[#FF7B00] text-white hover:brightness-110 shadow-red-500/25'
                  : 'bg-white/10 text-slate-400 pointer-events-none cursor-not-allowed'
              }`}
            >
              <span>{canCompare ? `Compare (${selectedCount})` : 'Select 2+'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={clearCompare}
              className="p-1.5 rounded-full text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors"
              title="Clear comparison list"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}

