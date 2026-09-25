'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, ExternalLink, Bookmark, Share2, Star,
  Shield, ShieldCheck, Users, Tag, DollarSign,
  ChevronDown, ChevronUp, Check, X, Copy,
  AlertTriangle, Heart, Code, Image, Video, Music, FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getToolById, tools } from '@/data/tools';
import { Tool } from '@/lib/site';
import { useDashboard } from '@/app/(dashboard)/layout';

interface ToolDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ToolDetailPage({ params }: ToolDetailPageProps) {
  const { savedTools, toggleSaveTool, isLightMode } = useDashboard();
  const [tool, setTool] = useState<Tool | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'prompts' | 'useCases' | 'pricing' | 'alternatives'>('overview');
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [id, setId] = useState<string>('');

  useEffect(() => {
    params.then((resolvedParams) => {
      const toolId = resolvedParams.id;
      setId(toolId);
      const toolData = getToolById(toolId);
      setTool(toolData || null);
      setIsSaved(savedTools.includes(toolId));
    });
  }, [params, savedTools]);

  if (!tool) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-aura-primary/50 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Tool Not Found</h2>
          <p className="text-muted mb-6">The tool you're looking for doesn't exist.</p>
          <Link href="/discover" className="inline-flex items-center gap-2 px-4 py-2 bg-aura-primary text-white rounded-xl font-medium hover:bg-aura-primary-hover transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Discover
          </Link>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    toggleSaveTool(tool.id);
    setIsSaved(!isSaved);
  };

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(prompt);
    setTimeout(() => setCopiedPrompt(null), 2000);
  };

  const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    'AI Tools': Code,
    'Design': Image,
    'Video': Video,
    'Audio': Music,
    'Writing': FileText,
    'Productivity': FileText,
    'Developer': Code,
  };
  const CategoryIcon = categoryIcons[tool.category] || Code;

  const pricingColors: Record<string, string> = {
    'Free': 'bg-green-500/20 text-green-400 border-green-500/30',
    'Freemium': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Premium': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Back Navigation */}
      <div className="mb-6">
        <Link 
          href="/discover" 
          className="inline-flex items-center gap-2 text-sm font-medium hover:text-aura-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Discover
        </Link>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Hero Section */}
        <div className="glass-card rounded-3xl p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
              <img src={tool.icon} alt={tool.name} className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-3 flex-wrap">
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                  pricingColors[tool.pricing]
                )}>
                  {tool.pricing}
                </span>
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
                  isLightMode ? "bg-gray-100 text-gray-700 border-gray-200" : "bg-white/10 text-white/80 border-white/10"
                )}>
                  {tool.category}
                </span>
                {tool.verified && (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-green-500/20 text-green-400 border-green-500/30">
                    <ShieldCheck className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{tool.name}</h1>
              <p className={cn("text-lg mb-4", isLightMode ? "text-gray-600" : "text-white/70")}>
                {tool.description}
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm">
                <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                  <Shield className="w-4 h-4" />
                  <span>Trust Score: <strong>{tool.trustScore}/100</strong></span>
                </div>
                <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                  <Users className="w-4 h-4" />
                  <span>{tool.users} users</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 md:ml-auto">
              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-aura-gradient text-white font-semibold rounded-xl hover:shadow-aura-glow transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                Visit Site
              </a>
              <button
                onClick={handleSave}
                className={cn(
                  "flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all",
                  isSaved
                    ? "bg-aura-primary/20 text-aura-primary border border-aura-primary/30"
                    : isLightMode
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                      : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                )}
              >
                <Bookmark className={cn("w-4 h-4", isSaved && "fill-current")} />
                {isSaved ? 'Saved' : 'Save'}
              </button>
              <button className={cn(
                "flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all border",
                isLightMode ? "bg-white text-gray-700 border-gray-200 hover:bg-gray-50" : "bg-surface text-white border-white/10 hover:bg-white/5"
              )}>
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>

          {/* Tags */}
          <div className="mt-6 flex flex-wrap gap-2">
            {tool.tags.map((tag) => (
              <span key={tag} className={cn(
                "px-3 py-1 rounded-full text-sm font-medium",
                isLightMode ? "bg-gray-100 text-gray-700 border border-gray-200" : "bg-white/10 text-white/80 border border-white/10"
              )}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="glass-card rounded-2xl overflow-hidden mb-8">
          <nav className="flex overflow-x-auto" aria-label="Tool detail sections">
            {[
              { id: 'overview', label: 'Overview', icon: FileText },
              { id: 'prompts', label: 'Best Prompts', icon: Code },
              { id: 'useCases', label: 'Use Cases', icon: Star },
              { id: 'pricing', label: 'Pricing', icon: DollarSign },
              { id: 'alternatives', label: 'Alternatives', icon: Tag },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all whitespace-nowrap relative",
                    activeTab === tab.id
                      ? "text-aura-primary"
                      : isLightMode ? "text-gray-600 hover:text-gray-900" : "text-white/60 hover:text-white"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-aura-gradient"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="p-6 md:p-8">
              <h2 className="text-xl font-bold mb-4">About {tool.name}</h2>
              <p className={cn("text-lg leading-relaxed mb-6", isLightMode ? "text-gray-600" : "text-white/70")}>
                {tool.description}
              </p>

              {/* Key Features */}
              {tool.keyFeatures && tool.keyFeatures.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Check className="w-5 h-5 text-aura-accent" />
                    Key Features
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {tool.keyFeatures.map((feature, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: isLightMode ? '#f8f9fa' : 'rgba(255,255,255,0.03)' }}>
                        <Check className="w-5 h-5 text-aura-accent flex-shrink-0 mt-0.5" />
                        <span style={{ color: isLightMode ? '#1a1a1a' : '#ffffff' }}>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pros & Cons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tool.pros && tool.pros.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-green-500" />
                      Pros
                    </h3>
                    <ul className="space-y-2">
                      {tool.pros.map((pro, i) => (
                        <li key={i} className="flex items-start gap-2" style={{ color: isLightMode ? '#374151' : '#d1d5db' }}>
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {tool.cons && tool.cons.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <X className="w-5 h-5 text-red-500" />
                      Cons
                    </h3>
                    <ul className="space-y-2">
                      {tool.cons.map((con, i) => (
                        <li key={i} className="flex items-start gap-2" style={{ color: isLightMode ? '#374151' : '#d1d5db' }}>
                          <X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Prompts Tab */}
          {activeTab === 'prompts' && (
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Best Prompts for {tool.name}</h2>
                {tool.bestPrompts && tool.bestPrompts.length > 0 && (
                  <span className={cn("px-2 py-1 rounded text-sm", isLightMode ? "bg-gray-100 text-gray-600" : "bg-white/10 text-white/60")}>
                    {tool.bestPrompts.length} prompts
                  </span>
                )}
              </div>

              {tool.bestPrompts && tool.bestPrompts.length > 0 ? (
                <div className="space-y-4">
                  {tool.bestPrompts.map((prompt, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group"
                    >
                      <div className={cn(
                        "rounded-2xl border p-6 transition-all",
                        expandedPrompt === prompt.title
                          ? "border-aura-primary/30 bg-aura-primary/5"
                          : isLightMode
                            ? "bg-gray-50/50 border-gray-200 hover:border-aura-primary/20"
                            : "bg-white/5 border-white/10 hover:border-aura-primary/20"
                      )}>
                        <button
                          onClick={() => setExpandedPrompt(expandedPrompt === prompt.title ? null : prompt.title)}
                          className="w-full flex items-start justify-between gap-4 text-left"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={cn(
                                "px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider",
                                prompt.category === 'Creative' && 'bg-pink-500/20 text-pink-400',
                                prompt.category === 'Technical' && 'bg-blue-500/20 text-blue-400',
                                prompt.category === 'Business' && 'bg-purple-500/20 text-purple-400',
                                prompt.category === 'Educational' && 'bg-green-500/20 text-green-400',
                                prompt.category === 'General' && 'bg-gray-500/20 text-gray-400',
                              )}>
                                {prompt.category}
                              </span>
                              <h3 className="text-lg font-semibold">{prompt.title}</h3>
                            </div>
                            {prompt.description && (
                              <p className={cn("text-sm mb-2", isLightMode ? "text-gray-500" : "text-white/50")}>
                                {prompt.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {expandedPrompt === prompt.title ? (
                              <ChevronUp className="w-5 h-5 text-aura-primary" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-muted" />
                            )}
                          </div>
                        </button>

                        {expandedPrompt === prompt.title && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-4 pt-4 border-t"
                            style={{ borderColor: isLightMode ? '#e5e7eb' : 'rgba(255,255,255,0.1)' }}
                          >
                            <div className="relative">
                              <pre className={cn(
                                "whitespace-pre-wrap text-sm p-4 rounded-xl overflow-x-auto max-h-96 overflow-y-auto",
                                isLightMode ? "bg-gray-100 text-gray-900" : "bg-background text-white"
                              )}>
                                {prompt.prompt}
                              </pre>
                              <button
                                onClick={() => handleCopyPrompt(prompt.prompt)}
                                className="absolute top-3 right-3 p-2 rounded-lg transition-colors"
                                style={{ backgroundColor: isLightMode ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)' }}
                              >
                                {copiedPrompt === prompt.prompt ? (
                                  <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Copy className="w-4 h-4 text-muted hover:text-white" />
                                )}
                              </button>
                            </div>
                            {copiedPrompt === prompt.prompt && (
                              <div className="mt-2 text-sm text-green-500 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Copied to clipboard!
                              </div>
                            )}
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                  <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No prompts available yet</h3>
                  <p>Best prompts for this tool will be added soon.</p>
                </div>
              )}
            </div>
          )}

          {/* Use Cases Tab */}
          {activeTab === 'useCases' && (
            <div className="p-6 md:p-8">
              <h2 className="text-xl font-bold mb-6">Use Cases for {tool.name}</h2>

              {tool.useCases && tool.useCases.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tool.useCases.map((useCase, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={cn(
                        "p-6 rounded-2xl border transition-all hover:border-aura-primary/30",
                        isLightMode ? "bg-gray-50/50 border-gray-200" : "bg-white/5 border-white/10"
                      )}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <Star className="w-6 h-6 text-aura-accent flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-lg">{useCase.title}</h3>
                          <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                            <span className="px-2 py-0.5 rounded bg-aura-primary/20 text-aura-primary">{useCase.difficulty}</span>
                            {useCase.targetAudience && (
                              <span>For: {useCase.targetAudience}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className={cn("leading-relaxed", isLightMode ? "text-gray-600" : "text-white/70")}>
                        {useCase.description}
                      </p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                  <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No use cases available yet</h3>
                  <p>Use cases for this tool will be added soon.</p>
                </div>
              )}
            </div>
          )}

          {/* Pricing Tab */}
          {activeTab === 'pricing' && (
            <div className="p-6 md:p-8">
              <h2 className="text-xl font-bold mb-6">Pricing Plans</h2>

              {tool.pricingDetails && tool.pricingDetails.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {tool.pricingDetails.map((plan, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={cn(
                        "relative p-6 rounded-2xl border transition-all",
                        plan.isPopular
                          ? "border-aura-primary/50 bg-aura-primary/5 shadow-aura-glow"
                          : isLightMode
                            ? "bg-gray-50/50 border-gray-200 hover:border-aura-primary/20"
                            : "bg-white/5 border-white/10 hover:border-aura-primary/20"
                      )}
                    >
                      {plan.isPopular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-aura-gradient text-white text-xs font-bold rounded-full">
                          Most Popular
                        </div>
                      )}
                      <h3 className="font-semibold text-lg mb-1">{plan.plan}</h3>
                      <div className="mb-4">
                        <span className="text-3xl font-bold">{plan.price}</span>
                        <span className="text-muted ml-1">/month</span>
                      </div>
                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm" style={{ color: isLightMode ? '#374151' : '#d1d5db' }}>
                            <Check className="w-4 h-4 text-aura-accent flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <a
                        href={tool.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium transition-all",
                          plan.isPopular
                            ? "bg-aura-gradient text-white hover:shadow-aura-glow"
                            : isLightMode
                              ? "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                              : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                        )}
                      >
                        Get Started
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                  <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Pricing details coming soon</h3>
                  <p>Detailed pricing information for this tool will be added soon.</p>
                </div>
              )}
            </div>
          )}

          {/* Alternatives Tab */}
          {activeTab === 'alternatives' && (
            <div className="p-6 md:p-8">
              <h2 className="text-xl font-bold mb-6">Alternatives to {tool.name}</h2>

              {tool.alternatives && tool.alternatives.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tool.alternatives.map((altId) => {
                    const altTool = getToolById(altId);
                    if (!altTool) return null;
                    return (
                      <Link
                        key={altId}
                        href={`/discover/${altId}`}
                        className={cn(
                          "p-4 rounded-2xl border transition-all hover:border-aura-primary/30 group",
                          isLightMode ? "bg-gray-50/50 border-gray-200" : "bg-white/5 border-white/10"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden" style={{ backgroundColor: isLightMode ? '#f3f4f6' : '#1a1a24' }}>
                            <img src={altTool.icon} alt={altTool.name} className="w-full h-full object-contain" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate group-hover:text-aura-primary transition-colors">{altTool.name}</h3>
                            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                              <span className={cn(
                                "px-2 py-0.5 rounded text-xs font-medium",
                                pricingColors[altTool.pricing]
                              )}>
                                {altTool.pricing}
                              </span>
                              <span>Trust: {altTool.trustScore}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                  <Tag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No alternatives listed yet</h3>
                  <p>Alternative tools will be added soon.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
