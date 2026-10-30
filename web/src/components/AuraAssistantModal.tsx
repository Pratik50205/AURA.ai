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
  SlidersHorizontal,
  Copy,
  Check,
  Code2,
  Settings,
  Key,
  Cpu,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle
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
  brainInfo?: { provider: string; model: string } | null;
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

function CodeBlock({ language, code }: { language?: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2.5 rounded-xl overflow-hidden border border-white/10 bg-[#0d0f17] text-white text-xs font-mono shadow-sm">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#171a27] border-b border-white/10 text-[11px] text-white/60">
        <span className="font-semibold uppercase tracking-wider text-[10px] text-amber-400">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors px-1.5 py-0.5 rounded hover:bg-white/10"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto leading-relaxed text-slate-200">
        <code>{code.trim()}</code>
      </pre>
    </div>
  );
}

function TextSection({ text }: { text: string }) {
  const lines = text.split('\n');

  return (
    <div className="space-y-2">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-0.5" />;

        // Header ###
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-bold text-sm text-foreground pt-1">
              {trimmed.replace(/^###\s+/, '')}
            </h4>
          );
        }

        const isBullet = trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ');
        const cleanLine = isBullet ? trimmed.replace(/^[•\-*]\s+/, '') : trimmed;

        // Parse bold, italics, inline code
        const parts = cleanLine.split(/(`[^`]+`|\*\*.*?\*\*|\*.*?\*)/g);

        const renderedLine = parts.map((part, pIdx) => {
          if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
            return (
              <code key={pIdx} className="px-1.5 py-0.5 rounded bg-black/15 dark:bg-white/10 font-mono text-[11px] text-amber-600 dark:text-amber-400 border border-black/5 dark:border-white/10">
                {part.slice(1, -1)}
              </code>
            );
          }
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

function FormattedMarkdown({ content, isUser }: { content: string; isUser: boolean }) {
  if (isUser) {
    return <span className="font-medium">{content}</span>;
  }

  // Parse fenced code blocks
  const codeBlockRegex = /```([a-zA-Z0-9_\-]+)?\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <TextSection key={`t_${lastIndex}`} text={content.slice(lastIndex, match.index)} />
      );
    }
    const lang = match[1];
    const code = match[2];
    parts.push(
      <CodeBlock key={`c_${match.index}`} language={lang} code={code} />
    );
    lastIndex = codeBlockRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(
      <TextSection key={`t_${lastIndex}`} text={content.slice(lastIndex)} />
    );
  }

  return <div className="space-y-2">{parts}</div>;
}

