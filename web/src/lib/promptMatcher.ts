import type { Tool } from '@/lib/site';

export interface PromptMatch {
  id: string;
  toolId: string;
  toolName: string;
  toolIcon: string;
  toolPricing: string;
  title: string;
  category: string;
  prompt: string;
  description: string;
  score?: number;
}

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'were', 'will', 'with', 'you', 'your', 'this', 'can',
  'we', 'how', 'what', 'please', 'me', 'my', 'i', 'need', 'want'
]);

const PROMPT_ACTION_VERBS = new Set([
  'write', 'generate', 'create', 'build', 'summarize', 'refactor',
  'debug', 'compose', 'design', 'explain', 'analyze', 'draft',
  'scaffold', 'translate', 'review', 'rewrite', 'fix', 'craft',
  'optimize', 'convert', 'extract', 'automate', 'code', 'draw'
]);

/**
 * Checks if the user's input exhibits characteristics of a natural language prompt or task
 */
export function isPromptIntent(query: string): boolean {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return false;
  if (trimmed.length > 25) return true;
  
  const words = trimmed.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const hasActionVerb = words.some(w => PROMPT_ACTION_VERBS.has(w));
  return hasActionVerb || words.length >= 4;
}

/**
 * Extracts tokens from query, filtering out stop words if meaningful tokens exist
 */
export function extractKeywords(query: string): string[] {
  const words = query.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const meaningful = words.filter(w => !STOP_WORDS.has(w) && w.length > 1);
  return meaningful.length > 0 ? meaningful : words;
}

/**
 * Extracts and normalizes all prompt templates from the tool catalogue
 */
export function extractAllPrompts(tools: Tool[]): PromptMatch[] {
  const list: PromptMatch[] = [];
  tools.forEach((t) => {
    if (t.bestPrompts && Array.isArray(t.bestPrompts)) {
      t.bestPrompts.forEach((p, idx) => {
        list.push({
          id: `${t.id}_prompt_${idx}`,
          toolId: t.id,
          toolName: t.name,
          toolIcon: t.icon,
          toolPricing: t.pricing,
          title: p.title || 'Tested Prompt',
          category: p.category || t.category || 'General',
          prompt: p.prompt || '',
          description: p.description || ''
        });
      });
    }
  });
  return list;
}

/**
 * Ranks prompt templates against the user's query or prompt
 */
export function matchPrompts(allPrompts: PromptMatch[], query: string, limit = 6): PromptMatch[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return allPrompts.slice(0, limit);
  }

  const tokens = extractKeywords(q);

  const scored = allPrompts.map((p) => {
    let score = 0;
    const pTitle = p.title.toLowerCase();
    const pPrompt = p.prompt.toLowerCase();
    const pDesc = p.description.toLowerCase();
    const pTool = p.toolName.toLowerCase();
    const pCat = p.category.toLowerCase();

    // Exact substring bonus
    if (pTitle.includes(q)) score += 80;
    if (pPrompt.includes(q)) score += 60;
    if (pDesc.includes(q)) score += 40;

    // Token matches
    tokens.forEach((token) => {
      if (pTitle.includes(token)) score += 25;
      if (pPrompt.includes(token)) score += 18;
      if (pDesc.includes(token)) score += 12;
      if (pTool.includes(token)) score += 15;
      if (pCat.includes(token)) score += 10;
    });

    return { ...p, score };
  });

  return scored
    .filter((item) => (item.score || 0) > 0)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, limit);
}

/**
 * Ranks tools against the user's query or prompt, including inspecting their bestPrompts and useCases
 */
export function matchTools(tools: Tool[], query: string, categoryFilter = 'All', limit = 12): Tool[] {
  const q = query.trim().toLowerCase();
  const categoryActive = categoryFilter !== 'All';

  let candidateTools = tools;
  if (categoryActive) {
    candidateTools = tools.filter(t => t.category.toLowerCase().includes(categoryFilter.toLowerCase()));
  }

  if (!q) {
    return candidateTools.slice(0, limit);
  }

  const tokens = extractKeywords(q);

  const scored = candidateTools.map((t) => {
    let score = 0;
    const name = t.name.toLowerCase();
    const desc = t.description.toLowerCase();
    const cat = t.category.toLowerCase();
    const tags = t.tags.map(tag => tag.toLowerCase());

    // Exact matches
    if (name === q) score += 120;
    else if (name.includes(q)) score += 60;
    if (desc.includes(q)) score += 35;
    if (cat.includes(q)) score += 25;

    // Tag matches
    tags.forEach(tag => {
      if (tag === q) score += 40;
      else if (tag.includes(q)) score += 20;
    });

    // Best Prompts matches
    if (t.bestPrompts) {
      t.bestPrompts.forEach(p => {
        const pText = `${p.title} ${p.prompt} ${p.description || ''}`.toLowerCase();
        if (pText.includes(q)) score += 45;
        tokens.forEach(token => {
          if (pText.includes(token)) score += 12;
        });
      });
    }

    // Use cases matches
    if (t.useCases) {
      t.useCases.forEach(u => {
        const uText = `${u.title} ${u.description}`.toLowerCase();
        if (uText.includes(q)) score += 30;
        tokens.forEach(token => {
          if (uText.includes(token)) score += 10;
        });
      });
    }

    // General token overlap
    tokens.forEach(token => {
      if (name.includes(token)) score += 25;
      if (desc.includes(token)) score += 10;
      if (tags.some(tag => tag.includes(token))) score += 15;
    });

    return { tool: t, score };
  });

  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.tool)
    .slice(0, limit);
}
