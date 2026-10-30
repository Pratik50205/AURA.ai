import { NextRequest, NextResponse } from 'next/server';
import { tools } from '@/data/tools';
import type { Tool } from '@/lib/site';
import { auth } from '@/lib/auth/config';
import { BoundedLruCache } from '@/lib/cache';
import { checkRateLimit, buildRateLimitResponse } from '@/lib/rate-limit';
import { 
  processAssistantQuery, 
  isToolRecommendationRequest,
  type AssistantResponse 
} from '@/lib/assistantEngine';
import { 
  resolveBrainConfig, 
  queryLLMBrain, 
  type BrainConfig 
} from '@/lib/llmBrain';

export const runtime = 'nodejs';

const AIML_SERVICE_URL = process.env.AURA_INTELLIGENCE_URL || process.env.AURA_AIML_URL || 'http://127.0.0.1:8000';
const assistantCache = new BoundedLruCache<any>({ maxSize: 300, defaultTtlMs: 3 * 60 * 1000 });

function findToolByNameOrSlug(query: string): Tool | undefined {
  const q = query.toLowerCase().trim();
  return tools.find((t) => {
    return t.name.toLowerCase() === q || t.name.toLowerCase().includes(q) || q.includes(t.name.toLowerCase());
  });
}

function findComparisonTools(text: string): [Tool, Tool] | null {
  const vsRegex = /(?:compare\s+)?([a-zA-Z0-9\s\.\+]+?)\s+(?:vs\.?|versus|and|with)\s+([a-zA-Z0-9\s\.\+]+)/i;
  const match = text.match(vsRegex);
  if (!match) return null;

  const candidateA = match[1].trim();
  const candidateB = match[2].trim();

  const toolA = findToolByNameOrSlug(candidateA);
  const toolB = findToolByNameOrSlug(candidateB);

  if (toolA && toolB && toolA.id !== toolB.id) {
    return [toolA, toolB];
  }
  return null;
}

function isGreeting(text: string): boolean {
  const cleaned = text.toLowerCase().trim().replace(/[!.,?]+$/, '').trim();
  const greetings = new Set([
    'hi', 'hello', 'hey', 'heyy', 'heyyy', 'howdy', 'yo', 'sup',
    'good morning', 'good afternoon', 'good evening', 'greetings',
    'hi there', 'hello there', 'hey there', "what's up", 'whats up',
    'hi aura', 'hello aura', 'hey aura'
  ]);
  return greetings.has(cleaned);
}

function isIdentityOrCapabilities(text: string): boolean {
  const cleaned = text.toLowerCase().trim().replace(/[!.,?]+$/, '').trim();
  const patterns = [
    'who are you', 'what are you', 'what can you do', 'how do you work',
    'what is aura', 'help', 'features', 'what do you do', 'who created you'
  ];
  return patterns.some((p) => cleaned === p || cleaned.includes(p));
}

function isGratitudeOrFarewell(text: string): boolean {
  const cleaned = text.toLowerCase().trim().replace(/[!.,?]+$/, '').trim();
  const patterns = new Set([
    'thanks', 'thank you', 'thx', 'thanks a lot', 'thank you so much',
    'appreciate it', 'bye', 'goodbye', 'cya', 'see ya', 'good night'
  ]);
  return patterns.has(cleaned);
}

