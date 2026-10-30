'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  X, 
  Sparkles, 
  ExternalLink, 
  ArrowRight, 
  Star,
  CornerDownLeft,
  Copy,
  Check,
  Bot,
  MessageSquare,
  Wand2,
  Lightbulb,
  Zap,
  Layers,
  Terminal,
  Code
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { tools } from '@/data/tools';
import type { Tool } from '@/lib/site';
import { 
  extractAllPrompts, 
  matchPrompts, 
  matchTools, 
  isPromptIntent,
  type PromptMatch 
} from '@/lib/promptMatcher';

interface SearchSpotlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLightMode?: boolean;
}

const CATEGORY_FILTERS = [
  'All',
  'AI Chatbot',
  'Coding & Development',
  'Design & Creative',
  'Video & Animation',
  'Audio & Voice',
  'Writing & Content',
  'Productivity & Workflow'
];

const SAMPLE_PROMPT_SUGGESTIONS = [
  { label: 'Write blog post with SEO structure', query: 'write detailed blog post with engaging introduction' },
  { label: 'Scaffold Next.js API & Prisma models', query: 'generate REST API routes with prisma database' },
  { label: 'Photorealistic architectural render', query: 'hyper-realistic minimalist architectural tech studio background' },
  { label: 'Clone voice for narration', query: 'realistic AI voice generator voiceover' },
];

