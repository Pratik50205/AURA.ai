import type { Tool } from '@/lib/site';

export type RecommendationResult = {
  rank: number;
  tool_id: string;
  name: string;
  category: string;
  description: string;
  url: string | null;
  pricing?: string;
  pricingDetails?: any[];
  trustScore?: number;
  users?: string;
  verified?: boolean;
  tags?: string[];
  reason: string;
  semantic_score?: number;
  reranker_score?: number;
  ranking_score?: number;
};

export type RecommendationResponseData = {
  query: string;
  expanded_query?: string | null;
  intents?: {
    wants_paid?: boolean;
    wants_free?: boolean;
    detected_domains?: string[];
    requested_capabilities?: string[];
    extracted_entities?: string[];
    [key: string]: any;
  } | null;
  results: RecommendationResult[];
  model_version: string;
  latency_ms: number;
  num_candidates_considered: number;
};

export type RankedTool = Tool & {
  recommendationRank?: number;
  recommendationReason?: string;
  rankingScore?: number;
  semanticScore?: number;
};

export function rankToolsByRecommendations(
  catalogue: Tool[],
  recommendations: RecommendationResult[]
): RankedTool[] {
  const toolsById = new Map(catalogue.map((tool) => [tool.id, tool]));
  const toolsByName = new Map(catalogue.map((tool) => [normalizeName(tool.name), tool]));

  return recommendations
    .sort((first, second) => first.rank - second.rank)
    .map((recommendation) => {
      const existingTool = toolsByName.get(normalizeName(recommendation.name))
        || toolsById.get(recommendation.tool_id);

      if (existingTool) {
        return {
          ...existingTool,
          recommendationRank: recommendation.rank,
          recommendationReason: recommendation.reason,
          rankingScore: recommendation.ranking_score,
          semanticScore: recommendation.semantic_score,
        };
      }

      return buildRecommendationTool(recommendation);
    });
}

function normalizeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function buildRecommendationTool(recommendation: RecommendationResult): RankedTool {
  const domain = recommendation.url ? new URL(recommendation.url).hostname : 'aura.ai';

  return {
    id: recommendation.tool_id,
    name: recommendation.name,
    pricing: recommendation.pricing || 'Freemium',
    pricingDetails: recommendation.pricingDetails,
    category: recommendation.category || 'AI Tools',
    description: recommendation.description || recommendation.reason,
    icon: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    url: recommendation.url || '#',
    trustScore: typeof recommendation.trustScore === 'number'
      ? recommendation.trustScore
      : typeof recommendation.ranking_score === 'number'
      ? Math.min(96, Math.max(75, Math.round(recommendation.ranking_score * 100)))
      : typeof recommendation.semantic_score === 'number'
      ? Math.min(95, Math.max(75, Math.round(recommendation.semantic_score * 100)))
      : 88,
    users: recommendation.users || 'Discover',
    tags: Array.isArray(recommendation.tags) && recommendation.tags.length > 0
      ? recommendation.tags
      : (recommendation.category ? [recommendation.category] : ['AI Tool']),
    verified: Boolean(recommendation.verified),
    recommendationRank: recommendation.rank,
    recommendationReason: recommendation.reason,
    rankingScore: recommendation.ranking_score,
    semanticScore: recommendation.semantic_score,
  };
}