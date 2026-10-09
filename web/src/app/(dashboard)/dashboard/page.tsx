'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useDashboard } from '@/app/(dashboard)/layout';
import ToolCard from '@/components/ToolCard';
import { tools, getTrendingTools } from '@/data/tools';
import { rankToolsByRecommendations } from '@/lib/recommendations';
import { useRecommendations } from '@/hooks/useRecommendations';
import { Sparkles, TrendingUp, Star, Bot, Palette, Briefcase, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ToolShelf = ({
  title,
  icon: Icon,
  tools,
  onToggleSave,
  savedTools,
  isLightMode
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  tools: any[];
  onToggleSave: (toolId: string) => void;
  savedTools: string[];
  isLightMode: boolean;
}) => {
  if (tools.length === 0) return null;
  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-aura-primary/20 flex items-center justify-center border border-aura-primary/30">
          <Icon className="w-5 h-5 text-aura-primary" />
        </div>
        <h3 className={cn("text-2xl font-bold", isLightMode ? "text-gray-900" : "text-white")}>{title}</h3>
      </div>
      <div className="flex overflow-x-auto gap-6 pb-6 snap-x scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {tools.map((tool) => (
          <div key={tool.id} className="min-w-[300px] max-w-[300px] sm:min-w-[360px] sm:max-w-[360px] snap-start shrink-0">
            <ToolCard
              tool={tool}
              onToggleSave={onToggleSave}
              isSaved={savedTools.includes(tool.id)}
              isLightMode={isLightMode}
              compact
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const { searchQuery, savedTools, toggleSaveTool, isLightMode } = useDashboard();
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const { 
    results: recommendations, 
    isLoading: recommendationsLoading,
    expandedQuery,
    intents,
    latencyMs,
    candidatesCount 
  } = useRecommendations(searchQuery);
  const isSearching = Boolean(searchQuery.trim());
  const filteredTools = useMemo(() => {
    if (!isSearching) return tools;
    return recommendations.length > 0
      ? rankToolsByRecommendations(tools, recommendations)
      : [];
  }, [isSearching, recommendations]);

  // Catalog shelves data
  const trendingTools = getTrendingTools(10);
  const freeTools = tools.filter((t) => t.pricing === 'Free' || t.pricing === 'Freemium').slice(0, 10);
  const productivityTools = tools.filter((t) => t.category === 'Productivity').slice(0, 10);
  const designTools = tools.filter((t) => t.category === 'Design').slice(0, 10);
  const aiTools = tools.filter((t) => t.category === 'AI Tools').slice(0, 10);

  const dismissBanner = () => {
    setIsBannerVisible(false);
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Hero Section */}
      {isBannerVisible && <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("mb-12 relative rounded-3xl overflow-hidden glass-card p-8 sm:p-12 border-aura-primary/20", isLightMode && "border-aura-primary/15")}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-aura-primary/10 via-aura-accent/5 to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-aura-primary/10 to-transparent pointer-events-none blur-3xl" />

        <button
          type="button"
          onClick={dismissBanner}
          aria-label="Dismiss dashboard banner"
          className={cn(
            "absolute top-4 right-4 z-20 p-2 rounded-xl transition-colors",
            isLightMode ? "text-gray-500 hover:text-gray-900 hover:bg-gray-100" : "text-white/50 hover:text-white hover:bg-white/10"
          )}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-aura-primary/20 text-aura-primary border border-aura-primary/30 text-xs font-bold uppercase tracking-wider mb-6">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Recommendations</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight" style={{ color: isLightMode ? '#1a1a1a' : '#ffffff' }}>
            Discover the perfect tool for <span className="text-aura-gradient-full">any task</span>
          </h2>
          <p className="text-lg mb-8 leading-relaxed" style={{ color: isLightMode ? '#4b5563' : 'rgba(255,255,255,0.6)' }}>
            Stop searching endlessly. Tell AURA what you need, and our semantic engine will find the most trusted and efficient utilities instantly.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => {
                const searchInput = document.querySelector('input[type="text"]');
                if (searchInput && searchInput instanceof HTMLElement) {
                  searchInput.focus();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="px-6 py-3 rounded-xl bg-aura-primary hover:bg-aura-primary-vibrant text-white font-semibold transition-all shadow-aura-glow hover:shadow-aura-glow-lg"
            >
              Try Semantic Search
            </button>
            <a
              href="/discover"
              className={cn(
                "px-6 py-3 rounded-xl font-semibold border transition-all backdrop-blur-sm",
                isLightMode
                  ? "bg-gray-100 border-gray-200 text-gray-900 hover:bg-gray-200"
                  : "bg-white/5 border-white/10 text-white hover:bg-white/10"
              )}
            >
              View Categories
            </a>
          </div>
        </div>
      </motion.div>}

      {isSearching ? (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h3 className={cn("text-2xl font-bold flex items-center gap-2.5", isLightMode ? "text-gray-900" : "text-white")}>
              <Sparkles className="w-6 h-6 text-aura-primary" />
              {recommendationsLoading ? 'Generating AI recommendations...' : 'AI Recommendations'}
            </h3>
            {!recommendationsLoading && recommendations.length > 0 && (
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                {expandedQuery && (
                  <span className={cn(
                    "px-2.5 py-1 rounded-lg border",
                    isLightMode ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-black/30 border-white/10 text-white/70"
                  )}>
                    Expanded: &ldquo;{expandedQuery}&rdquo;
                  </span>
                )}
                <span className="text-emerald-400 font-semibold">{latencyMs}ms</span>
                <span>•</span>
                <span>{candidatesCount || recommendations.length} candidates</span>
              </div>
            )}
          </div>
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
                  <ToolCard tool={tool} onToggleSave={toggleSaveTool} isSaved={savedTools.includes(tool.id)} isLightMode={isLightMode} />
                </motion.div>
              ))}
              {filteredTools.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full py-12 text-center flex flex-col items-center gap-4"
                  style={{ color: isLightMode ? '#6b7280' : 'rgba(255,255,255,0.6)' }}
                >
                  <Sparkles className="w-12 h-12" style={{ opacity: isLightMode ? 0.2 : 0.3 }} />
                  <p className="text-lg">No tools found matching &ldquo;{searchQuery}&rdquo;.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      ) : (
        // Play Store style Catalog View
        <div className="flex flex-col gap-4">
          <ToolShelf
            title="Trending Now"
            icon={TrendingUp}
            tools={trendingTools}
            onToggleSave={toggleSaveTool}
            savedTools={savedTools}
            isLightMode={isLightMode}
          />
          <ToolShelf
            title="Free & Verified"
            icon={Star}
            tools={freeTools}
            onToggleSave={toggleSaveTool}
            savedTools={savedTools}
            isLightMode={isLightMode}
          />
          <ToolShelf
            title="Essential AI Assistants"
            icon={Bot}
            tools={aiTools}
            onToggleSave={toggleSaveTool}
            savedTools={savedTools}
            isLightMode={isLightMode}
          />
          <ToolShelf
            title="Creative Powerhouses"
            icon={Palette}
            tools={designTools}
            onToggleSave={toggleSaveTool}
            savedTools={savedTools}
            isLightMode={isLightMode}
          />
          <ToolShelf
            title="Top Productivity Picks"
            icon={Briefcase}
            tools={productivityTools}
            onToggleSave={toggleSaveTool}
            savedTools={savedTools}
            isLightMode={isLightMode}
          />
        </div>
      )}
    </div>
  );
}
