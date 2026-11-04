import { NextRequest, NextResponse } from 'next/server';
import type { RecommendationResult, RecommendationResponseData } from '@/lib/recommendations';
import { BoundedLruCache } from '@/lib/cache';
import { checkRateLimit, buildRateLimitResponse } from '@/lib/rate-limit';
import { matchTools } from '@/lib/promptMatcher';
import { tools } from '@/data/tools';

export const runtime = 'nodejs';

const FALLBACK_MODEL = 'aura-local-heuristic';

function getAimlServiceUrl(): string {
  let raw = (process.env.AURA_INTELLIGENCE_URL || process.env.AURA_AIML_URL || 'http://127.0.0.1:8000').trim();
  if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
    raw = `http://${raw}`;
  }
  try {
    const parsed = new URL(raw);
    if (!parsed.port && parsed.hostname === 'aura-intelligence') {
      parsed.port = '8000';
      return parsed.toString().replace(/\/$/, '');
    }
  } catch {
    // fallback
  }
  return raw.replace(/\/$/, '');
}

const recommendationCache = new BoundedLruCache<RecommendationResponseData>({ maxSize: 500, defaultTtlMs: 5 * 60 * 1000 });

function normalizeResults(results: unknown): RecommendationResult[] {
  if (!Array.isArray(results)) {
    return [];
  }

  return results.flatMap((item, index) => {
    if (!item || typeof item !== 'object') {
      return [];
    }

    const result = item as Record<string, unknown>;
    const toolId = typeof result.tool_id === 'string' ? result.tool_id : '';
    const name = typeof result.name === 'string' ? result.name : '';

    if (!toolId || !name) {
      return [];
    }

    return [{
      rank: typeof result.rank === 'number' ? result.rank : index + 1,
      tool_id: toolId,
      name,
      category: typeof result.category === 'string' ? result.category : '',
      description: typeof result.description === 'string' ? result.description : '',
      url: typeof result.url === 'string' ? result.url : null,
      pricing: typeof result.pricing === 'string' ? result.pricing : undefined,
      pricingDetails: Array.isArray(result.pricingDetails) ? result.pricingDetails : undefined,
      trustScore: typeof result.trustScore === 'number' ? result.trustScore : undefined,
      users: typeof result.users === 'string' ? result.users : undefined,
      verified: typeof result.verified === 'boolean' ? result.verified : undefined,
      tags: Array.isArray(result.tags) ? (result.tags as string[]) : undefined,
      reason: typeof result.reason === 'string' ? result.reason : '',
      semantic_score: typeof result.semantic_score === 'number' ? result.semantic_score : undefined,
      reranker_score: typeof result.reranker_score === 'number' ? result.reranker_score : undefined,
      ranking_score: typeof result.ranking_score === 'number' ? result.ranking_score : undefined,
    }];
  });
}

async function requestFromWarmService(query: string, topK: number) {
  const serviceUrl = getAimlServiceUrl();
  const response = await fetch(`${serviceUrl}/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, top_k: topK, use_reranker: true }),
    signal: AbortSignal.timeout(8_000), // 8s timeout instead of hanging
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`AIML service returned ${response.status}`);
  }

  return response.json();
}

/**
 * Resilient, sub-millisecond local in-memory fallback.
 * Eliminates dangerous subprocess spawning (spawn('python')) that spikes CPU/RAM and crashes containers.
 */
function runLocalFallbackRecommendation(query: string, topK: number): RecommendationResponseData {
  const matched = matchTools(tools, query, undefined, Math.max(topK, 5));
  const results: RecommendationResult[] = matched.slice(0, topK).map((tool, idx) => ({
    rank: idx + 1,
    tool_id: tool.id,
    name: tool.name,
    category: tool.category,
    description: tool.description,
    url: tool.url,
    pricing: tool.pricing,
    trustScore: tool.trustScore,
    verified: tool.verified,
    tags: tool.tags,
    reason: `Direct keyword & capability match for "${query}" in ${tool.category}.`,
    semantic_score: Math.max(0.7, 1 - idx * 0.05),
  }));

  return {
    query,
    expanded_query: null,
    intents: null,
    results,
    model_version: FALLBACK_MODEL,
    latency_ms: 2,
    num_candidates_considered: tools.length,
  };
}

export async function POST(request: NextRequest) {
  // Apply rate limiting (60 requests per minute per client IP)
  const rateLimit = checkRateLimit(request, { limit: 60, windowMs: 60_000, keyPrefix: 'recommend' });
  if (!rateLimit.success) {
    return buildRateLimitResponse(rateLimit);
  }

  try {
    const body = await request.json();
    const query = typeof body?.query === 'string' ? body.query.trim() : '';
    const topK = Number(body?.top_k || 5);

    if (!query) {
      return NextResponse.json({ results: [], query: '', model_version: FALLBACK_MODEL, latency_ms: 0, num_candidates_considered: 0 }, { status: 400 });
    }

    const cacheKey = `${query.toLowerCase()}::${Math.max(1, Math.min(topK, 10))}`;
    const cached = recommendationCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    try {
      let result;
      try {
        result = await requestFromWarmService(query, topK);
      } catch (err: any) {
        // Safe, non-blocking fallback when FastAPI microservice is offline or warming up
        console.warn(`[AURA Intelligence] FastAPI unavailable (${err.message}). Using resilient local heuristic matcher.`);
        const fallbackResult = runLocalFallbackRecommendation(query, topK);
        recommendationCache.set(cacheKey, fallbackResult);
        return NextResponse.json(fallbackResult);
      }

      const normalizedResult: RecommendationResponseData = {
        query,
        expanded_query: typeof result?.expanded_query === 'string' ? result.expanded_query : null,
        intents: result?.intents && typeof result.intents === 'object' ? result.intents : null,
        results: normalizeResults(result?.results),
        model_version: typeof result?.model_version === 'string' ? result.model_version : 'aura-neural-ranker-v2',
        latency_ms: typeof result?.latency_ms === 'number' ? result.latency_ms : 0,
        num_candidates_considered: typeof result?.num_candidates_considered === 'number' ? result.num_candidates_considered : 0,
      };
      recommendationCache.set(cacheKey, normalizedResult);
      return NextResponse.json(normalizedResult);
    } catch (mlError) {
      console.warn('[AURA ML fallback error]', mlError);
      const fallbackResult = runLocalFallbackRecommendation(query, topK);
      return NextResponse.json(fallbackResult);
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