export default function AuraAssistantModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showBrainSettings, setShowBrainSettings] = useState(false);
  
  // AI Brain configuration state
  const [brainProvider, setBrainProvider] = useState<'builtin' | 'gemini' | 'groq' | 'openai' | 'ollama'>('builtin');
  const [brainApiKey, setBrainApiKey] = useState('');
  const [brainModel, setBrainModel] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const latestMessageRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { savedTools, toggleSaveTool, isLightMode } = useDashboard();

  // Load saved brain config from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('aura_llm_brain_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.provider) setBrainProvider(parsed.provider);
        if (parsed.apiKey) setBrainApiKey(parsed.apiKey);
        if (parsed.model) setBrainModel(parsed.model);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSaveBrainConfig = () => {
    try {
      const cfg = {
        provider: brainProvider,
        apiKey: brainApiKey,
        model: brainModel,
      };
      localStorage.setItem('aura_llm_brain_config', JSON.stringify(cfg));
      setTestStatus('success');
      setTestMessage('Brain settings saved successfully!');
      setTimeout(() => {
        setTestStatus('idle');
        setTestMessage('');
        setShowBrainSettings(false);
      }, 1500);
    } catch {
      setTestStatus('error');
      setTestMessage('Failed to save to local storage.');
    }
  };

  const handleTestBrain = async () => {
    if (brainProvider !== 'builtin' && !brainApiKey.trim()) {
      setTestStatus('error');
      setTestMessage('Please enter an API key to test.');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Pinging AI model brain...');

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Ping test',
          brainConfig: {
            provider: brainProvider,
            apiKey: brainApiKey.trim(),
            model: brainModel.trim(),
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTestStatus('success');
        setTestMessage(`Connected to ${data.brainInfo?.provider || brainProvider} (${data.brainInfo?.model || 'active'}) successfully!`);
      } else {
        throw new Error('Connection failed');
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(err.message || 'Connection test failed. Check key & model name.');
    }
  };

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
          brainConfig: {
            provider: brainProvider,
            apiKey: brainApiKey.trim() || undefined,
            model: brainModel.trim() || undefined,
          }
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
        brainInfo: data.brainInfo || null,
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

  const getBrainBadgeLabel = () => {
    switch (brainProvider) {
      case 'gemini': return 'Gemini 1.5 Flash';
      case 'groq': return 'Groq Llama 3.3';
      case 'openai': return 'GPT-4o mini';
      case 'ollama': return 'Ollama (Local)';
      default: return 'Built-in Engine';
    }
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
                    <button
                      onClick={() => setShowBrainSettings(!showBrainSettings)}
                      className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all ${
                        brainProvider === 'builtin'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : 'bg-amber-500/15 text-amber-500 border-amber-500/30 hover:bg-amber-500/25'
                      }`}
                      title="Click to configure AI Brain Model or API Key"
                    >
                      <Cpu className="w-2.5 h-2.5" />
                      <span>{getBrainBadgeLabel()}</span>
                      <Settings className="w-2.5 h-2.5 opacity-60" />
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium">Neural Discovery & Accurate Multi-Domain Copilot</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowBrainSettings(!showBrainSettings)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                  title="Configure Brain (API Key)"
                >
                  <Cpu className="w-4 h-4 text-[#FF7B00]" />
                </button>
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

            {/* Brain Model & API Key Configuration Drawer */}
            <AnimatePresence>
              {showBrainSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className={`border-b overflow-hidden text-xs transition-colors ${
                    isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-[#181a26] border-white/10'
                  }`}
                >
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Key className="w-3.5 h-3.5 text-[#FF3344]" />
                        <span>Configure AI Brain Model</span>
                      </div>
                      <button
                        onClick={() => setShowBrainSettings(false)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Provider Selection Tabs */}
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'builtin', label: 'Built-in Engine' },
                        { id: 'gemini', label: 'Google Gemini' },
                        { id: 'groq', label: 'Groq (Llama 3.3)' },
                        { id: 'openai', label: 'OpenAI (GPT-4o)' },
                        { id: 'ollama', label: 'Ollama (Local)' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setBrainProvider(item.id as any);
                            if (item.id === 'gemini' && !brainModel) setBrainModel('gemini-1.5-flash');
                            if (item.id === 'groq' && !brainModel) setBrainModel('llama-3.3-70b-versatile');
                            if (item.id === 'openai' && !brainModel) setBrainModel('gpt-4o-mini');
                            if (item.id === 'ollama' && !brainModel) setBrainModel('llama3');
                          }}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all border ${
                            brainProvider === item.id
                              ? 'bg-[#FF3344] text-white border-transparent shadow-sm'
                              : isLightMode
                                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    {brainProvider !== 'builtin' && (
                      <div className="space-y-2 pt-1">
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                            {brainProvider === 'ollama' ? 'Ollama Base URL' : `${brainProvider.toUpperCase()} API Key`}
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type={showApiKey || brainProvider === 'ollama' ? 'text' : 'password'}
                              value={brainApiKey}
                              onChange={(e) => setBrainApiKey(e.target.value)}
                              placeholder={
                                brainProvider === 'gemini' 
                                  ? 'AIzaSy...' 
                                  : brainProvider === 'groq'
                                    ? 'gsk_...'
                                    : brainProvider === 'ollama'
                                      ? 'http://127.0.0.1:11434'
                                      : 'sk-proj-...'
                              }
                              className={`w-full px-3 py-1.5 text-xs rounded-xl border focus:outline-none pr-8 font-mono ${
                                isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-black/40 border-white/10 text-white'
                              }`}
                            />
                            {brainProvider !== 'ollama' && (
                              <button
                                type="button"
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="absolute right-2.5 text-muted-foreground hover:text-foreground"
                              >
                                {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                            Model Name (Optional Override)
                          </label>
                          <input
                            type="text"
                            value={brainModel}
                            onChange={(e) => setBrainModel(e.target.value)}
                            placeholder={
                              brainProvider === 'gemini' 
                                ? 'gemini-1.5-flash' 
                                : brainProvider === 'groq'
                                  ? 'llama-3.3-70b-versatile'
                                  : brainProvider === 'ollama'
                                    ? 'llama3'
                                    : 'gpt-4o-mini'
                            }
                            className={`w-full px-3 py-1.5 text-xs rounded-xl border focus:outline-none font-mono ${
                              isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-black/40 border-white/10 text-white'
                            }`}
                          />
                        </div>

                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          💡 Keys are stored locally in your browser. You can also define <code className="font-mono text-amber-500">GEMINI_API_KEY</code> or <code className="font-mono text-amber-500">OPENAI_API_KEY</code> in your <code className="font-mono">.env.local</code>.
                        </p>
                      </div>
                    )}

                    {testMessage && (
                      <div className={`p-2 rounded-xl text-[11px] font-medium flex items-center gap-1.5 ${
                        testStatus === 'success'
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : testStatus === 'error'
                            ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}>
                        {testStatus === 'success' ? <CheckCircle className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                        <span>{testMessage}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={handleSaveBrainConfig}
                        className="px-3 py-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-[#D9042B] to-[#FF7B00] text-white hover:opacity-95 shadow-sm transition-all"
                      >
                        Save Configuration
                      </button>
                      {brainProvider !== 'builtin' && (
                        <button
                          onClick={handleTestBrain}
                          disabled={testStatus === 'testing'}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all ${
                            isLightMode ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                          }`}
                        >
                          {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
                      Ask me general science, math, or coding questions, or ask for AI tool discovery and pricing benchmarks.
                    </p>
                  </div>

                  <div className="w-full space-y-2 pt-2">
                    <p className="text-[11px] font-semibold text-left text-muted-foreground uppercase tracking-wider px-1">
                      Suggested Inquiries
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {STARTER_PROMPTS.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(p.query)}
                          className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all duration-200 flex items-center justify-between group ${
                            isLightMode 
                              ? 'bg-white border-gray-200 hover:border-red-300 hover:bg-red-50/30 text-gray-800' 
                              : 'bg-[#181824] border-[#29293b] hover:border-[#D9042B]/40 hover:bg-[#1e1e2d] text-white/90'
                          }`}
                        >
                          <span className="font-medium group-hover:text-[#FF3344] transition-colors">{p.label}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-[#FF3344] group-hover:translate-x-0.5 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => {
                  const isUser = message.role === 'user';
                  const isLatest = index === messages.length - 1;

                  return (
                    <div
                      key={message.id}
                      ref={isLatest ? latestMessageRef : null}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                    >
                      {/* Avatar & Sender Label */}
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground px-1 font-medium">
                        {isUser ? (
                          <span>You</span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Bot className="w-3 h-3 text-[#FF3344]" />
                            <span className="font-semibold text-foreground">AURA Copilot</span>
                            {message.brainInfo && (
                              <span className="px-1.5 py-0.2 rounded-full font-mono text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                {message.brainInfo.provider}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Bubble */}
                      <div
                        className={`max-w-[88%] sm:max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                          isUser
                            ? 'bg-gradient-to-r from-[#D9042B] to-[#FF7B00] text-white rounded-br-none shadow-red-500/20 font-medium'
                            : isLightMode
                              ? 'bg-gray-100/90 text-gray-800 rounded-bl-none border border-gray-200/80 shadow-gray-200/50'
                              : 'bg-[#181824] text-white/95 rounded-bl-none border border-[#2a2a3c] shadow-black/40'
                        }`}
                      >
                        <FormattedMarkdown content={message.content} isUser={isUser} />

                        {/* Comparison Card (If comparison query) */}
                        {message.comparison && (
                          <div className="mt-3 pt-3 border-t border-white/10 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#FF7B00] uppercase tracking-wider flex items-center gap-1">
                                <Zap className="w-3.5 h-3.5" /> Side-by-Side Comparison
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
                              <Zap className="w-3 h-3" /> {message.latencyMs}ms
                            </span>
                          ) : (
                            <span></span>
                          )}
                          <span className="font-mono">{message.timestamp}</span>
                        </div>
                      </div>

                      {/* Tool Cards (ONLY RENDERED WHEN TOOLS ARE RETURNED) */}
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
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center p-1.5 overflow-hidden shrink-0">
                                      <img
                                        src={tool.icon}
                                        alt={tool.name}
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                          (e.target as HTMLElement).style.display = 'none';
                                        }}
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-xs truncate">{tool.name}</span>
                                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/10 font-semibold text-muted-foreground">
                                          {tool.pricing}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-muted-foreground truncate max-w-[180px] sm:max-w-[240px]">
                                        {tool.description}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      onClick={() => toggleSaveTool(tool.id)}
                                      className={`p-1.5 rounded-lg border transition-colors ${
                                        isSaved
                                          ? 'bg-red-500/10 border-red-500/30 text-[#FF3344]'
                                          : 'border-white/10 text-muted-foreground hover:text-foreground'
                                      }`}
                                      title={isSaved ? 'Remove from Saved' : 'Save Tool'}
                                    >
                                      {isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                                    </button>
                                    <a
                                      href={tool.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 rounded-lg border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                                      title="Visit Website"
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

                      {/* Suggested Follow-ups */}
                      {message.suggestedFollowUps && message.suggestedFollowUps.length > 0 && isLatest && !isLoading && (
                        <div className="flex flex-wrap gap-1.5 mt-2 pt-1 pl-1">
                          {message.suggestedFollowUps.map((prompt, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSendMessage(prompt)}
                              className={`text-[11px] px-2.5 py-1 rounded-full border transition-all text-left flex items-center gap-1 shadow-sm ${
                                isLightMode
                                  ? 'bg-white border-gray-200 text-gray-700 hover:border-red-400 hover:text-[#FF3344] hover:bg-red-50/50'
                                  : 'bg-white/5 border-white/10 text-white/70 hover:border-red-500/40 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              <span>{prompt}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground text-xs py-2 pl-2">
                  <div className="w-4 h-4 rounded-full border-2 border-[#FF3344] border-t-transparent animate-spin" />
                  <span className="font-medium animate-pulse">
                    {brainProvider === 'builtin' ? 'AURA Neural Engine evaluating response...' : `Consulting ${getBrainBadgeLabel()}...`}
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className={`p-3 border-t flex items-center gap-2 ${
                isLightMode ? 'border-gray-200 bg-white' : 'border-[#222232] bg-[#161622]'
              }`}
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={
                  brainProvider === 'builtin'
                    ? "Ask any question, or ask for AI tools..."
                    : `Ask ${getBrainBadgeLabel()} anything...`
                }
                disabled={isLoading}
                className={`flex-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm focus:outline-none transition-colors border ${
                  isLightMode
                    ? 'bg-gray-100/80 border-gray-200 text-gray-900 focus:border-red-400 focus:bg-white placeholder:text-gray-400'
                    : 'bg-white/5 border-white/10 text-white focus:border-[#D9042B]/60 focus:bg-white/10 placeholder:text-white/40'
                }`}
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="p-2.5 rounded-xl bg-gradient-to-r from-[#D9042B] to-[#FF7B00] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-95 shadow-md shadow-red-500/25 active:scale-95 transition-all shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