export async function POST(request: NextRequest) {
  // Apply rate limiting (40 requests per minute per client IP)
  const rateLimit = checkRateLimit(request, { limit: 40, windowMs: 60_000, keyPrefix: 'assistant' });
  if (!rateLimit.success) {
    return buildRateLimitResponse(rateLimit);
  }

  const startTime = Date.now();
  try {
    const body = await request.json();
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    const history = Array.isArray(body?.history) ? body.history : [];
    const clientBrainConfig = body?.brainConfig;

    if (!message) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    const lowerMessage = message.toLowerCase();

    // Check optional authenticated user name
    let userName: string | null = null;
    try {
      const session = await auth();
      if (session?.user?.name) {
        userName = session.user.name.split(' ')[0];
      } else if (session?.user?.email) {
        userName = session.user.email.split('@')[0];
      }
    } catch {
      // Session extraction optional
    }

    // 1. Resolve Active LLM Brain (Gemini, OpenAI, Groq, Ollama, or Built-in)
    const brainConfig = resolveBrainConfig(clientBrainConfig);

    // For non-personalized queries with no conversation history and default model, check cache
    if (!userName && history.length === 0 && brainConfig.provider === 'builtin') {
      const cached = assistantCache.get(lowerMessage);
      if (cached) {
        return NextResponse.json({ ...cached, latencyMs: 5 });
      }
    }

    // 2. Greeting intent handling (Zero tools recommended)
    if (isGreeting(lowerMessage)) {
      const salutation = userName ? `Hello **${userName}**! 👋` : 'Hello there! 👋';
      const brainLabel = brainConfig.provider === 'builtin' ? 'AURA Neural Engine' : brainConfig.provider.toUpperCase();
      const reply = `${salutation} How can I help you today?\n\n` +
        `I am connected via **${brainLabel}**. Feel free to ask me general knowledge, coding, or mathematical questions, or ask for AI tool recommendations if you have a specific workflow in mind.`;

      return NextResponse.json({
        reply,
        tools: [], // No tools recommended
        comparison: null,
        brainInfo: { provider: brainConfig.provider, model: brainConfig.model },
        suggestedFollowUps: [
          'What is quantum computing?',
          'How do I reverse a string in Python?',
          'Recommend AI tools for video editing',
          'Calculate 15% of 240'
        ],
        latencyMs: Math.max(Date.now() - startTime, 18),
      });
    }

    // 3. Identity & capabilities intent handling (Zero tools recommended)
    if (isIdentityOrCapabilities(lowerMessage)) {
      const reply = `I am **AURA Copilot**, an intelligent AI assistant powered by **${brainConfig.provider === 'builtin' ? 'AURA Neural Engine' : brainConfig.provider.toUpperCase()}**.\n\n` +
        `Here is what I can assist you with:\n\n` +
        `• **Direct Problem Solving**: Ask me technical questions (Python, JavaScript, CSS, SQL, Git), math calculations, scientific concepts, or everyday facts with direct, accurate answers.\n` +
        `• **AI Tool Discovery (When Requested)**: If you need software or tool recommendations, I evaluate 320+ verified tools with neural similarity, pricing tiers, and trust benchmarks.\n` +
        `• **Tool Benchmarking**: Ask to compare specific AI tools side-by-side (e.g., *"compare Cursor vs GitHub Copilot"*).\n\n` +
        `*I answer questions directly without pushing recommendations unless you explicitly ask for tools or apps.*`;

      return NextResponse.json({
        reply,
        tools: [], // No tools recommended
        comparison: null,
        brainInfo: { provider: brainConfig.provider, model: brainConfig.model },
        suggestedFollowUps: [
          'How do I center a div in CSS?',
          'What is photosynthesis?',
          'Compare Cursor vs GitHub Copilot',
          'What are the best free AI video editors?'
        ],
        latencyMs: Math.max(Date.now() - startTime, 18),
      });
    }

    // 4. Gratitude & farewell intent handling (Zero tools recommended)
    if (isGratitudeOrFarewell(lowerMessage)) {
      const reply = `You're very welcome! 😊 Let me know whenever you need assistance with code, calculations, or AI workflows.`;

      return NextResponse.json({
        reply,
        tools: [], // No tools recommended
        comparison: null,
        brainInfo: { provider: brainConfig.provider, model: brainConfig.model },
        suggestedFollowUps: [
          'Ask a technical question',
          'Ask a science question',
          'Find AI tools for a task'
        ],
        latencyMs: Math.max(Date.now() - startTime, 18),
      });
    }

    // ========================================================================
    // 5. If an External LLM Brain (Gemini, Groq, OpenAI, Ollama) is configured:
    // ========================================================================
    const isToolIntent = isToolRecommendationRequest(lowerMessage);

    if (brainConfig.provider !== 'builtin') {
      const llmResult = await queryLLMBrain(message, history, brainConfig);

      if (llmResult && llmResult.reply) {
        // If the user's question was explicitly seeking tools, attach matching tools
        let topTools: Tool[] = [];
        if (isToolIntent) {
          try {
            const mlResponse = await fetch(`${AIML_SERVICE_URL}/recommend`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: message, top_k: 4, use_reranker: true }),
              signal: AbortSignal.timeout(3000),
            });
            if (mlResponse.ok) {
              const data = await mlResponse.json();
              const toolIds = (data.results || []).map((r: any) => r.tool_id);
              topTools = tools.filter(t => toolIds.includes(t.id)).slice(0, 4);
            }
          } catch {
            // fallback
            topTools = tools.slice(0, 3);
          }
        }

        return NextResponse.json({
          reply: llmResult.reply,
          tools: topTools,
          comparison: null,
          brainInfo: { provider: llmResult.provider, model: llmResult.model },
          suggestedFollowUps: isToolIntent 
            ? ['Compare top 2 tools', 'Show free alternatives', 'Best prompts for this'] 
            : ['Tell me more', 'Give an example', 'Explain in detail'],
          latencyMs: llmResult.latencyMs,
        });
      }
      // If external LLM failed, seamlessly falls through to local engine!
    }

    // ========================================================================
    // 6. Built-in Local Engine (Deterministic Math, Science, Code, General QA)
    // ========================================================================
    const assistantResult = await processAssistantQuery(message, userName);

    // If the engine recognized a non-tool intent (Math, Code, Science, General QA, Platform)
    // RETURN DIRECT ACCURATE ANSWER WITH ZERO TOOL RECOMMENDATIONS!
    if (assistantResult.intent !== 'TOOL_RECOMMENDATION') {
      const latencyMs = Math.max(Date.now() - startTime, 18);
      const responseData = {
        reply: assistantResult.reply,
        tools: [], // ZERO tool recommendations!
        comparison: null,
        brainInfo: { provider: 'Built-in Engine', model: 'aura-neural-reasoner' },
        suggestedFollowUps: assistantResult.suggestedFollowUps,
        latencyMs,
      };

      if (!userName && history.length === 0) {
        assistantCache.set(lowerMessage, responseData);
      }
      return NextResponse.json(responseData);
    }

    // ========================================================================
    // 7. Tool Recommendation / Comparison Flow (ONLY when user explicitly requests tools)
    // ========================================================================

    // Check for explicit comparison intent
    const comparisonPair = findComparisonTools(message);
    if (comparisonPair) {
      const [toolA, toolB] = comparisonPair;
      const latencyMs = Date.now() - startTime;

      const summary = `${toolA.name} and ${toolB.name} are both top-tier tools in the ${toolA.category === toolB.category ? toolA.category : 'AI'} space, but they serve slightly different needs.`;
      
      const keyDifferences = [
        `${toolA.name} (${toolA.pricing}) vs ${toolB.name} (${toolB.pricing})`,
        `Trust Score: ${toolA.name} scores ${toolA.trustScore}/100, while ${toolB.name} scores ${toolB.trustScore}/100 based on verified community benchmarks.`,
        `Primary Strength: ${toolA.name} excels at ${toolA.keyFeatures?.[0] || toolA.category.toLowerCase()}, whereas ${toolB.name} is known for ${toolB.keyFeatures?.[0] || toolB.category.toLowerCase()}.`
      ];

      return NextResponse.json({
        reply: `Here is a side-by-side comparison between **${toolA.name}** and **${toolB.name}**:\n\n` +
          `• **${toolA.name}**: ${toolA.description}\n` +
          `• **${toolB.name}**: ${toolB.description}\n\n` +
          `**Verdict:** If you prioritize ${toolA.keyFeatures?.[0] || 'rapid workflows'}, choose **${toolA.name}**. If you need ${toolB.keyFeatures?.[0] || 'advanced flexibility'}, go with **${toolB.name}**.`,
        tools: [toolA, toolB],
        comparison: {
          toolA,
          toolB,
          summary,
          keyDifferences,
          winnerFor: {
            "Best for Budget": toolA.pricing.toLowerCase().includes('free') ? toolA.name : toolB.name,
            "Highest Trust Score": toolA.trustScore >= toolB.trustScore ? toolA.name : toolB.name,
            "Wider Adoption": toolA.users || toolB.users ? (toolA.trustScore > toolB.trustScore ? toolA.name : toolB.name) : toolA.name,
          }
        },
        brainInfo: { provider: 'Built-in Engine', model: 'aura-compare-matrix' },
        suggestedFollowUps: [
          `Show free alternatives to ${toolA.name}`,
          `Show free alternatives to ${toolB.name}`,
          `What are the best prompts for ${toolA.name}?`
        ],
        latencyMs: Math.max(latencyMs, 25),
      });
    }

    // Query warm ML backend for semantic recommendations
    let mlResults: any[] = [];
    try {
      const mlResponse = await fetch(`${AIML_SERVICE_URL}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: message, top_k: 8, use_reranker: true }),
        signal: AbortSignal.timeout(5000),
      });

      if (mlResponse.ok) {
        const data = await mlResponse.json();
        mlResults = data.results || [];
      }
    } catch {
      // Fallback: local keyword & tag match if ML service is unreachable
      console.warn('[AURA Assistant] ML service unreachable, using local fallback');
    }

    // Map ML results to full tool objects from catalog
    let matchedTools: Tool[] = [];
    if (mlResults.length > 0) {
      for (const res of mlResults) {
        const found = tools.find((t) => t.id === res.tool_id || t.name.toLowerCase() === res.name.toLowerCase());
        if (found && !matchedTools.some((t) => t.id === found.id)) {
          matchedTools.push(found);
        }
      }
    }

    // If ML didn't find enough or wasn't reachable, search tools directly
    if (matchedTools.length < 3) {
      const searchTerms: string[] = lowerMessage.split(/\s+/).filter((w: string) => w.length > 2);
      const fallbackTools = tools.filter((tool) => {
        const combined = `${tool.name} ${tool.category} ${tool.description} ${tool.tags.join(' ')}`.toLowerCase();
        return searchTerms.some((term: string) => combined.includes(term));
      });
      for (const t of fallbackTools) {
        if (!matchedTools.some((m) => m.id === t.id)) {
          matchedTools.push(t);
        }
      }
    }

    // Filter by free if requested
    const wantsFree = lowerMessage.includes('free') || lowerMessage.includes('$0') || lowerMessage.includes('no cost');
    const wantsPaid = lowerMessage.includes('pay') || lowerMessage.includes('paid') || lowerMessage.includes('subscription') || lowerMessage.includes('subscribe') || lowerMessage.includes('budget');

    if (wantsFree) {
      const freeTools = matchedTools.filter((t) => t.pricing.toLowerCase().includes('free'));
      if (freeTools.length > 0) {
        matchedTools = freeTools;
      }
    }

    const topTools = matchedTools.slice(0, 4);
    const latencyMs = Date.now() - startTime;

    // Craft consultative response ONLY when tools are genuinely sought
    let responseText = '';
    if (topTools.length > 0) {
      const leadTool = topTools[0];
      const popularPlan = leadTool.pricingDetails?.find(p => p.isPopular) || leadTool.pricingDetails?.find(p => p.price && !p.price.includes('$0')) || leadTool.pricingDetails?.[0];
      const pricingBadge = popularPlan ? ` • ${popularPlan.plan}: ${popularPlan.price}` : ` • ${leadTool.pricing}`;

      const leadMlMatch = mlResults.find((r) => r.tool_id === leadTool.id || r.name?.toLowerCase() === leadTool.name.toLowerCase());
      let customWhy = leadMlMatch?.reason
        ? `*Why AURA recommends this:* ${leadMlMatch.reason}`
        : `*Why it fits:* It holds a **${leadTool.trustScore}/100 Trust Score** and specializes in ${leadTool.tags.slice(0, 3).join(', ')}.`;

      if (!leadMlMatch?.reason && wantsPaid && popularPlan) {
        customWhy = `*Why it fits your subscription budget:* Its **${popularPlan.plan} tier (${popularPlan.price})** provides ${popularPlan.features?.slice(0, 2).join(', ') || 'full professional access'}.`;
      }

      responseText = `Based on your tool discovery request, here are **${topTools.length} AI utilities** evaluated from the AURA catalog:\n\n` +
        `**Top Recommendation: ${leadTool.name}** (${leadTool.category}${pricingBadge})\n` +
        `${leadTool.description}\n\n` +
        customWhy;
    } else {
      responseText = `I couldn't find an exact AI tool matching that specific workflow request. Could you clarify what format you want to produce (e.g. video, code, audio, 3D) or your required features?`;
    }

    // Dynamic follow-ups
    const followUps: string[] = [];
    if (topTools.length >= 2) {
      followUps.push(`Compare ${topTools[0].name} vs ${topTools[1].name}`);
    }
    if (!wantsFree) {
      followUps.push(`Show only 100% free options`);
    } else {
      followUps.push(`Show premium tools with more advanced features`);
    }
    followUps.push(`What are the best prompts for ${topTools[0]?.name || 'these tools'}?`);

    const responseData = {
      reply: responseText,
      tools: topTools,
      comparison: null,
      brainInfo: { provider: 'Built-in Engine', model: 'aura-neural-ranker-v2' },
      suggestedFollowUps: followUps,
      latencyMs: Math.max(latencyMs, 32),
    };

    if (!userName && history.length === 0) {
      assistantCache.set(lowerMessage, responseData);
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('[AURA Assistant API error]', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request.' },
      { status: 500 }
    );
  }
}
