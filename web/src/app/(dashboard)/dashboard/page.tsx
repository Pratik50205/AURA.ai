'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useDashboard } from '@/app/(dashboard)/layout';
import ToolCard from '@/components/ToolCard';
import { tools, getTrendingTools } from '@/data/tools';
import { rankToolsByRecommendations } from '@/lib/recommendations';
import { useRecommendations } from '@/hooks/useRecommendations';
import { Sparkles, TrendingUp, Star, Bot, Palette, Briefcase, X, Zap, ArrowRight, Layers, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const ToolShelf = ({
  title,
  subtitle,
  icon: Icon,
  tools,
  onToggleSave,
  savedTools,
  isLightMode
}: {
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  tools: any[];
  onToggleSave: (toolId: string) => void;
  savedTools: string[];
  isLightMode: boolean;
}) => {
  if (tools.length === 0) return null;
  return (
    <div className="mb-14">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#D9042B] to-[#FF7B00] flex items-center justify-center text-white shadow-md shadow-red-500/20">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className={cn("text-xl sm:text-2xl font-bold tracking-tight", isLightMode ? "text-slate-900" : "text-white")}>
              {title}
            </h3>
            {subtitle && (
              <p className={cn("text-xs mt-0.5", isLightMode ? "text-slate-500" : "text-white/60")}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <Link
          href="/discover"
          className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex overflow-x-auto gap-6 pb-4 snap-x scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {tools.map((tool) => (
          <div key={tool.id} className="min-w-[310px] max-w-[310px] sm:min-w-[350px] sm:max-w-[350px] snap-start shrink-0">
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
  const trendingTools = getTrendingTools(8);
  const freeTools = tools.filter((t) => t.pricing === 'Free' || t.pricing === 'Freemium').slice(0, 8);
  const productivityTools = tools.filter((t) => t.category.toLowerCase().includes('productivity') || t.category.toLowerCase().includes('coding')).slice(0, 8);
  const designTools = tools.filter((t) => t.category.toLowerCase().includes('design') || t.category.toLowerCase().includes('image') || t.category.toLowerCase().includes('video')).slice(0, 8);
  const aiTools = tools.filter((t) => t.category.toLowerCase().includes('chatbot') || t.category.toLowerCase().includes('audio')).slice(0, 8);

  const dismissBanner = () => {
    setIsBannerVisible(false);
  };

  return (
    <div className="max-w-7xl mx-auto pb-16 px-4 sm:px-6">
      {/* Hero Welcome Banner */}
      {isBannerVisible && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "mb-12 relative rounded-3xl overflow-hidden p-8 sm:p-12 border backdrop-blur-2xl transition-all shadow-xl",
            isLightMode
              ? "bg-gradient-to-r from-red-50/70 via-white to-orange-50/60 border-slate-200/90 shadow-slate-200/50"
              : "bg-gradient-to-r from-red-950/20 via-[#11121C] to-black border-white/10 shadow-black/80"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-orange-500/5 to-transparent pointer-events-none" />

          <button
            type="button"
            onClick={dismissBanner}
            aria-label="Dismiss dashboard banner"
            className={cn(
              "absolute top-4 right-4 z-20 p-2 rounded-xl transition-colors",
              isLightMode ? "text-slate-400 hover:text-slate-800 hover:bg-slate-100" : "text-white/40 hover:text-white hover:bg-white/10"
            )}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border badge-brand">
              <Sparkles className="w-3.5 h-3.5 text-[#FF3344]" />
              <span>AI UTILITY RECOMMENDATION WORKSPACE</span>
            </div>
            <h2 className={cn(
              "text-3xl sm:text-5xl font-black mb-3 leading-tight tracking-tight",
              isLightMode ? "text-slate-900" : "text-white"
            )}>
              Discover the perfect tool for <span className="text-gradient">any generative task</span>
            </h2>
            <p className={cn(
              "text-sm sm:text-base mb-8 leading-relaxed",
              isLightMode ? "text-slate-600" : "text-white/70"
            )}>
              Stop searching endlessly. Type any technical or creative requirement in the search bar above, and AURA matches verified tools with trust ratings and price transparency.
            </p>
            <div className="flex gap-3.5 flex-wrap">
              <Link
                href="/discover"
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#D9042B] to-[#FF7B00] text-white font-bold text-sm hover:opacity-95 shadow-md shadow-red-500/25 active:scale-95 transition-all flex items-center gap-2"
              >
                <span>Browse All 320+ Tools</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/#workflows"
                className={cn(
                  "px-6 py-3 rounded-2xl font-semibold text-sm border transition-all backdrop-blur-sm flex items-center gap-2",
                  isLightMode
                    ? "bg-white border-slate-200 text-slate-800 hover:bg-slate-50 shadow-sm"
                    : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                )}
              >
                <Layers className="w-4 h-4 text-[#FF7B00]" />
                <span>Explore Workflows</span>
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* When searching via Header Search */}
      {isSearching ? (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h3 className={cn("text-2xl font-bold flex items-center gap-2.5", isLightMode ? "text-slate-900" : "text-white")}>
              <Sparkles className="w-6 h-6 text-[#FF3344]" />
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
                <span className="text-emerald-500 font-semibold">{latencyMs}ms</span>
                <span>•</span>
                <span>{candidatesCount || recommendations.length} candidates</span>
              </div>
            )}
          </div>

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
        </div>
      ) : (
        /* Catalog Shelves */
        <div>
          <ToolShelf
            title="Viral & Trending Tools"
            subtitle="Fastest-growing AI utilities with highest community benchmark activity"
            icon={TrendingUp}
            tools={trendingTools}
            onToggleSave={toggleSaveTool}
            savedTools={savedTools}
            isLightMode={isLightMode}
          />

          <ToolShelf
            title="Top Free & Open Access AI"
            subtitle="Generative tools with high-value free tiers and open weights"
            icon={Zap}
            tools={freeTools}
            onToggleSave={toggleSaveTool}
            savedTools={savedTools}
            isLightMode={isLightMode}
          />

          <ToolShelf
            title="Coding Assistants & Development"
            subtitle="Autonomous copilots, terminal agents, and refactoring engines"
            icon={Bot}
            tools={productivityTools}
            onToggleSave={toggleSaveTool}
            savedTools={savedTools}
            isLightMode={isLightMode}
          />

          <ToolShelf
            title="Design & Visual Generation"
            subtitle="Text-to-image synthesis, neural canvas, and visual generation"
            icon={Palette}
            tools={designTools}
            onToggleSave={toggleSaveTool}
            savedTools={savedTools}
            isLightMode={isLightMode}
          />

          <ToolShelf
            title="Chatbots, Reasoning & Audio"
            subtitle="Frontier reasoning models and voice generation"
            icon={Award}
            tools={aiTools}
            onToggleSave={toggleSaveTool}
            savedTools={savedTools}
            isLightMode={isLightMode}
          />
        </div>
      )}
    </div>
  );
}
