'use client';

import { useMemo, useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '@/app/(dashboard)/layout';
import ToolCard from '@/components/ToolCard';
import { getCategories, tools } from '@/data/tools';
import { rankToolsByRecommendations } from '@/lib/recommendations';
import { useRecommendations } from '@/hooks/useRecommendations';
import { 
  Sparkles, 
  Compass, 
  Zap, 
  Layers, 
  X, 
  Loader2, 
  ArrowRight,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Wand2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  extractAllPrompts, 
  matchPrompts, 
  matchTools, 
  isPromptIntent,
  type PromptMatch 
} from '@/lib/promptMatcher';

function DiscoverContent() {
  const { searchQuery, setSearchQuery, savedTools, toggleSaveTool, isLightMode } = useDashboard();
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [copiedUserPrompt, setCopiedUserPrompt] = useState(false);

  // Sync URL ?q=... with dashboard searchQuery on load or URL changes
  useEffect(() => {
    const qParam = searchParams.get('q');
    if (qParam && qParam !== searchQuery) {
      setSearchQuery(qParam);
    }
    const catParam = searchParams.get('category');
    if (catParam) {
      setSelectedCategory(catParam);
    }
  }, [searchParams, searchQuery, setSearchQuery]);

  const { 
    results: mlResults, 
    isLoading: mlLoading, 
    expandedQuery, 
    intents, 
    latencyMs, 
    modelVersion, 
    candidatesCount 
  } = useRecommendations(searchQuery);

  const categoriesWithCounts = useMemo(() => {
    return [
      { key: 'All', count: tools.length },
      ...getCategories(),
    ];
  }, []);

  // Extract all catalog prompts
  const allPrompts = useMemo(() => extractAllPrompts(tools), []);

  // Detect if query is a natural language prompt or workflow task
  const isPrompt = useMemo(() => isPromptIntent(searchQuery), [searchQuery]);

  // Find matching prompt templates for the current query
  const matchedPrompts: PromptMatch[] = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return matchPrompts(allPrompts, searchQuery, 4);
  }, [allPrompts, searchQuery]);

  const filteredTools = useMemo(() => {
    if (searchQuery && mlResults.length > 0) {
      const ranked = rankToolsByRecommendations(tools, mlResults);
      return ranked.filter((tool) => {
        return selectedCategory === 'All' || tool.category.toLowerCase().includes(selectedCategory.toLowerCase());
      });
    }

    if (searchQuery && mlResults.length === 0) {
      // Use intelligent keyword + prompt + use-case matcher
      return matchTools(tools, searchQuery, selectedCategory, 60);
    }

    return tools.filter((tool) => {
      return selectedCategory === 'All' || tool.category.toLowerCase().includes(selectedCategory.toLowerCase());
    });
  }, [mlResults, searchQuery, selectedCategory]);

  const handleCopyPrompt = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptId(id);
    setTimeout(() => setCopiedPromptId(null), 2000);
  };

  const handleCopyUserPrompt = () => {
    if (!searchQuery.trim()) return;
    navigator.clipboard.writeText(searchQuery.trim());
    setCopiedUserPrompt(true);
    setTimeout(() => setCopiedUserPrompt(false), 2000);
  };

  const handleLaunchInAi = (url: string) => {
    if (searchQuery.trim()) {
      navigator.clipboard.writeText(searchQuery.trim());
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const wordCount = searchQuery.trim().split(/\s+/).filter(Boolean).length;
  const tokenEstimate = Math.ceil(searchQuery.length / 4);

  return (
    <div className="max-w-7xl mx-auto pb-16 px-4 sm:px-6">
      {/* Page Header */}
      <div className="mb-8 pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3 border badge-brand">
          <Sparkles className="w-3.5 h-3.5 text-[#FF3344]" />
          <span>AI UTILITY DIRECTORY</span>
        </div>
        <h1 className={cn(
          "text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-3",
          isLightMode ? "text-slate-900" : "text-white"
        )}>
          Discover AI Tools & Prompts
          <span className={cn(
            "text-xs px-3 py-1 rounded-full font-mono font-bold border",
            isLightMode ? "bg-slate-100 border-slate-200 text-slate-600" : "bg-white/5 border-white/10 text-white/60"
          )}>
            {tools.length} Curated
          </span>
        </h1>
        <p className={cn("mt-2 text-sm sm:text-base max-w-2xl", isLightMode ? "text-slate-600" : "text-white/60")}>
          {searchQuery && mlResults.length > 0
            ? 'Neural multi-signal recommendations calibrated to your workflow requirements.'
            : 'Explore our complete directory of vector-verified AI tools, prompt templates, and generative utilities.'}
        </p>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-[#D9042B]/15 border border-[#D9042B]/40 text-[#FF3344] hover:bg-[#D9042B]/25 transition-all flex items-center gap-1.5 shrink-0"
            title="Clear search query"
          >
            <span>&ldquo;{searchQuery.slice(0, 18)}{searchQuery.length > 18 ? '...' : ''}&rdquo;</span>
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {categoriesWithCounts.map((cat) => {
          const isSelected = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={cn(
                "px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-2 shrink-0 shadow-sm",
                isSelected
                  ? "bg-gradient-to-r from-[#D9042B] to-[#FF7B00] text-white border-transparent shadow-red-500/25"
                  : isLightMode
                    ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    : "bg-[#12131C] border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <span>{cat.key}</span>
              <span className={cn(
                "text-[10px] font-mono px-1.5 py-0.2 rounded-full",
                isSelected
                  ? "bg-white/25 text-white"
                  : isLightMode
                    ? "bg-slate-100 text-slate-500"
                    : "bg-white/10 text-white/50"
              )}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Neural Ranking Status Banner */}
      {searchQuery && mlLoading && (
        <div className={cn(
          "mb-8 p-4 rounded-3xl border flex items-center gap-3 animate-pulse text-xs",
          isLightMode ? "bg-amber-50/70 border-amber-200 text-amber-900" : "bg-white/5 border-white/10 text-white/70"
        )}>
          <Loader2 className="w-4 h-4 text-[#FF3344] animate-spin shrink-0" />
          <span>Evaluating 384-dimensional dense semantic vectors and multi-signal constraints...</span>
        </div>
      )}

      {searchQuery && !mlLoading && mlResults.length > 0 && (
        <div className={cn(
          "mb-8 p-4 sm:p-5 rounded-3xl border backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 text-xs transition-all shadow-sm",
          isLightMode ? "bg-amber-50/90 border-amber-200/90 text-amber-950" : "bg-[#181824] border-[#29293e] text-white/80"
        )}>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#D9042B]/10 text-[#FF3344] font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#FF3344]" />
              <span>AURA Neural Ranker v2</span>
            </div>
            {expandedQuery && (
              <span className={cn(
                "px-2.5 py-1 rounded-xl border font-mono text-[11px]",
                isLightMode ? "bg-white border-amber-200 text-slate-700" : "bg-black/30 border-white/10 text-white/70"
              )}>
                Expanded: &ldquo;{expandedQuery}&rdquo;
              </span>
            )}
            {intents?.wants_free && (
              <span className="badge badge-emerald text-xs px-2.5 py-0.5 font-semibold">
                Free-Tier Prioritized
              </span>
            )}
            {intents?.wants_paid && (
              <span className="badge badge-amber text-xs px-2.5 py-0.5 font-semibold">
                Commercial / Paid Intent
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1 text-emerald-500 font-semibold">
              <Zap className="w-3 h-3" />
              {latencyMs}ms
            </span>
            <span>{candidatesCount} candidates evaluated</span>
          </div>
        </div>
      )}

      {/* Prompt Recognized Hero Banner if user entered an actionable prompt */}
      {searchQuery && isPrompt && searchQuery.trim().length > 15 && (
        <div className={cn(
          "mb-8 p-5 sm:p-6 rounded-3xl border shadow-lg space-y-3 transition-all",
          isLightMode 
            ? "bg-gradient-to-r from-red-500/5 via-orange-500/5 to-transparent border-red-500/25" 
            : "bg-gradient-to-r from-red-500/10 via-orange-500/5 to-transparent border-red-500/30"
        )}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FF3344]/15 border border-[#FF3344]/30 flex items-center justify-center text-[#FF3344]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Natural Language Prompt Accepted</span>
                  <span className="badge-brand text-[10px] px-2 py-0.2 rounded-full">
                    {wordCount} words • ~{tokenEstimate} tokens
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Below are the top AI tools and tested templates calibrated to execute this prompt.
                </p>
              </div>
            </div>

            <button
              onClick={handleCopyUserPrompt}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 self-start sm:self-auto shadow-sm",
                copiedUserPrompt
                  ? "bg-emerald-500 text-white border-transparent"
                  : isLightMode
                    ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-800"
                    : "bg-white/10 hover:bg-white/15 border-white/10 text-white"
              )}
            >
              {copiedUserPrompt ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied Prompt!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Prompt</span>
                </>
              )}
            </button>
          </div>

          <div className={cn(
            "p-3 rounded-2xl border font-mono text-xs leading-relaxed select-all",
            isLightMode ? "bg-white/80 border-slate-200 text-slate-800" : "bg-black/40 border-white/10 text-white/90"
          )}>
            &ldquo;{searchQuery}&rdquo;
          </div>

          {/* Instant Launch Buttons */}
          <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 dark:text-white/60">
              Run prompt directly in:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleLaunchInAi(`https://chatgpt.com/?q=${encodeURIComponent(searchQuery)}`)}
                className="px-3 py-1 rounded-xl text-xs font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-1"
              >
                <span>ChatGPT</span>
                <ExternalLink className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleLaunchInAi(`https://claude.ai`)}
                className="px-3 py-1 rounded-xl text-xs font-bold border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all flex items-center gap-1"
              >
                <span>Claude</span>
                <ExternalLink className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleLaunchInAi(`https://www.perplexity.ai/search?q=${encodeURIComponent(searchQuery)}`)}
                className="px-3 py-1 rounded-xl text-xs font-bold border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-all flex items-center gap-1"
              >
                <span>Perplexity</span>
                <ExternalLink className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleLaunchInAi(`https://cursor.com`)}
                className="px-3 py-1 rounded-xl text-xs font-bold border border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-all flex items-center gap-1"
              >
                <span>Cursor</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Matching Verified Prompt Templates Section */}
      {matchedPrompts.length > 0 && (
        <div className="mb-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#FF3344]" />
              <h2 className={cn("text-base font-bold", isLightMode ? "text-slate-900" : "text-white")}>
                Verified Prompt Templates for this Task ({matchedPrompts.length})
              </h2>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              1-Click Copy
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matchedPrompts.map((p) => {
              const isCopied = copiedPromptId === p.id;
              return (
                <div
                  key={p.id}
                  className={cn(
                    "p-4 rounded-3xl border transition-all flex flex-col justify-between gap-3 shadow-sm",
                    isLightMode 
                      ? "bg-white border-slate-200 hover:border-slate-300" 
                      : "bg-[#12131C] border-white/10 hover:border-white/20"
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-white/10">
                          <img src={p.toolIcon} alt={p.toolName} className="w-full h-full object-contain" />
                        </div>
                        <span className="text-xs font-bold">{p.title}</span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full badge-brand">
                          for {p.toolName}
                        </span>
                      </div>

                      <button
                        onClick={() => handleCopyPrompt(p.prompt, p.id)}
                        className={cn(
                          "px-2.5 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 shrink-0",
                          isCopied
                            ? "bg-emerald-500 text-white border-transparent"
                            : isLightMode
                              ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
                              : "bg-white/10 hover:bg-white/15 border-white/10 text-white"
                        )}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Copied</span>
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
                      "text-xs font-mono p-3 rounded-2xl border leading-relaxed select-all line-clamp-3",
                      isLightMode ? "bg-slate-50 border-slate-200 text-slate-800" : "bg-black/30 border-white/5 text-white/80"
                    )}>
                      &ldquo;{p.prompt}&rdquo;
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-[11px] text-muted-foreground">{p.category}</span>
                    <Link
                      href={`/discover/${p.toolId}`}
                      className="text-[#FF3344] font-bold hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <span>Explore {p.toolName}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tools Grid */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className={cn("text-base font-bold", isLightMode ? "text-slate-900" : "text-white")}>
          Recommended AI Tools ({filteredTools.length})
        </h2>
        {searchQuery && (
          <span className="text-xs text-muted-foreground">
            Ranked by relevance to prompt & workflow signals
          </span>
        )}
      </div>

      {filteredTools.length === 0 ? (
        <div className={cn(
          "flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl border backdrop-blur-xl",
          isLightMode ? "bg-white border-slate-200 shadow-sm" : "bg-[#12131C] border-white/10"
        )}>
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-[#FF3344] mb-4">
            <Compass className="w-8 h-8" />
          </div>
          <h3 className={cn("text-xl font-bold mb-2", isLightMode ? "text-slate-900" : "text-white")}>
            No AI tools found
          </h3>
          <p className={cn("text-sm max-w-md mb-6", isLightMode ? "text-slate-500" : "text-white/60")}>
            We couldn&apos;t find any tools matching your query. Try searching for a broader term or select &ldquo;All&rdquo; categories.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="px-6 py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-[#D9042B] to-[#FF7B00] shadow-md hover:opacity-95 transition-all"
          >
            Reset Filters & View All
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              onToggleSave={toggleSaveTool}
              isSaved={savedTools.includes(tool.id)}
              isLightMode={isLightMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-[#FF3344]" />
          <span className="text-sm font-medium">Loading AI Utility Directory...</span>
        </div>
      </div>
    }>
      <DiscoverContent />
    </Suspense>
  );
}
