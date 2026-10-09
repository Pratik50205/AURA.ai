import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import type { RecommendationResult } from '@/lib/recommendations';

export const runtime = 'nodejs';

const FALLBACK_MODEL = 'fallback';
const AIML_SERVICE_URL = process.env.AURA_INTELLIGENCE_URL || process.env.AURA_AIML_URL || 'http://127.0.0.1:8000';
const recommendationCache = new Map<string, { expiresAt: number; value: unknown }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

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
  const response = await fetch(`${AIML_SERVICE_URL}/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, top_k: topK, use_reranker: true }),
    signal: AbortSignal.timeout(120_000),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`AIML service returned ${response.status}`);
  }

  return response.json();
}

function runPythonRecommendation(query: string, topK: number) {
  return new Promise<any>((resolve, reject) => {
    const cwd = process.cwd();
    const candidatePaths = [
      path.resolve(cwd, 'intelligence'),
      path.resolve(cwd, '..', 'intelligence'),
      path.resolve(cwd, 'aiml'),
      path.resolve(cwd, '..', 'aiml'),
    ];
    const intelligenceRoot = candidatePaths.find((p) => fs.existsSync(p)) || candidatePaths[1];
    const pythonCommand = process.env.PYTHON || process.env.PYTHON_PATH || 'python';

    const script = `
import json
import sys

root = r"${intelligenceRoot.replace(/\\/g, '\\\\')}"
sys.path.insert(0, root)

from src.inference.recommend import recommend_tools

result = recommend_tools(
    query=${JSON.stringify(query)},
    top_k=${Math.max(1, Math.min(topK, 10))},
    use_reranker=True,
)
print(json.dumps(result))
`;

    const child = spawn(/*turbopackIgnore: true*/ pythonCommand, ['-c', script], {
      cwd: intelligenceRoot,
      env: { ...process.env, PYTHONUTF8: '1' },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `Python exited with code ${code}`));
        return;
      }

      try {
        const trimmed = stdout.trim();
        if (!trimmed) {
          resolve({ query, results: [], model_version: 'fallback', latency_ms: 0, num_candidates_considered: 0 });
          return;
        }
        resolve(JSON.parse(trimmed));
      } catch {
        reject(new Error('Unable to parse ML recommendation response.'));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query = typeof body?.query === 'string' ? body.query.trim() : '';
    const topK = Number(body?.top_k || 5);

    if (!query) {
      return NextResponse.json({ results: [], query: '', model_version: FALLBACK_MODEL, latency_ms: 0, num_candidates_considered: 0 }, { status: 400 });
    }

    const cacheKey = `${query.toLowerCase()}::${Math.max(1, Math.min(topK, 10))}`;
    const cached = recommendationCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.value);
    }

    try {
      let result;
      try {
        result = await requestFromWarmService(query, topK);
      } catch {
        // Keep local development functional when the optional warm service is stopped.
        result = await runPythonRecommendation(query, topK);
      }

      const normalizedResult = {
        query,
        expanded_query: typeof result?.expanded_query === 'string' ? result.expanded_query : null,
        intents: result?.intents && typeof result.intents === 'object' ? result.intents : null,
        results: normalizeResults(result?.results),
        model_version: typeof result?.model_version === 'string' ? result.model_version : 'aura-neural-ranker-v2',
        latency_ms: typeof result?.latency_ms === 'number' ? result.latency_ms : 0,
        num_candidates_considered: typeof result?.num_candidates_considered === 'number' ? result.num_candidates_considered : 0,
      };
      recommendationCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, value: normalizedResult });
      return NextResponse.json(normalizedResult);
    } catch (mlError) {
      console.warn('[AURA ML fallback]', mlError);
      return NextResponse.json({
        query,
        expanded_query: query,
        results: [],
        model_version: FALLBACK_MODEL,
        latency_ms: 0,
        num_candidates_considered: 0,
      });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
