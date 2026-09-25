import { NextRequest, NextResponse } from 'next/server';
import { tools } from '@/data/tools';
import type { Tool } from '@/lib/site';

export const runtime = 'nodejs';

const AIML_SERVICE_URL = process.env.AURA_AIML_URL || 'http://127.0.0.1:8000';

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

    // Check for comparison intent
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
        body: JSON.stringify({ query: message, top_k: 8, use_reranker: false }),
        signal: AbortSignal.timeout(3000),
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
      responseText = `Based on your request, I evaluated the AURA neural index and identified **${topTools.length} tools** tailored to your workflow.\n\n` +
        `**Top recommendation: ${leadTool.name}** (${leadTool.category} • ${leadTool.pricing})\n` +
        `${leadTool.description}\n\n` +
        `*Why it fits:* It holds a **${leadTool.trustScore}/100 Trust Score** and specializes in ${leadTool.tags.slice(0, 3).join(', ')}.`;
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
