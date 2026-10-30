'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeftRight, 
  Sparkles, 
  Check, 
  X, 
  ExternalLink, 
  Star, 
  Plus, 
  Trash2,
  ChevronDown,
  RotateCcw
} from 'lucide-react';
import { useDashboard } from '@/app/(dashboard)/layout';
import { cn } from '@/lib/utils';
import { tools } from '@/data/tools';
import type { Tool } from '@/lib/site';

export default function ComparePage() {
  const { isLightMode } = useDashboard();
  
  // Exactly three comparison slots on the right, starting BLANK with no presets as requested
  const [slotToolIds, setSlotToolIds] = useState<(string | null)[]>([null, null, null]);

  const handleSelectTool = (slotIndex: number, toolId: string) => {
    setSlotToolIds((prev) => {
      const next = [...prev];
      next[slotIndex] = toolId || null;
      return next;
    });
  };

  const handleClearSlot = (slotIndex: number) => {
    setSlotToolIds((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
  };

  const handleClearAll = () => {
    setSlotToolIds([null, null, null]);
  };

  const slotTools: (Tool | null)[] = slotToolIds.map((id) => 
    id ? (tools.find((t) => t.id === id) || null) : null
  );

  const hasAnySelected = slotToolIds.some(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-10 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-3 border badge-brand">
          <ArrowLeftRight className="w-3.5 h-3.5 text-blue-500" />
          <span>SIDE-BY-SIDE MATRIX</span>
        </div>
        <h1 className={cn(
          "text-3xl sm:text-5xl font-black tracking-tight",
          isLightMode ? "text-slate-900" : "text-white"
        )}>
          Compare AI Tools
        </h1>
        <p className={cn("mt-3 text-sm sm:text-base leading-relaxed", isLightMode ? "text-slate-600" : "text-white/70")}>
          Select up to 3 AI tools to compare capabilities, pricing models, verified trust metrics, and latency side-by-side.
        </p>

        {hasAnySelected && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleClearAll}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5",
                isLightMode 
                  ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700" 
                  : "bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white"
              )}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Slots</span>
            </button>
          </div>
        )}
      </div>

      {/* Compare Matrix Card */}
      <div className={cn(
        "rounded-3xl border overflow-hidden shadow-xl transition-all",
        isLightMode ? "bg-white border-slate-200" : "bg-[#12131C] border-white/10"
      )}>
        {/* Top Controls: 1 Label Column + 3 Tool Selector Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 border-b divide-y md:divide-y-0 md:divide-x border-slate-200 dark:border-white/10 divide-slate-200 dark:divide-white/10">
          {/* Column 0: Label Column (NOT used for tool comparison) */}
          <div className="p-6 hidden md:flex flex-col justify-between bg-slate-500/[0.02]">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Specifications
              </span>
              <h2 className={cn("text-base font-bold", isLightMode ? "text-slate-900" : "text-white")}>
                Features & Metrics
              </h2>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Use the dropdowns on the right to select tools for comparison.
            </p>
          </div>

          {/* Columns 1, 2, 3: The Three Comparison Slots */}
          {[0, 1, 2].map((slotIdx) => {
            const tool = slotTools[slotIdx];
            return (
              <div key={slotIdx} className="p-6 relative group flex flex-col justify-between min-h-[160px]">
                {/* Tool Selector Dropdown */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="relative flex-1">
                    <select
                      value={tool?.id || ''}
                      onChange={(e) => handleSelectTool(slotIdx, e.target.value)}
                      className={cn(
                        "w-full text-xs font-bold py-2.5 pl-3 pr-8 rounded-xl border appearance-none focus:outline-none transition-colors cursor-pointer",
                        tool
                          ? isLightMode ? "bg-slate-50 border-slate-300 text-slate-900" : "bg-white/10 border-white/20 text-white"
                          : isLightMode ? "bg-slate-100 border-dashed border-slate-300 text-slate-500" : "bg-white/5 border-dashed border-white/15 text-white/50"
                      )}
                    >
                      <option value="" className="bg-slate-900 text-white">
                        + Select Tool {slotIdx + 1}
                      </option>
                      {tools.map((t) => (
                        <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                          {t.name} ({t.category})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>

                  {tool && (
                    <button
                      onClick={() => handleClearSlot(slotIdx)}
                      className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-500/10 transition-colors"
                      title="Clear this slot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Slot Content: Active Tool Identity OR Blank State */}
                {tool ? (
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl border flex items-center justify-center p-2 overflow-hidden shrink-0 shadow-sm",
                      isLightMode ? "bg-slate-100 border-slate-200" : "bg-[#1E2333] border-white/10"
                    )}>
                      <img src={tool.icon} alt={tool.name} className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h3 className={cn("text-base font-bold", isLightMode ? "text-slate-900" : "text-white")}>
                        {tool.name}
                      </h3>
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded font-semibold inline-block mt-0.5",
                        tool.pricing === 'Free' ? "badge-emerald" : tool.pricing === 'Freemium' ? "badge-brand" : "badge-amber"
                      )}>
                        {tool.pricing}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-2xl border border-dashed text-center",
                    isLightMode ? "border-slate-200 bg-slate-50/50 text-slate-400" : "border-white/10 bg-white/[0.01] text-white/40"
                  )}>
                    <Plus className="w-5 h-5 mb-1 opacity-60" />
                    <span className="text-xs font-semibold">Slot {slotIdx + 1} Empty</span>
                    <span className="text-[10px] opacity-75">Choose a tool above</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Row 1: Domain & Category */}
        <div className="grid grid-cols-1 md:grid-cols-4 border-b divide-y md:divide-y-0 md:divide-x border-slate-200 dark:border-white/10 divide-slate-200 dark:divide-white/10 text-xs">
          <div className="p-4 font-bold text-slate-400 uppercase tracking-wider bg-slate-500/5 flex items-center">
            Domain & Category
          </div>
          {[0, 1, 2].map((slotIdx) => {
            const tool = slotTools[slotIdx];
            return (
              <div key={slotIdx} className="p-4 flex items-center font-semibold text-slate-700 dark:text-slate-200 min-h-[48px]">
                {tool ? tool.category : <span className="text-slate-400/60">—</span>}
              </div>
            );
          })}
        </div>

        {/* Row 2: Pricing Tier */}
        <div className="grid grid-cols-1 md:grid-cols-4 border-b divide-y md:divide-y-0 md:divide-x border-slate-200 dark:border-white/10 divide-slate-200 dark:divide-white/10 text-xs">
          <div className="p-4 font-bold text-slate-400 uppercase tracking-wider bg-slate-500/5 flex items-center">
            Pricing Model
          </div>
          {[0, 1, 2].map((slotIdx) => {
            const tool = slotTools[slotIdx];
            return (
              <div key={slotIdx} className="p-4 flex items-center min-h-[48px]">
                {tool ? (
                  <span className={cn(
                    "text-xs px-2.5 py-0.5 rounded font-semibold",
                    tool.pricing === 'Free' ? "badge-emerald" : tool.pricing === 'Freemium' ? "badge-brand" : "badge-amber"
                  )}>
                    {tool.pricing}
                  </span>
                ) : (
                  <span className="text-slate-400/60">—</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Row 3: Verified Trust Score */}
        <div className="grid grid-cols-1 md:grid-cols-4 border-b divide-y md:divide-y-0 md:divide-x border-slate-200 dark:border-white/10 divide-slate-200 dark:divide-white/10 text-xs">
          <div className="p-4 font-bold text-slate-400 uppercase tracking-wider bg-slate-500/5 flex items-center">
            Verified Trust Score
          </div>
          {[0, 1, 2].map((slotIdx) => {
            const tool = slotTools[slotIdx];
            return (
              <div key={slotIdx} className="p-4 flex items-center gap-2 min-h-[48px]">
                {tool ? (
                  <>
                    <span className="font-mono font-bold text-sm text-[#FF3344]">{tool.trustScore}/100</span>
                    <div className="flex text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                    </div>
                  </>
                ) : (
                  <span className="text-slate-400/60">—</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Row 4: Core Capability */}
        <div className="grid grid-cols-1 md:grid-cols-4 border-b divide-y md:divide-y-0 md:divide-x border-slate-200 dark:border-white/10 divide-slate-200 dark:divide-white/10 text-xs">
          <div className="p-4 font-bold text-slate-400 uppercase tracking-wider bg-slate-500/5 flex items-center">
            Core Capability
          </div>
          {[0, 1, 2].map((slotIdx) => {
            const tool = slotTools[slotIdx];
            return (
              <div key={slotIdx} className="p-4 leading-relaxed text-slate-600 dark:text-slate-300 min-h-[72px]">
                {tool ? tool.description : <span className="text-slate-400/60">—</span>}
              </div>
            );
          })}
        </div>

        {/* Row 5: Tags & Keywords */}
        <div className="grid grid-cols-1 md:grid-cols-4 border-b divide-y md:divide-y-0 md:divide-x border-slate-200 dark:border-white/10 divide-slate-200 dark:divide-white/10 text-xs">
          <div className="p-4 font-bold text-slate-400 uppercase tracking-wider bg-slate-500/5 flex items-center">
            Tags & Keywords
          </div>
          {[0, 1, 2].map((slotIdx) => {
            const tool = slotTools[slotIdx];
            return (
              <div key={slotIdx} className="p-4 flex flex-wrap gap-1 min-h-[52px]">
                {tool ? (
                  tool.tags.map((t, i) => (
                    <span key={i} className="tag-pill text-[10px]">
                      #{t}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400/60">—</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Row 6: Direct Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x border-slate-200 dark:border-white/10 divide-slate-200 dark:divide-white/10 text-xs">
          <div className="p-4 font-bold text-slate-400 uppercase tracking-wider bg-slate-500/5 flex items-center">
            Direct Action
          </div>
          {[0, 1, 2].map((slotIdx) => {
            const tool = slotTools[slotIdx];
            return (
              <div key={slotIdx} className="p-4 flex items-center gap-2 min-h-[56px]">
                {tool ? (
                  <>
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2 rounded-xl text-center font-bold text-white bg-gradient-to-r from-[#D9042B] to-[#FF7B00] hover:opacity-95 shadow-md shadow-red-500/20 transition-all flex items-center justify-center gap-1"
                    >
                      <span>Visit Tool</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <Link
                      href={`/discover/${tool.id}`}
                      className={cn(
                        "px-3 py-2 rounded-xl font-semibold border transition-colors",
                        isLightMode ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700" : "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                      )}
                    >
                      Details
                    </Link>
                  </>
                ) : (
                  <span className="text-slate-400/60">—</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
