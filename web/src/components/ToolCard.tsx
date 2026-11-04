'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Shield, 
  ShieldCheck, 
  ExternalLink, 
  Bookmark, 
  Sparkles,
  Heart,
  ArrowLeftRight,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Tool } from '@/lib/site';
import type { RankedTool } from '@/lib/recommendations';
import { useCompare } from '@/context/CompareContext';

interface ToolCardProps {
  tool: Tool | RankedTool;
  onToggleSave: (toolId: string) => void;
  isSaved: boolean;
  compact?: boolean;
  isLightMode?: boolean;
}

export default function ToolCard({
  tool,
  onToggleSave,
  isSaved,
  compact = false,
  isLightMode = false,
}: ToolCardProps) {
  const router = useRouter();
  const { toggleTool, isToolSelected } = useCompare();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(tool.trustScore || 85);
  const isCompared = isToolSelected(tool.id);

  const handleToggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(prev => !prev);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleToggleCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleTool(tool as Tool);
  };

  const handleToggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSave(tool.id);
  };

  const handleVisitExternal = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('a[href]') ||
      target.tagName === 'BUTTON' ||
      target.tagName === 'A'
    ) {
      return;
    }
    router.push(`/discover/${tool.id}`);
  };

  const getPricingBadgeClass = (pricing: string) => {
    const p = pricing.toLowerCase();
    if (p.includes('free') && !p.includes('freemium')) return 'badge-emerald';
    if (p.includes('freemium')) return 'badge-brand';
    return 'badge-amber';
  };

  // -------------------------------------------------------------
  // Compact Card (used in horizontal shelves & mini preview lists)
  // -------------------------------------------------------------
  if (compact) {
    return (
      <div
        onClick={handleCardClick}
        className={cn(
          "p-5 rounded-3xl border flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 cursor-pointer relative overflow-hidden h-full",
          isLightMode
            ? "bg-white border-slate-200/90 shadow-sm hover:shadow-xl hover:border-red-500/30"
            : "bg-[#12131C] border-white/10 hover:border-red-500/40 hover:bg-[#161724]"
        )}
      >
        <div>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-11 h-11 rounded-2xl flex items-center justify-center p-2 overflow-hidden shrink-0 border transition-transform group-hover:scale-105",
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
                <h4 className={cn(
                  "text-sm font-bold truncate transition-colors flex items-center gap-1.5",
                  isLightMode ? "text-slate-900 group-hover:text-red-600" : "text-white group-hover:text-red-400"
                )}>
                  {tool.name}
                  {tool.verified && <ShieldCheck className="w-3.5 h-3.5 text-[#FF7B00] shrink-0" />}
                </h4>
                <span className={cn("text-xs", isLightMode ? "text-slate-500" : "text-white/50")}>
                  {tool.category}
                </span>
              </div>
            </div>

            <button
              onClick={handleToggleBookmark}
              className={cn(
                "p-2 rounded-xl border transition-all shrink-0",
                isSaved
                  ? "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30"
                  : isLightMode
                    ? "bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-900"
                    : "bg-white/5 border-white/10 text-white/50 hover:text-white"
              )}
              title="Bookmark tool"
            >
              <Bookmark className={cn("w-3.5 h-3.5", isSaved && "fill-current")} />
            </button>
          </div>

          <p className={cn(
            "text-xs line-clamp-2 leading-relaxed mb-4",
            isLightMode ? "text-slate-600" : "text-white/70"
          )}>
            {tool.description}
          </p>
        </div>

        <div className={cn(
          "flex items-center justify-between pt-3 border-t",
          isLightMode ? "border-slate-100" : "border-white/10"
        )}>
          <span className={cn("text-[11px] px-2 py-0.5 rounded-md font-semibold", getPricingBadgeClass(tool.pricing))}>
            {tool.pricing}
          </span>
          <div className="flex items-center gap-2">
            <a
              href={tool.url}
              target="_blank"
              rel="noreferrer"
              onClick={handleVisitExternal}
              className={cn(
                "px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1",
                isLightMode ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200" : "bg-white/5 hover:bg-white/10 text-white border-white/10"
              )}
            >
              <span>Visit</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Full Card (used in Discover, Saved, & Catalog grid)
  // -------------------------------------------------------------
  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "p-6 rounded-3xl border flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1.5 cursor-pointer relative overflow-hidden h-full",
        isLightMode
          ? "bg-white border-slate-200/90 shadow-sm hover:shadow-2xl hover:border-red-500/35"
          : "bg-[#12131C] border-white/10 hover:border-red-500/40 hover:bg-[#161724] hover:shadow-2xl hover:shadow-red-500/5"
      )}
    >
      <div>
        {/* Top Header: Icon + Name + Category + Action Icons */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3.5">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center p-2.5 overflow-hidden shrink-0 border transition-transform group-hover:scale-105 shadow-sm",
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
                "text-base font-bold transition-colors line-clamp-1 flex items-center gap-1.5",
                isLightMode ? "text-slate-900 group-hover:text-red-600" : "text-white group-hover:text-red-400"
              )}>
                {tool.name}
                {tool.verified && <ShieldCheck className="w-4 h-4 text-[#FF7B00] shrink-0" />}
              </h3>
              <span className={cn("text-xs font-medium", isLightMode ? "text-slate-500" : "text-white/50")}>
                {tool.category}
              </span>
            </div>
          </div>

          {/* Quick Action Icons: Compare + Save */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleToggleCompare}
              className={cn(
                "p-2 rounded-xl border transition-all active:scale-95",
                isCompared
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
              onClick={handleToggleBookmark}
              className={cn(
                "p-2 rounded-xl border transition-all active:scale-95",
                isSaved
                  ? "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30"
                  : isLightMode
                    ? "bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-900"
                    : "bg-white/5 border-white/10 text-white/50 hover:text-white"
              )}
              title="Save to workspace"
            >
              <Bookmark className={cn("w-3.5 h-3.5", isSaved && "fill-current")} />
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

        {/* AI Recommendation Reason Banner (if ranked) */}
        {'recommendationReason' in tool && tool.recommendationReason && (
          <div className={cn(
            "mb-4 px-3 py-2 rounded-xl border flex items-start gap-2",
            isLightMode 
              ? "bg-amber-50/90 border-amber-200 text-amber-950" 
              : "bg-gradient-to-r from-[#FF7B00]/15 via-[#D9042B]/10 to-transparent border-[#FF7B00]/30 text-amber-100"
          )}>
            <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#FF7B00]" />
            <div className="flex-1 min-w-0">
              <span className="font-bold text-[10px] uppercase tracking-wider text-[#FF7B00] block mb-0.5">
                AI Recommendation Reason
              </span>
              <p className="text-[11px] leading-relaxed line-clamp-2">
                {tool.recommendationReason}
              </p>
            </div>
          </div>
        )}

        {/* Tag Pills */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {tool.tags.slice(0, 3).map((tag, idx) => (
            <span key={idx} className="tag-pill">
              #{tag}
            </span>
          ))}
          {tool.tags.length > 3 && (
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded font-mono",
              isLightMode ? "text-slate-400 bg-slate-100" : "text-white/40 bg-white/5"
            )}>
              +{tool.tags.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Bar: Pricing + Like Counter + Visit + Details */}
      <div className={cn(
        "flex items-center justify-between pt-4 border-t mt-auto",
        isLightMode ? "border-slate-100" : "border-white/10"
      )}>
        <div className="flex items-center gap-2">
          <span className={cn("text-xs px-2.5 py-1 rounded-lg font-semibold", getPricingBadgeClass(tool.pricing))}>
            {tool.pricing}
          </span>
          <button
            onClick={handleToggleLike}
            className={cn(
              "text-xs flex items-center gap-1 transition-colors px-1 py-0.5 rounded",
              isLiked ? "text-red-500 font-bold" : isLightMode ? "text-slate-500 hover:text-slate-800" : "text-white/50 hover:text-white"
            )}
            title="Like this tool"
          >
            <Heart className={cn("w-3.5 h-3.5", isLiked && "fill-current text-red-500")} />
            <span>{likesCount}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={tool.url}
            target="_blank"
            rel="noreferrer"
            onClick={handleVisitExternal}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1",
              isLightMode
                ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800"
                : "bg-white/5 hover:bg-white/10 border-white/10 text-white"
            )}
            title="Visit official website"
          >
            <span>Visit</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={handleCardClick}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#D9042B] to-[#FF7B00] shadow-sm hover:opacity-95 transition-all"
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
}
