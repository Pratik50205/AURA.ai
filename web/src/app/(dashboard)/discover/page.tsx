'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '@/app/(dashboard)/layout';
import ToolCard from '@/components/ToolCard';
import { getCategories, tools } from '@/data/tools';
import { rankToolsByRecommendations } from '@/lib/recommendations';
import { useRecommendations } from '@/hooks/useRecommendations';
import { Sparkles, Compass, Zap, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DiscoverPage() {
  const { searchQuery, savedTools, toggleSaveTool, isLightMode } = useDashboard();
  const [selectedCategory, setSelectedCategory] = useState('All');
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

  const filteredTools = useMemo(() => {
    const rankedTools = searchQuery && mlResults.length > 0
      ? rankToolsByRecommendations(tools, mlResults)
      : tools;

    return rankedTools.filter((tool) => {
      const matchesCategory = selectedCategory === 'All' || tool.category === selectedCategory;
      const matchesSearch = searchQuery && mlResults.length === 0
        ? tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;
      return matchesCategory && matchesSearch;
    });
  }, [mlResults, searchQuery, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className={cn("text-3xl font-bold flex items-center gap-3", isLightMode ? "text-gray-900" : "text-white")}>
          <Compass className="text-aura-primary w-8 h-8" />
          Discover AI Tools
          <span className="text-xs px-2.5 py-1 rounded-full font-mono bg-white/5 border border-white/10 text-muted-foreground font-normal">
            {tools.length} Curated
          </span>
        </h1>
        <p className={cn("mt-2 text-sm", isLightMode ? "text-gray-600" : "text-white/60")}>
          {searchQuery && mlResults.length > 0
            ? 'Neural multi-signal recommendations calibrated to your workflow.'
            : 'Explore our complete directory of verified AI tools and production utilities.'}
        </p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {categoriesWithCounts.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all border flex items-center gap-1.5 ${
              selectedCategory === cat.key
                ? (isLightMode ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-black border-white')
                : (isLightMode ? 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200 hover:text-gray-900' : 'bg-surface border-white/10 text-white/60 hover:bg-white/10 hover:text-white')
            }`}
          >
            <span>{cat.key}</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              selectedCategory === cat.key
                ? (isLightMode ? 'bg-white/20 text-white' : 'bg-black/20 text-black')
                : (isLightMode ? 'bg-gray-200 text-gray-500' : 'bg-white/10 text-white/50')
            }`}>
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {searchQuery && mlLoading && (
        <div className="mb-6 p-4 rounded-2xl border border-white/10 bg-white/5 text-sm text-white/70 flex items-center gap-2.5 animate-pulse">
          <Sparkles className="w-4 h-4 text-aura-primary animate-spin" />
          <span>Evaluating 384-dimensional vector embeddings and multi-signal constraints...</span>
        </div>
      )}

      {searchQuery && !mlLoading && mlResults.length > 0 && (
        <div className={cn(
          "mb-6 p-4 rounded-2xl border backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs transition-all",
          isLightMode ? "bg-amber-50/80 border-amber-200/80 text-amber-950" : "bg-[#181824] border-[#29293e] text-white/80"
        )}>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-aura-primary/10 text-aura-primary font-bold">
              <Sparkles className="w-3.5 h-3.5 text-aura-primary" />
              <span>AURA Neural Ranker v2</span>
            </div>
            {expandedQuery && (
              <span className={cn(
                "px-2.5 py-1 rounded-lg border font-mono text-[11px]",
                isLightMode ? "bg-white border-amber-200 text-gray-700" : "bg-black/30 border-white/10 text-white/70"
              )}>
                Query Expansion: &ldquo;{expandedQuery}&rdquo;
              </span>
            )}
            {intents?.wants_free && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
                Free-Tier Prioritized
              </span>
            )}
            {intents?.wants_paid && (
              <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400 font-semibold">
                Budget / Subscription Intent
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-mono">
            <span className="flex items-center gap-1 text-emerald-400">
              <Zap className="w-3 h-3" />
              {latencyMs}ms
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3" />
              {candidatesCount || mlResults.length} Candidates Evaluated
            </span>
          </div>
        </div>
      )}

      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredTools.map((tool) => (
            <motion.div
              key={tool.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <ToolCard 
                tool={tool} 
                onToggleSave={toggleSaveTool} 
                isSaved={savedTools.includes(tool.id)} 
                isLightMode={isLightMode} 
              />
            </motion.div>
          ))}
          {filteredTools.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn("col-span-full py-16 text-center flex flex-col items-center gap-4", isLightMode ? "text-gray-500" : "text-white/60")}
            >
              <Sparkles className="w-12 h-12 text-white/20" />
              <p className="text-lg">No tools found matching your criteria.</p>
              {selectedCategory !== 'All' && (
                <button
                  onClick={() => setSelectedCategory('All')}
                  className="text-xs px-3 py-1.5 rounded-lg bg-aura-primary/10 text-aura-primary border border-aura-primary/20 hover:bg-aura-primary/20 transition-colors"
                >
                  Clear &ldquo;{selectedCategory}&rdquo; filter
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
