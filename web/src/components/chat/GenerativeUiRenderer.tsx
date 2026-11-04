'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ExternalLink,
  ArrowRight,
  ArrowLeftRight,
  Check,
  Copy,
  Star,
  Sparkles,
  Layers,
  ChevronRight,
  CheckCircle2,
  Workflow as WorkflowIcon,
  Code2,
  ShieldCheck,
} from 'lucide-react';
import { useCompare } from '@/context/CompareContext';
import { cn } from '@/lib/utils';
import type { Tool } from '@/lib/site';

interface GenerativeUiRendererProps {
  content: string;
  onSendPrompt?: (prompt: string) => void;
}

interface ParsedBlock {
  type: 'text' | 'gen-ui-tool' | 'gen-ui-compare' | 'gen-ui-workflow' | 'gen-ui-chips' | 'code';
  payload?: any;
  rawText?: string;
  language?: string;
}

export default function GenerativeUiRenderer({
  content,
  onSendPrompt,
}: GenerativeUiRendererProps) {
  const { toggleTool, isToolSelected } = useCompare();
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const [copiedPromptIndex, setCopiedPromptIndex] = useState<number | null>(null);

  // Parse markdown content and extract gen-ui blocks
  const parseContent = (text: string): ParsedBlock[] => {
    const blocks: ParsedBlock[] = [];
    const codeBlockRegex = /```([^\r\n`]*)\r?\n?([\s\S]*?)```/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      const matchIndex = match.index;
      const precedingText = text.substring(lastIndex, matchIndex);
      if (precedingText.trim()) {
        blocks.push({ type: 'text', rawText: precedingText });
      }

      let lang = (match[1] || '').trim().toLowerCase();
      let code = match[2].trim();

      // If code starts with :subtag (e.g. :tool-recommendation or :compare or :workflow)
      if (code.startsWith(':')) {
        const firstLineEnd = code.indexOf('\n');
        if (firstLineEnd !== -1) {
          const subTag = code.substring(1, firstLineEnd).trim().toLowerCase();
          lang = lang ? `${lang}:${subTag}` : subTag;
          code = code.substring(firstLineEnd).trim();
        } else {
          const subTag = code.substring(1).trim().toLowerCase();
          lang = lang ? `${lang}:${subTag}` : subTag;
          code = '';
        }
      }

      const isGenUiTag =
        lang.includes('gen-ui') ||
        lang.includes('tool-recommendation') ||
        lang.includes('tools') ||
        lang.includes('compare') ||
        lang.includes('workflow') ||
        lang.includes('action-chips') ||
        lang.includes('chips');

      let parsedPayload: any = null;
      if (isGenUiTag || lang === 'json' || lang === '') {
        const jsonStartIndex = code.search(/[{\[]/);
        if (jsonStartIndex !== -1) {
          const potentialJson = code.substring(jsonStartIndex);
          try {
            parsedPayload = JSON.parse(potentialJson);
          } catch {
            try {
              const cleaned = potentialJson.replace(/,\s*([}\]])/g, '$1');
              parsedPayload = JSON.parse(cleaned);
            } catch {
              // Ignore invalid JSON
            }
          }
        }
      }

      if (parsedPayload) {
        if (
          lang.includes('tool') ||
          (parsedPayload.tools && Array.isArray(parsedPayload.tools))
        ) {
          blocks.push({ type: 'gen-ui-tool', payload: parsedPayload });
        } else if (
          lang.includes('compare') ||
          (parsedPayload.tools && parsedPayload.title && parsedPayload.title.toLowerCase().includes('vs'))
        ) {
          blocks.push({ type: 'gen-ui-compare', payload: parsedPayload });
        } else if (
          lang.includes('workflow') ||
          (parsedPayload.steps && Array.isArray(parsedPayload.steps))
        ) {
          blocks.push({ type: 'gen-ui-workflow', payload: parsedPayload });
        } else if (
          lang.includes('chip') ||
          lang.includes('action') ||
          (parsedPayload.chips && Array.isArray(parsedPayload.chips))
        ) {
          blocks.push({ type: 'gen-ui-chips', payload: parsedPayload });
        } else {
          blocks.push({ type: 'code', rawText: code, language: lang });
        }
      } else {
        blocks.push({ type: 'code', rawText: code, language: lang });
      }

      lastIndex = matchIndex + match[0].length;
    }

    if (lastIndex < text.length) {
      const remaining = text.substring(lastIndex);
      if (remaining.trim()) {
        blocks.push({ type: 'text', rawText: remaining });
      }
    }

    if (blocks.length === 0 && text.trim()) {
      blocks.push({ type: 'text', rawText: text });
    }

    return blocks;
  };

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  const handleCopyPrompt = (prompt: string, index: number) => {
    navigator.clipboard.writeText(prompt);
    setCopiedPromptIndex(index);
    setTimeout(() => setCopiedPromptIndex(null), 2000);
  };

  const blocks = parseContent(content);

  // Render markdown inline formatting
  const renderFormattedText = (raw: string) => {
    const lines = raw.split('\n');
    return (
      <div className="space-y-1 text-xs sm:text-sm leading-relaxed text-slate-300">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={idx} className="h-1.5" />;
          }

          // Headers
          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={idx} className="text-sm font-bold text-white pt-2 pb-0.5 tracking-tight">
                {trimmed.replace('### ', '')}
              </h4>
            );
          }
          if (trimmed.startsWith('## ')) {
            return (
              <h3 key={idx} className="text-base font-extrabold text-white pt-2.5 pb-1 tracking-tight">
                {trimmed.replace('## ', '')}
              </h3>
            );
          }
          if (trimmed.startsWith('# ')) {
            return (
              <h2 key={idx} className="text-lg font-extrabold text-white pt-3 pb-1 tracking-tight">
                {trimmed.replace('# ', '')}
              </h2>
            );
          }

          // Bullet points
          if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
            const itemText = trimmed.replace(/^[-•*]\s+/, '');
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF3344] mt-2 flex-shrink-0" />
                <span
                  className="flex-1"
                  dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(itemText) }}
                />
              </div>
            );
          }

          // Numbered list
          const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-[#FF7B00] font-bold text-xs min-w-[16px]">{numMatch[1]}.</span>
                <span
                  className="flex-1"
                  dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(numMatch[2]) }}
                />
              </div>
            );
          }

          return (
            <p
              key={idx}
              dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }}
            />
          );
        })}
      </div>
    );
  };

  const formatInlineMarkdown = (str: string) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-slate-300 italic">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-black/30 text-[#FF7B00] px-1.5 py-0.5 rounded font-mono text-[11px] border border-white/10">$1</code>');
  };

  return (
    <div className="flex flex-col gap-3">
      {blocks.map((block, idx) => {
        // Standard Text Block
        if (block.type === 'text') {
          return <div key={idx}>{renderFormattedText(block.rawText || '')}</div>;
        }

        // Code Block with Copy
        if (block.type === 'code') {
          const isCopied = copiedCodeIndex === idx;
          return (
            <div
              key={idx}
              className="rounded-xl bg-slate-950/80 border border-white/10 overflow-hidden my-2 text-xs"
            >
              <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/10 text-slate-400">
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <Code2 className="w-3.5 h-3.5 text-[#FF7B00]" />
                  <span className="uppercase">{block.language || 'code'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCode(block.rawText || '', idx)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded hover:bg-white/10 text-[11px] transition-colors"
                >
                  {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-3 overflow-x-auto font-mono text-[11px] leading-relaxed text-slate-200">
                <code>{block.rawText}</code>
              </pre>
            </div>
          );
        }

        // Generative UI: Tool Recommendation Card Widget
        if (block.type === 'gen-ui-tool') {
          const tools = block.payload?.tools || (Array.isArray(block.payload) ? block.payload : [block.payload]);

          return (
            <div
              key={idx}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2"
            >
              {tools.map((item: any, toolIdx: number) => {
                const toolId = item.id || item.tool_id || item.name?.toLowerCase().replace(/\s+/g, '_');
                const isCompared = isToolSelected(toolId);

                const toolObject: Tool = {
                  id: toolId,
                  name: item.name,
                  category: item.category || 'AI Tool',
                  pricing: item.pricing || 'Freemium',
                  description: item.tagline || item.description || '',
                  icon: item.icon || 'Sparkles',
                  url: item.websiteUrl || item.url || '',
                  trustScore: item.trustScore || item.rating ? Math.round(Number(item.rating) * 20) : 85,
                  users: item.users || 'Active',
                  tags: item.features || item.tags || [],
                  verified: item.verified ?? true,
                };

                return (
                  <div
                    key={toolIdx}
                    className={cn(
                      'flex flex-col justify-between p-3.5 rounded-xl bg-slate-900/80 border transition-all shadow-sm',
                      isCompared
                        ? 'border-red-500/70 shadow-red-500/10'
                        : 'border-white/10 hover:border-white/20'
                    )}
                  >
                    <div>
                      {/* Top Row: Name, Category, Pricing */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                            <span>{item.name}</span>
                            {item.verified && (
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {item.category && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                                {item.category}
                              </span>
                            )}
                            {item.pricing && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {item.pricing}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Rating or Trust Score */}
                        <div className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span className="font-bold">{item.rating ? item.rating : item.trustScore ? `${item.trustScore}%` : '4.8'}</span>
                        </div>
                      </div>

                      {/* Tagline / Description */}
                      {(item.tagline || item.description) && (
                        <p className="text-xs text-slate-300 line-clamp-2 mb-2 leading-relaxed">
                          {item.tagline || item.description}
                        </p>
                      )}

                      {/* Key Features Bullet List */}
                      {item.features && Array.isArray(item.features) && item.features.length > 0 && (
                        <div className="space-y-1 mb-3">
                          {item.features.slice(0, 2).map((feat: string, fIdx: number) => (
                            <div key={fIdx} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                              <span className="truncate">{feat}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/10 mt-auto">
                      <Link
                        href={`/discover/${toolId}`}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => toggleTool(toolObject)}
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                          isCompared
                            ? 'bg-red-500 text-white'
                            : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                        )}
                        title={isCompared ? 'Remove from Compare Tray' : 'Add to Compare Tray'}
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                        <span>{isCompared ? 'In Compare' : 'Compare'}</span>
                      </button>

                      {(item.websiteUrl || item.url) && (
                        <a
                          href={item.websiteUrl || item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors"
                          title="Visit official website"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }

        // Generative UI: Side-by-Side Compare Matrix Widget
        if (block.type === 'gen-ui-compare') {
          const compData = block.payload;
          const tools = compData.tools || [];
          const toolIds = tools.map((t: any) => t.id || t.name?.toLowerCase().replace(/\s+/g, '_')).filter(Boolean);

          return (
            <div
              key={idx}
              className="my-3 p-3.5 rounded-xl bg-slate-950/80 border border-red-500/30 overflow-hidden"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-[#FF7B00]" />
                  <h4 className="font-bold text-sm text-white">
                    {compData.title || 'Side-by-Side Tool Comparison'}
                  </h4>
                </div>
                {toolIds.length >= 2 && (
                  <Link
                    href={`/compare?ids=${toolIds.join(',')}`}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#FF7B00] hover:underline"
                  >
                    <span>Full Matrix</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400">
                      <th className="py-2 px-2.5 font-medium">Dimension</th>
                      {tools.map((t: any, tIdx: number) => (
                        <th key={tIdx} className="py-2 px-2.5 font-bold text-white">
                          {t.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    <tr>
                      <td className="py-2 px-2.5 text-slate-400">Pricing</td>
                      {tools.map((t: any, tIdx: number) => (
                        <td key={tIdx} className="py-2 px-2.5 font-semibold text-emerald-400">
                          {t.pricing || 'Freemium'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 px-2.5 text-slate-400">Category</td>
                      {tools.map((t: any, tIdx: number) => (
                        <td key={tIdx} className="py-2 px-2.5">
                          {t.category || 'AI Tool'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 px-2.5 text-slate-400">Best For</td>
                      {tools.map((t: any, tIdx: number) => (
                        <td key={tIdx} className="py-2 px-2.5 text-white font-medium">
                          {t.bestFor || t.useCase || 'General workflows'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        }

        // Generative UI: Multi-Step Automation Pipeline Stepper
        if (block.type === 'gen-ui-workflow') {
          const wf = block.payload;
          const steps = wf.steps || [];

          return (
            <div
              key={idx}
              className="my-3 p-4 rounded-xl bg-slate-950/80 border border-orange-500/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <WorkflowIcon className="w-4 h-4 text-[#FF7B00]" />
                <h4 className="font-bold text-sm text-white">
                  {wf.title || 'Multi-Tool Automation Pipeline'}
                </h4>
              </div>

              {wf.description && (
                <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                  {wf.description}
                </p>
              )}

              <div className="space-y-2.5 relative">
                {steps.map((st: any, sIdx: number) => {
                  const isPromptCopied = copiedPromptIndex === sIdx;

                  return (
                    <div
                      key={sIdx}
                      className="flex items-start gap-3 p-2.5 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#FF3344] to-[#FF7B00] text-white flex items-center justify-center text-xs font-extrabold flex-shrink-0 shadow-sm shadow-red-500/30">
                        {st.step || sIdx + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-bold text-xs text-white">{st.title}</span>
                          {st.duration && (
                            <span className="text-[10px] text-slate-400 bg-black/40 px-2 py-0.5 rounded border border-white/10 font-mono">
                              {st.duration}
                            </span>
                          )}
                        </div>

                        {st.tool && (
                          <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                            <span className="text-slate-400">Tool:</span>
                            <span className="font-semibold text-[#FF7B00]">{st.tool}</span>
                          </div>
                        )}

                        {st.description && (
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                            {st.description}
                          </p>
                        )}

                        {st.promptTemplate && (
                          <div className="mt-2 p-2 rounded bg-black/40 border border-white/10 text-[11px] font-mono text-amber-300/90 relative group">
                            <div className="flex items-center justify-between text-slate-400 mb-1">
                              <span className="text-[10px] uppercase font-sans font-semibold">Prompt Template:</span>
                              <button
                                type="button"
                                onClick={() => handleCopyPrompt(st.promptTemplate, sIdx)}
                                className="inline-flex items-center gap-1 text-[10px] text-slate-300 hover:text-white"
                              >
                                {isPromptCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                <span>{isPromptCopied ? 'Copied' : 'Copy Prompt'}</span>
                              </button>
                            </div>
                            <div className="leading-relaxed select-all">
                              {st.promptTemplate}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        // Generative UI: Action Suggestion Chips
        if (block.type === 'gen-ui-chips') {
          const chips: string[] = block.payload?.chips || (Array.isArray(block.payload) ? block.payload : []);
          const heading = block.payload?.heading;

          return (
            <div key={idx} className="my-2.5">
              {heading && (
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {heading}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {chips.map((chip, cIdx) => (
                  <button
                    key={cIdx}
                    type="button"
                    onClick={() => onSendPrompt?.(chip)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-slate-200 hover:text-white border border-red-500/30 hover:border-red-500 transition-all shadow-sm"
                  >
                    <span>{chip}</span>
                    <ChevronRight className="w-3 h-3 text-[#FF7B00]" />
                  </button>
                ))}
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

