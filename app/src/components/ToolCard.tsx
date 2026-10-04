'use client';
import { cn } from '@/lib/utils';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, ShieldCheck, ThumbsUp, ThumbsDown, ExternalLink, Bookmark
} from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Tool } from '@/lib/site';
import { getTrustScoreColor, getPricingColor } from '@/lib/utils';

interface ToolCardProps {
  tool: Tool;
  onToggleSave: (toolId: string) => void;
  isSaved: boolean;
  compact?: boolean;
  isLightMode?: boolean;
}

export default function ToolCard({ tool, onToggleSave, isSaved, compact = false, isLightMode = false }: ToolCardProps) {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const router = useRouter();

  const cardBase = "glass-card group flex flex-col h-full relative overflow-hidden";
  const cardHover = isLightMode
    ? "hover:border-aura-primary/20 hover:shadow-aura-glow"
    : "hover:border-white/10";

  const compactCardBase = "glass-card p-4 group flex flex-col h-full relative overflow-hidden";
  const compactCardHover = isLightMode
    ? "hover:border-aura-primary/20 hover:shadow-aura-glow"
    : "hover:border-white/10";

  const renderCompact = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      className={cn(compactCardBase, compactCardHover)}
    >
      <div className="flex items-center gap-3 mb-3 relative z-10">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center p-1.5 shadow-inner",
          isLightMode ? "bg-gray-100 border-gray-200" : "bg-surface border border-white/10"
        )}>
          <img src={tool.icon} alt={tool.name} className="w-full h-full object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={cn("text-base font-bold truncate flex items-center gap-1.5", isLightMode ? "text-gray-900" : "text-white")}>
            {tool.name}
            {tool.verified && <ShieldCheck className="w-3.5 h-3.5 text-aura-accent flex-shrink-0" />}
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{tool.category}</span>
            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
            <span>{tool.users}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${getPricingColor(tool.pricing)}`}>
            {tool.pricing}
          </span>
          <div className={`flex items-center gap-1 px-2 py-1 rounded border ${getTrustScoreColor(tool.trustScore)}`}>
            <Shield className="w-3 h-3" />
            <span className="text-xs font-bold">{tool.trustScore}</span>
          </div>
        </div>
      </div>

      <p className={cn("text-sm mb-4 flex-1 line-clamp-2 relative z-10 leading-relaxed", isLightMode ? "text-gray-600" : "text-white/70")}>
        {tool.description}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-4 relative z-10">
        {tool.tags.slice(0, 3).map((tag) => (
          <span key={tag} className={cn(
            "px-2 py-0.5 text-[9px] font-medium rounded uppercase tracking-wider",
            isLightMode ? "text-gray-600 bg-gray-100 border-gray-200" : "text-white/60 bg-white/5 border-white/5"
          )}>
            {tag}
          </span>
        ))}
        {tool.tags.length > 3 && (
          <span className={cn(
            "px-2 py-0.5 text-[9px] font-medium rounded uppercase tracking-wider",
            isLightMode ? "text-gray-400 bg-gray-100 border-gray-200" : "text-white/40 bg-white/5 border-white/5"
          )}>
            +{tool.tags.length - 3}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t relative z-10" style={{ borderColor: isLightMode ? '#e5e7eb' : 'rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
            className={`p-1.5 rounded-lg border transition-all ${
              feedback === 'up'
                ? 'bg-green-500/20 border-green-500/30 text-green-500'
                : (isLightMode ? 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200 hover:text-gray-700' : 'bg-surface border-white/5 text-white/50 hover:bg-white/5 hover:text-white')
            }`}
            aria-label="Upvote"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
            className={`p-1.5 rounded-lg border transition-all ${
              feedback === 'down'
                ? 'bg-red-500/20 border-red-500/30 text-red-500'
                : (isLightMode ? 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200 hover:text-gray-700' : 'bg-surface border-white/5 text-white/50 hover:bg-white/5 hover:text-white')
            }`}
            aria-label="Downvote"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
        </div>
        <a
          href={tool.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-xl transition-all border",
            isLightMode
              ? "bg-gray-100 border-gray-200 text-gray-700 hover:bg-aura-primary/10 hover:text-aura-primary hover:border-aura-primary/30"
              : "bg-white/5 border-white/10 text-white hover:bg-aura-primary/20 hover:text-aura-primary hover:border-aura-primary/30"
          )}
        >
          <span className="hidden sm:inline">Visit</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </motion.div>
  );

  const renderFull = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className={cn(cardBase, cardHover)}
    >
      {/* Decorative gradient blur */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-aura-primary/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center p-2 shadow-inner",
            isLightMode ? "bg-gray-100 border-gray-200" : "bg-surface border border-white/10"
          )}>
            <img src={tool.icon} alt={tool.name} className="w-full h-full object-contain" />
          </div>
          <div>
            <h3 className={cn("text-lg font-bold group-hover:text-aura-primary transition-colors flex items-center gap-2", isLightMode ? "text-gray-900" : "text-white")}>
              {tool.name}
              {tool.verified && <ShieldCheck className="w-4 h-4 text-aura-accent" />}
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{tool.category}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
              <span>{tool.users} users</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {tool.pricing && (
            <div className={`px-2 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider ${getPricingColor(tool.pricing)}`}>
              {tool.pricing}
            </div>
          )}
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${getTrustScoreColor(tool.trustScore)}`}>
            <Shield className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">{tool.trustScore}</span>
          </div>
          <button
            onClick={() => onToggleSave(tool.id)}
            className={`p-1.5 rounded-lg border transition-all ${
              isSaved ? 'bg-aura-primary/20 border-aura-primary/30 text-aura-primary' : (isLightMode ? 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200 hover:text-gray-700' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white')
            }`}
            aria-label={isSaved ? 'Remove from saved' : 'Save tool'}
            aria-pressed={isSaved}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      <p className={cn("text-sm mb-6 flex-1 line-clamp-3 relative z-10 leading-relaxed", isLightMode ? "text-gray-600" : "text-white/70")}>
        {tool.description}
      </p>

      <div className="flex flex-wrap gap-2 mb-6 relative z-10">
        {tool.tags.map((tag) => (
          <span key={tag} className={cn(
            "px-2.5 py-1 text-[10px] font-medium rounded-md uppercase tracking-wider",
            isLightMode ? "text-gray-600 bg-gray-100 border-gray-200" : "text-white/60 bg-white/5 border-white/5"
          )}>
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t relative z-10" style={{ borderColor: isLightMode ? '#e5e7eb' : 'rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
            className={`p-2 rounded-xl border transition-all ${
              feedback === 'up'
                ? 'bg-green-500/20 border-green-500/30 text-green-500'
                : (isLightMode ? 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200 hover:text-gray-700' : 'bg-surface border-white/5 text-white/50 hover:bg-white/5 hover:text-white')
            }`}
            aria-label="Upvote"
          >
            <ThumbsUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
            className={`p-2 rounded-xl border transition-all ${
              feedback === 'down'
                ? 'bg-red-500/20 border-red-500/30 text-red-500'
                : (isLightMode ? 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200 hover:text-gray-700' : 'bg-surface border-white/5 text-white/50 hover:bg-white/5 hover:text-white')
            }`}
            aria-label="Downvote"
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
        </div>

        <a
          href={tool.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all border",
            isLightMode
              ? "bg-gray-100 border-gray-200 text-gray-700 hover:bg-aura-primary/10 hover:text-aura-primary hover:border-aura-primary/30"
              : "bg-white/5 border-white/10 text-white hover:bg-aura-primary/20 hover:text-aura-primary hover:border-aura-primary/30"
          )}
        >
          <span>Visit Site</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </motion.div>
  );

  // Card navigation stays in the current tab; external Visit links remain explicit.
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
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

  return (
    <div
      className="block cursor-pointer"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(`/discover/${tool.id}`);
        }
      }}
    >
      {compact ? renderCompact() : renderFull()}
    </div>
  );
}
