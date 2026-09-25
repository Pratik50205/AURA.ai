import type { Tool } from '@/lib/site';

export type RecommendationResult = {
  rank: number;
  tool_id: string;
  name: string;
  category: string;
  description: string;
  url: string | null;
  reason: string;
  semantic_score?: number;
  reranker_score?: number;
  ranking_score?: number;
};

export function rankToolsByRecommendations(
  catalogue: Tool[],
  recommendations: RecommendationResult[]
): Tool[] {
  const toolsById = new Map(catalogue.map((tool) => [tool.id, tool]));
  const toolsByName = new Map(catalogue.map((tool) => [normalizeName(tool.name), tool]));

  return recommendations
    .sort((first, second) => first.rank - second.rank)
    .map((recommendation) => {
      const existingTool = toolsByName.get(normalizeName(recommendation.name))
        || toolsById.get(recommendation.tool_id);

      return existingTool || buildRecommendationTool(recommendation);
    });
}

function normalizeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function mapCategory(category: string): Tool['category'] {
  const normalizedCategory = category.toLowerCase();

  if (normalizedCategory.includes('image') || normalizedCategory.includes('design')) return 'Design';
  if (normalizedCategory.includes('video')) return 'Video';
  if (normalizedCategory.includes('audio') || normalizedCategory.includes('voice')) return 'Audio';
  if (normalizedCategory.includes('writing')) return 'Writing';
  if (normalizedCategory.includes('developer') || normalizedCategory.includes('code')) return 'Developer';
  if (normalizedCategory.includes('productivity')) return 'Productivity';
  return 'AI Tools';
}

function buildRecommendationTool(recommendation: RecommendationResult): Tool {
  const domain = recommendation.url ? new URL(recommendation.url).hostname : 'aura.ai';

  return {
    id: recommendation.tool_id,
    name: recommendation.name,
    pricing: 'Freemium',
    category: mapCategory(recommendation.category),
    description: recommendation.description || recommendation.reason,
    icon: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    url: recommendation.url || '#',
    trustScore: typeof recommendation.ranking_score === 'number'
      ? Math.min(96, Math.max(75, Math.round(recommendation.ranking_score * 100)))
      : typeof recommendation.semantic_score === 'number'
      ? Math.min(95, Math.max(75, Math.round(recommendation.semantic_score * 100)))
      : 88,
    users: 'Discover',
    tags: recommendation.category ? [recommendation.category] : ['AI Tool'],
    verified: false,
  };
}