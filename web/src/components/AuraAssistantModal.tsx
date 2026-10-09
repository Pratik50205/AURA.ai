'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  Bookmark, 
  BookmarkCheck, 
  ExternalLink, 
  Maximize2, 
  Minimize2, 
  RotateCcw,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  SlidersHorizontal
} from 'lucide-react';
import { useDashboard } from '@/app/(dashboard)/layout';
import type { Tool } from '@/lib/site';
import { tools } from '@/data/tools';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tools?: Tool[];
  comparison?: {
    toolA: Tool;
    toolB: Tool;
    summary: string;
    keyDifferences: string[];
    winnerFor: { [criterion: string]: string };
  } | null;
  suggestedFollowUps?: string[];
  latencyMs?: number;
  timestamp: string;
}

const STARTER_PROMPTS = [
  { label: '🎬 Free video editing tools', query: 'Find free AI tools for YouTube video editing with captions' },
  { label: '⚡ Cursor vs GitHub Copilot', query: 'Compare Cursor vs GitHub Copilot for coding' },
  { label: '📊 AI Presentation makers', query: 'Best AI tools for generating slide decks and presentations' },
  { label: '📝 Open-source LLM assistants', query: 'Show me open-source or free alternatives to ChatGPT' },
];

function FormattedMarkdown({ content, isUser }: { content: string; isUser: boolean }) {
  if (isUser) {
    return <span className="font-medium">{content}</span>;
  }

  const lines = content.split('\n');

  return (
    <div className="space-y-2.5">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-0.5" />;

        const isBullet = trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ');
        const cleanLine = isBullet ? trimmed.replace(/^[•\-*]\s+/, '') : trimmed;

        const parts = cleanLine.split(/(\*\*.*?\*\*|\*.*?\*)/g);

        const renderedLine = parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            const boldText = part.slice(2, -2);
            if (boldText.toLowerCase().includes('verdict')) {
              return (
                <span 
                  key={pIdx} 
                  className="inline-flex items-center gap-1 font-bold text-[#FF7B00] bg-[#FF7B00]/15 border border-[#FF7B00]/30 px-2 py-0.5 rounded text-xs mr-1 shadow-sm"
                >
                  <Sparkles className="w-3 h-3 text-[#FF7B00]" />
                  {boldText}
                </span>
              );
            }
            return (
              <strong key={pIdx} className="font-bold text-foreground">
                {boldText}
              </strong>
            );
          }
          if (part.startsWith('*') && part.endsWith('*')) {
            return (
              <em key={pIdx} className="italic text-muted-foreground">
                {part.slice(1, -1)}
              </em>
            );
          }
          return <span key={pIdx}>{part}</span>;
        });

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF3344] mt-2 flex-shrink-0 shadow-sm shadow-red-500/50" />
              <div className="flex-1 leading-relaxed text-xs sm:text-sm">{renderedLine}</div>
            </div>
          );
        }

        return (
          <p key={idx} className="text-xs sm:text-sm leading-relaxed">
            {renderedLine}
          </p>
        );
      })}
    </div>
  );
}