export default function SearchSpotlightModal({
  isOpen,
  onClose,
  isLightMode = true,
}: SearchSpotlightModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeView, setActiveView] = useState<'all' | 'tools' | 'prompts'>('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [copiedUserPrompt, setCopiedUserPrompt] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Extract all prompts from tools
  const allPrompts: PromptMatch[] = useMemo(() => {
    return extractAllPrompts(tools);
  }, []);

  // Check if current query is a prompt / task intent
  const isPrompt = useMemo(() => isPromptIntent(query), [query]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
      setSelectedCategory('All');
      setActiveView('all');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter tools based on query & category using intelligent prompt & keyword matching
  const filteredTools: Tool[] = useMemo(() => {
    return matchTools(tools, query, selectedCategory, 8);
  }, [query, selectedCategory]);

  // Filter prompts matching the query
  const matchedPrompts: PromptMatch[] = useMemo(() => {
    return matchPrompts(allPrompts, query, 6);
  }, [query, allPrompts]);

  const handleCopyPrompt = (promptText: string, promptId: string) => {
    navigator.clipboard.writeText(promptText);
    setCopiedPromptId(promptId);
    setTimeout(() => setCopiedPromptId(null), 2000);
  };

  const handleCopyRawUserPrompt = () => {
    if (!query.trim()) return;
    navigator.clipboard.writeText(query.trim());
    setCopiedUserPrompt(true);
    setTimeout(() => setCopiedUserPrompt(false), 2000);
  };

  const handleLaunchInAi = (serviceUrl: string) => {
    if (query.trim()) {
      navigator.clipboard.writeText(query.trim());
    }
    window.open(serviceUrl, '_blank', 'noopener,noreferrer');
  };

  // Keyboard navigation
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredTools.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredTools.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredTools[selectedIndex]) {
        router.push(`/discover/${filteredTools[selectedIndex].id}`);
        onClose();
      } else if (query.trim()) {
        router.push(`/discover?q=${encodeURIComponent(query.trim())}`);
        onClose();
      }
    }
  };

  const handleFullSearch = () => {
    if (query.trim()) {
      router.push(`/discover?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push('/discover');
    }
    onClose();
  };

  if (!isOpen) return null;

  const wordCount = query.trim().split(/\s+/).filter(Boolean).length;
  const tokenEstimate = Math.ceil(query.length / 4);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-16 px-4 overflow-y-auto">
      {/* Backdrop with Blur */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Spotlight Command Modal Card */}
      <div className={cn(
        "relative w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden z-10 transition-all animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[88vh]",
        isLightMode 
          ? "bg-white border-slate-200/90 shadow-slate-400/30 text-slate-900" 
          : "bg-[#10111A]/95 border-white/10 shadow-black/80 text-white"
      )}>
        {/* Top Search Input Bar (Accepts Tools, Prompts & Tasks) */}
        <div className={cn(
          "flex items-center gap-3.5 px-5 py-4 border-b",
          isLightMode ? "border-slate-100 bg-slate-50/50" : "border-white/10 bg-white/[0.02]"
        )}>
          <Search className="w-5 h-5 text-[#FF3344] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Type any prompt or search 320+ tools (e.g. 'write blog post with SEO', 'Cursor')..."
            className={cn(
              "flex-1 bg-transparent text-sm sm:text-base font-medium focus:outline-none transition-colors",
              isLightMode ? "text-slate-900 placeholder:text-slate-400" : "text-white placeholder:text-white/40"
            )}
            autoComplete="off"
            spellCheck="false"
          />

          {query && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className={cn(
                "p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors",
                isLightMode ? "text-slate-400 hover:text-slate-700" : "text-white/40 hover:text-white"
              )}
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onClose}
            className={cn(
              "px-2 py-1 rounded-lg text-[10px] font-mono font-bold border transition-colors select-none",
              isLightMode 
                ? "bg-white border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900" 
                : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white"
            )}
            title="Press Escape to close"
          >
            ESC
          </button>
        </div>

        {/* Mode Selector: All / Tools / Tested Prompts */}
        <div className={cn(
          "flex items-center justify-between px-5 py-2 border-b text-xs flex-wrap gap-2",
          isLightMode ? "border-slate-100 bg-slate-50/40" : "border-white/5 bg-white/[0.01]"
        )}>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveView('all')}
              className={cn(
                "px-2.5 py-1 rounded-lg font-bold transition-all text-xs flex items-center gap-1",
                activeView === 'all'
                  ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <Sparkles className="w-3 h-3 text-[#FF3344]" />
              <span>All Results</span>
            </button>

            <button
              onClick={() => setActiveView('tools')}
              className={cn(
                "px-2.5 py-1 rounded-lg font-bold transition-all text-xs flex items-center gap-1",
                activeView === 'tools'
                  ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <Zap className="w-3 h-3 text-[#FF7B00]" />
              <span>Tools ({filteredTools.length})</span>
            </button>

            <button
              onClick={() => setActiveView('prompts')}
              className={cn(
                "px-2.5 py-1 rounded-lg font-bold transition-all text-xs flex items-center gap-1",
                activeView === 'prompts'
                  ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <MessageSquare className="w-3 h-3 text-blue-500" />
              <span>Prompt Templates ({matchedPrompts.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isPrompt && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 animate-pulse">
                ✓ Prompt Accepted
              </span>
            )}
            <span className="text-[10px] font-mono font-bold text-slate-400 hidden sm:inline">
              Neural Intent Matcher
            </span>
          </div>
        </div>

        {/* Quick Inspiration Chips when query is empty */}
        {!query && (
          <div className={cn(
            "p-3 border-b flex flex-col gap-2 text-xs",
            isLightMode ? "border-slate-100 bg-slate-50/20" : "border-white/5 bg-black/20"
          )}>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Try a natural language prompt or workflow task:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_PROMPT_SUGGESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(item.query);
                    inputRef.current?.focus();
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-xl text-[11px] font-medium border transition-colors flex items-center gap-1 text-left",
                    isLightMode 
                      ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-700" 
                      : "bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white"
                  )}
                >
                  <Wand2 className="w-3 h-3 text-[#FF7B00] shrink-0" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results Stream Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 max-h-[55vh]">
          {/* Section 0: Interactive Custom Prompt Card if user typed an actionable prompt */}
          {isPrompt && query.trim() && (
            <div className={cn(
              "p-4 rounded-2xl border transition-all space-y-3",
              isLightMode 
                ? "bg-gradient-to-r from-red-500/5 via-orange-500/5 to-transparent border-red-500/25" 
                : "bg-gradient-to-r from-red-500/10 via-orange-500/5 to-transparent border-red-500/30"
            )}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#FF3344]/15 border border-[#FF3344]/30 flex items-center justify-center text-[#FF3344]">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Actionable Prompt Recognized
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    ({wordCount} words • ~{tokenEstimate} tokens)
                  </span>
                </div>

                <button
                  onClick={handleCopyRawUserPrompt}
                  className={cn(
                    "px-3 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shadow-sm",
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
                      <span>Copy My Prompt</span>
                    </>
                  )}
                </button>
              </div>

              {/* Formatted prompt quote box */}
              <div className={cn(
                "p-3 rounded-xl border font-mono text-xs leading-relaxed select-all",
                isLightMode ? "bg-white border-slate-200 text-slate-800" : "bg-black/50 border-white/10 text-white/90"
              )}>
                &ldquo;{query}&rdquo;
              </div>

              {/* Instant Execution Launchers */}
              <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-white/60">
                  Run this prompt in AI:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => handleLaunchInAi(`https://chatgpt.com/?q=${encodeURIComponent(query)}`)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-1"
                  >
                    <span>ChatGPT</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                  <button
                    onClick={() => handleLaunchInAi(`https://claude.ai`)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all flex items-center gap-1"
                  >
                    <span>Claude</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                  <button
                    onClick={() => handleLaunchInAi(`https://www.perplexity.ai/search?q=${encodeURIComponent(query)}`)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-all flex items-center gap-1"
                  >
                    <span>Perplexity</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                  <button
                    onClick={() => handleLaunchInAi(`https://cursor.com`)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 transition-all flex items-center gap-1"
                  >
                    <span>Cursor</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Section 1: Matching Tools */}
          {(activeView === 'all' || activeView === 'tools') && filteredTools.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Recommended AI Tools ({filteredTools.length})</span>
                <span className="text-[10px] font-normal lowercase">Press ↵ to open</span>
              </div>

              {filteredTools.map((tool, idx) => {
                const isHighlighted = idx === selectedIndex;
                return (
                  <div
                    key={tool.id}
                    onClick={() => {
                      router.push(`/discover/${tool.id}`);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={cn(
                      "flex items-center justify-between gap-3 p-3 rounded-2xl cursor-pointer transition-all border",
                      isHighlighted
                        ? isLightMode
                          ? "bg-red-500/10 border-red-500/30 shadow-sm"
                          : "bg-red-500/15 border-red-500/40 shadow-sm"
                        : isLightMode
                          ? "bg-transparent border-transparent hover:bg-slate-100/70"
                          : "bg-transparent border-transparent hover:bg-white/5"
                    )}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={cn(
                        "w-10 h-10 rounded-xl border flex items-center justify-center p-1.5 overflow-hidden shrink-0",
                        isLightMode ? "bg-white border-slate-200" : "bg-[#1E2333] border-white/10"
                      )}>
                        <img src={tool.icon} alt={tool.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-bold text-sm tracking-tight truncate",
                            isLightMode ? "text-slate-900" : "text-white"
                          )}>
                            {tool.name}
                          </span>
                          <span className={cn(
                            "text-[10px] px-2 py-0.2 rounded-md font-semibold shrink-0",
                            tool.pricing === 'Free' ? "badge-emerald" : tool.pricing === 'Freemium' ? "badge-brand" : "badge-amber"
                          )}>
                            {tool.pricing}
                          </span>
                        </div>
                        <p className={cn(
                          "text-xs truncate max-w-md",
                          isLightMode ? "text-slate-500" : "text-white/60"
                        )}>
                          {tool.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn(
                        "text-[11px] font-mono font-bold hidden sm:inline px-2 py-0.5 rounded border",
                        isLightMode ? "bg-slate-100 border-slate-200 text-slate-600" : "bg-white/5 border-white/10 text-white/50"
                      )}>
                        {tool.trustScore}% Trust
                      </span>
                      <span className={cn(
                        "p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1",
                        isHighlighted
                          ? "bg-[#D9042B] text-white border-transparent"
                          : isLightMode ? "bg-white border-slate-200 text-slate-500" : "bg-white/5 border-white/10 text-white/50"
                      )}>
                        <CornerDownLeft className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Section 2: Matching Tested Prompts */}
          {(activeView === 'all' || activeView === 'prompts') && matchedPrompts.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Verified Prompt Templates ({matchedPrompts.length})</span>
                <span className="text-[10px] font-normal lowercase">1-Click Copy</span>
              </div>

              {matchedPrompts.map((p) => {
                const isCopied = copiedPromptId === p.id;
                return (
                  <div
                    key={p.id}
                    className={cn(
                      "p-3.5 rounded-2xl border transition-all space-y-2",
                      isLightMode 
                        ? "bg-slate-50/80 border-slate-200 hover:border-slate-300" 
                        : "bg-white/[0.03] border-white/10 hover:border-white/20"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md overflow-hidden shrink-0 border border-slate-200 dark:border-white/10">
                          <img src={p.toolIcon} alt={p.toolName} className="w-full h-full object-contain" />
                        </div>
                        <span className="text-xs font-bold">{p.title}</span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full badge-brand">
                          for {p.toolName}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopyPrompt(p.prompt, p.id)}
                          className={cn(
                            "px-2.5 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1",
                            isCopied
                              ? "bg-emerald-500 text-white border-transparent"
                              : isLightMode
                                ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-700"
                                : "bg-white/10 hover:bg-white/15 border-white/10 text-white"
                          )}
                          title="Copy prompt text"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Prompt</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Prompt text quote box */}
                    <p className={cn(
                      "text-xs font-mono p-2.5 rounded-xl border leading-relaxed select-all line-clamp-2",
                      isLightMode 
                        ? "bg-white border-slate-200 text-slate-800" 
                        : "bg-black/40 border-white/5 text-white/80"
                    )}>
                      &ldquo;{p.prompt}&rdquo;
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {filteredTools.length === 0 && matchedPrompts.length === 0 && !isPrompt && (
            <div className="py-12 text-center space-y-2">
              <Sparkles className="w-8 h-8 text-[#FF3344] mx-auto opacity-60" />
              <p className={cn("text-sm font-bold", isLightMode ? "text-slate-800" : "text-white")}>
                No exact matches for &ldquo;{query}&rdquo;
              </p>
              <p className={cn("text-xs max-w-sm mx-auto", isLightMode ? "text-slate-500" : "text-white/50")}>
                Try typing a broader action like &lsquo;generate image&rsquo;, &lsquo;code assist&rsquo;, or &lsquo;voice clone&rsquo;.
              </p>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className={cn(
          "px-5 py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-xs",
          isLightMode ? "border-slate-100 bg-slate-50 text-slate-500" : "border-white/5 bg-black/30 text-white/50"
        )}>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded font-mono border text-[10px] bg-slate-200/50 dark:bg-white/10">↑↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded font-mono border text-[10px] bg-slate-200/50 dark:bg-white/10">↵</kbd>
              <span>to open</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded font-mono border text-[10px] bg-slate-200/50 dark:bg-white/10">esc</kbd>
              <span>to exit</span>
            </span>
          </div>

          <button
            onClick={handleFullSearch}
            className="text-xs font-bold text-[#FF3344] hover:underline flex items-center gap-1"
          >
            <span>Search all in Discover</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
