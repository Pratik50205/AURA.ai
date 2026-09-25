'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '@/app/(dashboard)/layout';
import ToolCard from '@/components/ToolCard';
import { getCategories, tools } from '@/data/tools';
import { rankToolsByRecommendations } from '@/lib/recommendations';
import { useRecommendations } from '@/hooks/useRecommendations';
import { Sparkles, Compass } from 'lucide-react';

const CATEGORIES = ['All', ...getCategories().map((category) => category.key)];

export default function DiscoverPage() {
  const { searchQuery, savedTools, toggleSaveTool } = useDashboard();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { results: mlResults, isLoading: mlLoading } = useRecommendations(searchQuery);

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
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Compass className="text-primary w-8 h-8" />
          Discover Tools
        </h1>
        <p className="text-white/60 mt-2">
          {searchQuery && mlResults.length > 0
            ? 'AI recommendations based on your query.'
            : 'Explore our complete directory of AI tools and utilities.'}
        </p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${
              selectedCategory === cat
                ? 'bg-white text-black border-white'
                : 'bg-surface border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {searchQuery && mlLoading && (
        <div className="mb-6 text-sm text-white/60">Generating AI recommendations...</div>
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
              <ToolCard tool={tool} onToggleSave={toggleSaveTool} isSaved={savedTools.includes(tool.id)} />
            </motion.div>
          ))}
          {filteredTools.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-12 text-center text-white/60 flex flex-col items-center gap-4"
            >
              <Sparkles className="w-12 h-12 text-white/20" />
              <p className="text-lg">No tools found matching your criteria.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
