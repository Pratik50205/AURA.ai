'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '@/app/(dashboard)/layout';
import ToolCard from '@/components/ToolCard';
import { tools } from '@/data/tools';
import { Bookmark, Compass } from 'lucide-react';
import Link from 'next/link';

export default function SavedToolsPage() {
  const { savedTools, toggleSaveTool, isLightMode } = useDashboard();
  const savedToolsData = tools.filter((tool) => savedTools.includes(tool.id));

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3 text-foreground">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#D9042B] to-[#FF7B00] flex items-center justify-center text-white shadow-md shadow-red-500/20">
            <Bookmark className="w-5 h-5" />
          </div>
          Saved Tools
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Access and manage your bookmarked AI utilities and custom stack.
        </p>
      </div>

      {savedToolsData.length === 0 ? (
        <div className={`flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl border backdrop-blur-xl transition-all ${
          isLightMode ? 'bg-white border-gray-200 shadow-sm' : 'bg-[#151520] border-[#27273a]'
        }`}>
          <div className="w-16 h-16 bg-[#D9042B]/10 border border-[#D9042B]/20 rounded-2xl flex items-center justify-center mb-5 text-[#FF3344] shadow-inner">
            <Bookmark className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">No tools saved yet</h2>
          <p className="text-muted-foreground text-sm max-w-md leading-relaxed">
            Explore the curated directory of 108 vector-indexed AI tools and click the bookmark icon on any card to save it to your workspace.
          </p>

          <Link
            href="/discover"
            className="mt-6 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D9042B] to-[#FF7B00] text-white font-semibold text-sm hover:opacity-95 shadow-lg shadow-red-500/25 active:scale-95 transition-all flex items-center gap-2"
          >
            <Compass className="w-4 h-4" />
            Explore AI Tools Directory
          </Link>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {savedToolsData.map((tool) => (
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
                  isSaved={true} 
                  isLightMode={isLightMode} 
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
