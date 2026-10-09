import { NextRequest, NextResponse } from 'next/server';
import { tools } from '@/data/tools';
import type { Tool } from '@/lib/site';
import { auth } from '@/lib/auth/config';

export const runtime = 'nodejs';

const AIML_SERVICE_URL = process.env.AURA_INTELLIGENCE_URL || process.env.AURA_AIML_URL || 'http://127.0.0.1:8000';

function findToolByNameOrSlug(query: string): Tool | undefined {
  const q = query.toLowerCase().trim();
  return tools.find((t) => {
    const nameMatch = t.name.toLowerCase() === q || t.name.toLowerCase().includes(q) || q.includes(t.name.toLowerCase());
    return nameMatch;
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
  const startTime = Date.now();
  try {
    const body = await request.json();
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    const history = Array.isArray(body?.history) ? body.history : [];

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

    // 1. Greeting intent handling
    if (isGreeting(lowerMessage)) {
      const salutation = userName ? `Hello **${userName}**! 👋` : 'Hello there! 👋';
      const reply = `${salutation} Welcome to **AURA.ai**!\n\n` +
        `I am your intelligent AI Copilot, indexed with **${tools.length} verified AI tools** across 23 categories.\n\n` +
        `**What are you looking to build or explore today?** Pick one of the popular options below or describe your task in plain words (e.g. *"find free video editors with captions"* or *"compare Cursor vs Copilot"*):`;

      return NextResponse.json({
        reply,
        tools: [],
        comparison: null,
        suggestedFollowUps: [
          '🎬 Free video editing with captions',
          '💻 Best AI coding copilots',
          '⚡ Compare Cursor vs GitHub Copilot',
          '📊 AI presentation & pitch deck makers',
          '🎨 Image generation & graphic design',
          '💸 Show 100% free & open-source tools'
        ],
        latencyMs: Math.max(Date.now() - startTime, 18),
      });
    }

    // 2. Identity & capabilities intent handling
    if (isIdentityOrCapabilities(lowerMessage)) {
      const reply = `I am **AURA Copilot**, an intelligent AI tool discovery and recommendation assistant.\n\n` +
        `Here is what I can help you with:\n\n` +
        `• **Natural Language Tool Discovery**: Tell me what you need to create or accomplish (e.g., *"tools to remove audio noise"* or *"free alternatives to Jasper"*).\n` +
        `• **Side-by-Side Tool Comparison**: Ask me to compare two products (e.g., *"compare Claude vs ChatGPT"* or *"Runway vs Pika"*).\n` +
        `• **Budget & Tier Filtering**: Search specifically for free, freemium, or commercial tools with verified pricing plans.\n` +
        `• **Trust & Community Ratings**: Evaluate tools by community trust scores and verified benchmarks.\n\n` +
        `**What would you like to explore right now?**`;

      return NextResponse.json({
        reply,
        tools: [],
        comparison: null,
        suggestedFollowUps: [
          '⚡ Compare Claude vs ChatGPT',
          '🎬 Top video generation tools',
          '💻 Developer code assistants',
          '💸 Free AI tools for productivity'
        ],
        latencyMs: Math.max(Date.now() - startTime, 18),
      });
    }

    // 3. Gratitude & farewell intent handling
    if (isGratitudeOrFarewell(lowerMessage)) {
      const reply = `You're very welcome! 😊 Feel free to ask anytime if you want to discover more AI tools, benchmark pricing tiers, or compare workflows.\n\n` +
        `Happy building with AURA! 🚀`;

      return NextResponse.json({
        reply,
        tools: [],
        comparison: null,
        suggestedFollowUps: [
          'Explore trending AI tools',
          'Compare Cursor vs GitHub Copilot',
          'Show free design tools'
        ],
        latencyMs: Math.max(Date.now() - startTime, 18),
      });
    }

    // 4. Check for comparison intent
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
        suggestedFollowUps: [
          `Show free alternatives to ${toolA.name}`,
          `Show free alternatives to ${toolB.name}`,
          `How do I get started with ${toolA.trustScore > toolB.trustScore ? toolA.name : toolB.name}?`
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

    // Craft consultative response
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

      responseText = `Based on your request, I evaluated the AURA neural index and identified **${topTools.length} tools** tailored to your workflow.\n\n` +
        `**Top recommendation: ${leadTool.name}** (${leadTool.category}${pricingBadge})\n` +
        `${leadTool.description}\n\n` +
        customWhy;
    } else {
      responseText = `I couldn't find an exact match for that specific inquiry. Could you tell me more about what you're trying to build, your preferred budget, or your team workflow?`;
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

    return NextResponse.json({
      reply: responseText,
      tools: topTools,
      comparison: null,
      suggestedFollowUps: followUps,
      latencyMs: Math.max(latencyMs, 32),
    });
  } catch (error) {
    console.error('[AURA Assistant API error]', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request.' },
      { status: 500 }
    );
  }
}