export default function AuraAssistantModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const latestMessageRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { savedTools, toggleSaveTool, isLightMode } = useDashboard();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Smart auto-scrolling
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && latestMessageRef.current) {
        latestMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: messages.slice(-4).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get assistant response');
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Here is what I found for your request.',
        tools: data.tools || [],
        comparison: data.comparison || null,
        suggestedFollowUps: data.suggestedFollowUps || [],
        latencyMs: data.latencyMs,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `assistant-error-${Date.now()}`,
        role: 'assistant',
        content: 'I had trouble connecting to the neural vector index. Please check your connection or try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <>
      {/* Floating Trigger Orb */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <button
              onClick={() => setIsOpen(true)}
              className="group relative flex items-center gap-3 px-5 py-3.5 rounded-full shadow-2xl text-white font-medium bg-gradient-to-r from-[#D9042B] via-[#FF3344] to-[#FF7B00] hover:shadow-[0_0_30px_rgba(217,4,43,0.55)] transition-all duration-300 hover:scale-105 active:scale-95"
              aria-label="Open AURA Assistant Chatbot"
            >
              <div className="relative">
                <Bot className="w-5 h-5 animate-pulse" />
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <span className="text-sm font-semibold tracking-wide">Ask AURA</span>
              <span className="hidden sm:inline-block text-xs bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/30 font-mono">
                AI Copilot
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-out Drawer / Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className={`fixed z-50 bottom-6 right-4 sm:right-6 flex flex-col shadow-2xl rounded-2xl overflow-hidden border backdrop-blur-2xl transition-all duration-300 ${
              isExpanded 
                ? 'w-[94vw] sm:w-[700px] h-[86vh] max-h-[880px]' 
                : 'w-[94vw] sm:w-[470px] h-[650px] max-h-[85vh]'
            } ${
              isLightMode
                ? 'bg-white/95 border-gray-200 text-gray-900 shadow-gray-400/30'
                : 'bg-[#12121a]/95 border-[#282838] text-white shadow-black/85'
            }`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-5 py-4 border-b ${
              isLightMode ? 'border-gray-100 bg-gray-50/80' : 'border-[#222232] bg-[#161622]/90'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#D9042B] to-[#FF7B00] flex items-center justify-center text-white shadow-md shadow-red-500/25">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold tracking-tight">AURA AI Assistant</h3>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      {tools.length} Vector Tools
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium">Neural Discovery & Real-Time Comparison</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                    title="Clear Conversation"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="hidden sm:block p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                  title={isExpanded ? 'Collapse View' : 'Expand View'}
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                  title="Close Assistant"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Conversation Body with Sleek Scrollbar */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/25">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col justify-center items-center text-center px-4 py-8 space-y-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#D9042B]/20 to-[#FF7B00]/20 border border-[#D9042B]/30 flex items-center justify-center text-[#FF3344] shadow-inner">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-base font-bold">How can I help you today?</h4>
                    <p className="text-xs text-muted-foreground max-w-[340px] leading-relaxed">
                      Ask me to discover tools for any workflow, compare pricing, or find open-source alternatives.
                    </p>
                  </div>

                  <div className="w-full space-y-2 pt-2">
                    <p className="text-[11px] font-semibold text-left text-muted-foreground uppercase tracking-wider px-1">
                      Suggested Inquiries
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {STARTER_PROMPTS.map((starter, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(starter.query)}
                          className={`w-full text-left p-2.5 rounded-xl border text-xs font-medium transition-all duration-200 flex items-center justify-between group ${
                            isLightMode
                              ? 'bg-gray-50 border-gray-200 hover:bg-red-50 hover:border-red-300 text-gray-800'
                              : 'bg-[#181824] border-[#2c2c3e] hover:bg-[#202030] hover:border-[#D9042B]/50 text-gray-200'
                          }`}
                        >
                          <span>{starter.label}</span>
                          <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-[#FF3344]" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((message, mIdx) => {
                  const isLastAssistant = message.role === 'assistant' && mIdx === messages.length - 1;
                  return (
                    <div
                      key={message.id}
                      ref={isLastAssistant ? latestMessageRef : null}
                      className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      {/* Message Bubble */}
                      <div
                        className={`max-w-[90%] rounded-2xl px-4 py-3.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-[#D9042B] to-[#FF3344] text-white shadow-md shadow-red-500/10'
                            : isLightMode
                            ? 'bg-gray-100/90 text-gray-900 border border-gray-200'
                            : 'bg-[#1a1a27] text-gray-100 border border-[#2a2a3e]'
                        }`}
                      >
                        {/* Markdown Formatter */}
                        <FormattedMarkdown content={message.content} isUser={message.role === 'user'} />

                        {/* Enhanced Comparison Matrix */}
                        {message.comparison && (
                          <div className="mt-3.5 pt-3.5 border-t border-white/10 space-y-3">
                            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#FF7B00]">
                              <span className="flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5 text-[#FF7B00]" /> Direct Comparison Matrix
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono lowercase">verified ML specs</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5 text-xs">
                              <div className={`p-3 rounded-xl border ${
                                isLightMode ? 'bg-white border-gray-200 shadow-sm' : 'bg-black/35 border-white/10'
                              }`}>
                                <div className="font-bold text-sm text-[#FF3344] truncate">{message.comparison.toolA.name}</div>
                                <div className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground mt-1">
                                  {message.comparison.toolA.pricing}
                                </div>
                                <div className="text-[11px] mt-2 font-semibold flex items-center justify-between">
                                  <span className="text-muted-foreground">Trust Score:</span>
                                  <span className="font-bold text-foreground">{message.comparison.toolA.trustScore}/100</span>
                                </div>
                              </div>

                              <div className={`p-3 rounded-xl border ${
                                isLightMode ? 'bg-white border-gray-200 shadow-sm' : 'bg-black/35 border-white/10'
                              }`}>
                                <div className="font-bold text-sm text-[#FF7B00] truncate">{message.comparison.toolB.name}</div>
                                <div className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground mt-1">
                                  {message.comparison.toolB.pricing}
                                </div>
                                <div className="text-[11px] mt-2 font-semibold flex items-center justify-between">
                                  <span className="text-muted-foreground">Trust Score:</span>
                                  <span className="font-bold text-foreground">{message.comparison.toolB.trustScore}/100</span>
                                </div>
                              </div>
                            </div>

                            {message.comparison.winnerFor && (
                              <div className={`p-2.5 rounded-xl border space-y-1.5 text-xs ${
                                isLightMode ? 'bg-white border-gray-200' : 'bg-black/30 border-white/10'
                              }`}>
                                {Object.entries(message.comparison.winnerFor).map(([crit, winner]) => (
                                  <div key={crit} className="flex justify-between items-center text-[11px]">
                                    <span className="text-muted-foreground font-medium">{crit}:</span>
                                    <span className="font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                      {winner}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Latency & Timestamp */}
                        <div className="flex items-center justify-between gap-3 mt-2.5 pt-1.5 border-t border-white/5 text-[10px] opacity-70">
                          {message.latencyMs ? (
                            <span className="flex items-center gap-1 font-mono text-emerald-400 font-medium">
                              <Zap className="w-3 h-3" /> {message.latencyMs}ms ML
                            </span>
                          ) : (
                            <span></span>
                          )}
                          <span className="font-mono">{message.timestamp}</span>
                        </div>
                      </div>

                      {/* Tool Cards */}
                      {message.tools && message.tools.length > 0 && (
                        <div className="w-full max-w-[94%] mt-2.5 space-y-2">
                          <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 px-1">
                            <Sparkles className="w-3 h-3 text-[#FF3344]" />
                            Recommended Tool Previews ({message.tools.length})
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {message.tools.map((tool) => {
                              const isSaved = savedTools.includes(tool.id);
                              return (
                                <div
                                  key={tool.id}
                                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all duration-200 ${
                                    isLightMode
                                      ? 'bg-white border-gray-200 hover:border-red-300 shadow-sm'
                                      : 'bg-[#181824] border-[#29293b] hover:border-[#D9042B]/50 hover:bg-[#1e1e2d]'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <img
                                      src={tool.icon}
                                      alt={tool.name}
                                      className="w-7 h-7 rounded-lg bg-black/20 p-0.5 object-contain flex-shrink-0"
                                      onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                      }}
                                    />
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <h5 className="text-xs font-bold truncate">{tool.name}</h5>
                                        {tool.verified && (
                                          <ShieldCheck className="w-3 h-3 text-blue-400 flex-shrink-0" />
                                        )}
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-muted-foreground font-medium">
                                          {tool.pricing}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-muted-foreground truncate max-w-[200px] sm:max-w-[280px]">
                                        {tool.category} • <strong className="text-foreground">{tool.trustScore}/100</strong> Trust
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                      onClick={() => toggleSaveTool(tool.id)}
                                      className={`p-1.5 rounded-lg border text-xs transition-colors ${
                                        isSaved
                                          ? 'bg-red-500/10 border-red-500/30 text-[#FF3344]'
                                          : 'bg-white/5 border-white/10 text-muted-foreground hover:text-white'
                                      }`}
                                      title={isSaved ? 'Remove from Saved' : 'Save Tool'}
                                    >
                                      {isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                                    </button>
                                    <a
                                      href={tool.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 rounded-lg bg-[#D9042B]/10 hover:bg-[#D9042B]/20 border border-[#D9042B]/30 text-[#FF3344] transition-colors"
                                      title="Visit Official Site"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Follow-Up Options & Interactive Workflow Chips */}
                      {message.suggestedFollowUps && message.suggestedFollowUps.length > 0 && (
                        <div className="w-full max-w-[95%] mt-3 px-1">
                          {(!message.tools || message.tools.length === 0) && !message.comparison ? (
                            /* Greeting & Conversational Quick-Start Grid */
                            <div className="space-y-2">
                              <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3 text-[#FF7B00]" />
                                Choose a workflow or explore:
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {message.suggestedFollowUps.map((chip, chipIndex) => (
                                  <button
                                    key={chipIndex}
                                    onClick={() => handleSendMessage(chip)}
                                    className={`p-2.5 rounded-xl border text-xs font-medium transition-all duration-200 flex items-center justify-between text-left group shadow-sm ${
                                      isLightMode
                                        ? 'bg-white border-gray-200 hover:border-[#D9042B]/50 hover:bg-red-50 text-gray-800 hover:text-red-600'
                                        : 'bg-[#181824] border-white/10 hover:border-[#FF3344]/50 hover:bg-[#202030] text-gray-200 hover:text-white'
                                    }`}
                                  >
                                    <span className="truncate pr-1">{chip}</span>
                                    <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-[#FF3344] shrink-0" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            /* Compact Horizontal Scroll for Tool Result Recommendations */
                            <div>
                              <div className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-[#FF7B00]" /> Suggested Inquiries
                              </div>
                              <div className="flex gap-2 overflow-x-auto pb-1 pt-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                {message.suggestedFollowUps.map((chip, chipIndex) => (
                                  <button
                                    key={chipIndex}
                                    onClick={() => handleSendMessage(chip)}
                                    className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap shadow-sm ${
                                      isLightMode
                                        ? 'bg-white border-gray-200 hover:border-[#D9042B]/50 hover:bg-red-50 text-gray-800'
                                        : 'bg-[#181824] border-white/10 hover:border-[#FF3344]/50 hover:bg-[#202030] text-gray-200 hover:text-white'
                                    }`}
                                  >
                                    <span className="text-[#FF3344] font-bold">+</span>
                                    <span>{chip}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#D9042B] to-[#FF7B00] flex items-center justify-center text-white flex-shrink-0 animate-pulse shadow-md shadow-red-500/20">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className={`p-3 rounded-2xl text-xs space-y-1.5 shadow-sm ${
                    isLightMode ? 'bg-gray-100 text-gray-800 border border-gray-200' : 'bg-[#1b1b28] text-gray-200 border border-[#2b2b3d]'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#FF3344] animate-ping" />
                      <span className="font-semibold text-[11px]">Searching 384-dimensional vector space...</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Evaluating {tools.length} tool embeddings and multi-signal constraints</p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className={`p-3.5 border-t ${
              isLightMode ? 'border-gray-100 bg-gray-50/90' : 'border-[#222232] bg-[#14141e]/90'
            }`}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask about tools, compare (e.g. Cursor vs Copilot)..."
                  disabled={isLoading}
                  className={`flex-1 text-xs sm:text-sm px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#D9042B]/50 transition-all ${
                    isLightMode
                      ? 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
                      : 'bg-[#1a1a26] border-[#2a2a3e] text-white placeholder:text-gray-500 focus:border-[#D9042B]/70'
                  }`}
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-[#D9042B] to-[#FF7B00] text-white hover:opacity-95 disabled:opacity-35 disabled:cursor-not-allowed transition-all shadow-md shadow-red-500/20 active:scale-95 flex-shrink-0"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
