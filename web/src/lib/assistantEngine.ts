import { tools } from '@/data/tools';
import type { Tool } from '@/lib/site';
import type { AuraClassification } from '@/lib/auraDomainClassifier';

export interface WorkflowStep {
  stepNumber: number;
  phase: string;
  tool: Tool;
  task: string;
  promptTip?: string;
}

export interface WorkflowPlan {
  title: string;
  useCase: string;
  estimatedCost: string;
  steps: WorkflowStep[];
  synergyExplanation: string;
}

export interface ToolComparisonMatrix {
  toolA: Tool;
  toolB: Tool;
  summary: string;
  keyDifferences: string[];
  winnerFor: { [criterion: string]: string };
}

export function findToolByNameOrSlug(query: string): Tool | undefined {
  const q = query.toLowerCase().trim();
  if (!q) return undefined;

  // Exact name or id match
  const exact = tools.find((t) => t.name.toLowerCase() === q || t.id.toLowerCase() === q);
  if (exact) return exact;

  // Word boundary match
  return tools.find((t) => {
    const tName = t.name.toLowerCase();
    return tName.includes(q) || q.includes(tName);
  });
}

export function findComparisonTools(text: string, entities: string[] = []): [Tool, Tool] | null {
  // If entities contain 2 or more tools
  if (entities.length >= 2) {
    const tA = findToolByNameOrSlug(entities[0]);
    const tB = findToolByNameOrSlug(entities[1]);
    if (tA && tB && tA.id !== tB.id) {
      return [tA, tB];
    }
  }

  // Regex patterns: "compare X vs Y", "X versus Y", "X or Y"
  const patterns = [
    /(?:compare\s+)?([a-zA-Z0-9\s\.\+]+?)\s+(?:vs\.?|versus)\s+([a-zA-Z0-9\s\.\+]+)/i,
    /(?:compare\s+)([a-zA-Z0-9\s\.\+]+?)\s+(?:and|with)\s+([a-zA-Z0-9\s\.\+]+)/i,
    /(?:which\s+is\s+better\s+)?([a-zA-Z0-9\s\.\+]+?)\s+(?:or)\s+([a-zA-Z0-9\s\.\+]+)/i,
  ];

  for (const regex of patterns) {
    const match = text.match(regex);
    if (match) {
      const candidateA = match[1].trim();
      const candidateB = match[2].trim();
      const toolA = findToolByNameOrSlug(candidateA);
      const toolB = findToolByNameOrSlug(candidateB);

      if (toolA && toolB && toolA.id !== toolB.id) {
        return [toolA, toolB];
      }
    }
  }

  return null;
}

/**
 * Builds a verified side-by-side comparison matrix for two catalog tools.
 */
export function buildComparisonMatrix(toolA: Tool, toolB: Tool): ToolComparisonMatrix {
  const sameCategory = toolA.category.toLowerCase() === toolB.category.toLowerCase();
  const summary = `${toolA.name} and ${toolB.name} are both verified tools in the ${
    sameCategory ? toolA.category : 'AI ecosystem'
  }, evaluated with AURA trust benchmarks.`;

  const keyDifferences: string[] = [
    `Pricing: ${toolA.name} is ${toolA.pricing} vs ${toolB.name} which is ${toolB.pricing}.`,
    `Trust Benchmark: ${toolA.name} scores ${toolA.trustScore}/100; ${toolB.name} scores ${toolB.trustScore}/100.`,
    `Core Focus: ${toolA.name} emphasizes ${toolA.keyFeatures?.[0] || toolA.description.slice(0, 60)}, while ${
      toolB.name
    } focuses on ${toolB.keyFeatures?.[0] || toolB.description.slice(0, 60)}.`,
  ];

  const winnerFor: { [criterion: string]: string } = {};

  // Budget comparison
  const aIsFree = toolA.pricing.toLowerCase().includes('free');
  const bIsFree = toolB.pricing.toLowerCase().includes('free');
  if (aIsFree && !bIsFree) winnerFor['Best for Budget'] = toolA.name;
  else if (bIsFree && !aIsFree) winnerFor['Best for Budget'] = toolB.name;
  else winnerFor['Best for Budget'] = toolA.trustScore >= toolB.trustScore ? toolA.name : toolB.name;

  // Trust score comparison
  winnerFor['Highest Trust Score'] = toolA.trustScore >= toolB.trustScore ? toolA.name : toolB.name;

  // Adoption comparison
  const aVerified = toolA.verified;
  const bVerified = toolB.verified;
  if (aVerified && !bVerified) winnerFor['Verified Status'] = toolA.name;
  else if (bVerified && !aVerified) winnerFor['Verified Status'] = toolB.name;
  else winnerFor['Verified Status'] = toolA.trustScore >= toolB.trustScore ? toolA.name : toolB.name;

  return {
    toolA,
    toolB,
    summary,
    keyDifferences,
    winnerFor,
  };
}

/**
 * Constructs a structured multi-tool workflow pipeline for a given objective.
 */
export function buildWorkflowPlan(
  objective: string,
  classification: AuraClassification
): WorkflowPlan {
  const lower = objective.toLowerCase();
  const constraints = classification.constraints;
  const steps: WorkflowStep[] = [];

  // Helper to find tool by category/tag preference
  const findBestIn = (catKeywords: string[], fallbackId: string, filterFree = false): Tool => {
    let pool = tools.filter((t) =>
      catKeywords.some(
        (kw) => t.category.toLowerCase().includes(kw) || t.tags.some((tag) => tag.toLowerCase().includes(kw))
      )
    );
    if (filterFree) {
      const freePool = pool.filter((t) => t.pricing.toLowerCase().includes('free'));
      if (freePool.length > 0) pool = freePool;
    }
    pool.sort((a, b) => b.trustScore - a.trustScore);
    return pool[0] || tools.find((t) => t.id === fallbackId) || tools[0];
  };

  const wantsFree = constraints.budget === 'free' || constraints.budget === 'opensource';

  // Determine Workflow Type
  if (lower.includes('video') || lower.includes('youtube') || lower.includes('clip')) {
    // 1. Video Workflow
    const scriptTool = findBestIn(['chat', 'writing'], 't1', wantsFree); // ChatGPT or Claude
    const voiceTool = findBestIn(['audio', 'voice'], 't8', wantsFree); // ElevenLabs or Murf
    const videoTool = findBestIn(['video generation', 'video edit'], 't6', wantsFree); // Runway or CapCut
    const captionTool = findBestIn(['transcription', 'caption'], 't12', wantsFree); // Descript

    steps.push({
      stepNumber: 1,
      phase: 'Script & Concept',
      tool: scriptTool,
      task: 'Generate structured script, timestamped hook, and scene outline.',
      promptTip: 'Draft a 60-second video script with a compelling 3-second visual hook and clear call-to-action.',
    });
    steps.push({
      stepNumber: 2,
      phase: 'Voiceover & Audio',
      tool: voiceTool,
      task: 'Synthesize professional neural voiceover from the approved script.',
      promptTip: 'Use a dynamic, natural narration tone with calibrated pacing.',
    });
    steps.push({
      stepNumber: 3,
      phase: 'Video Generation & Editing',
      tool: videoTool,
      task: 'Assemble visuals, generate B-roll clips, and synchronize audio timeline.',
    });
    steps.push({
      stepNumber: 4,
      phase: 'Subtitles & Final Polish',
      tool: captionTool,
      task: 'Generate synchronized animated captions, remove filler words, and export.',
    });

    return {
      title: 'AI Video Creation & Automation Pipeline',
      useCase: 'End-to-end automated video production from ideation to delivery',
      estimatedCost: wantsFree ? 'Free tier eligible' : 'Freemium / Pro subscription',
      steps,
      synergyExplanation: `This pipeline pairs **${scriptTool.name}** for narrative structure with **${voiceTool.name}** for human-like audio, synthesized visually in **${videoTool.name}** and finalized with auto-captions in **${captionTool.name}**.`,
    };
  }

  if (lower.includes('social media') || lower.includes('content') || lower.includes('marketing')) {
    // 2. Social Media Content Workflow
    const copyTool = findBestIn(['writing', 'copywriting', 'chat'], 't1', wantsFree);
    const visualTool = findBestIn(['image generation', 'design'], 't5', wantsFree);
    const repurposeTool = findBestIn(['productivity', 'transcription'], 't12', wantsFree);

    steps.push({
      stepNumber: 1,
      phase: 'Content Ideation & Copywriting',
      tool: copyTool,
      task: 'Generate weekly content calendar, post captions, and hashtag strategies.',
      promptTip: 'Generate 5 high-engagement LinkedIn & Twitter posts summarizing [TOPIC] with clear takeaways.',
    });
    steps.push({
      stepNumber: 2,
      phase: 'Visual Asset Creation',
      tool: visualTool,
      task: 'Create branded social graphics, thumbnails, and carousel slides.',
    });
    steps.push({
      stepNumber: 3,
      phase: 'Repurposing & Scheduling',
      tool: repurposeTool,
      task: 'Extract short highlights, transcribe audio snippets, and format for multi-channel publishing.',
    });

    return {
      title: 'Automated Social Media & Content Pipeline',
      useCase: 'Multi-channel social media asset generation and copywriting',
      estimatedCost: wantsFree ? 'Free tier eligible' : 'Freemium',
      steps,
      synergyExplanation: `Combines **${copyTool.name}** for persuasive copy with **${visualTool.name}** for high-conversion graphics and **${repurposeTool.name}** for content repurposing.`,
    };
  }

  if (lower.includes('code') || lower.includes('website') || lower.includes('software') || lower.includes('developer')) {
    // 3. Coding & Website Building Workflow
    const scaffoldTool = findBestIn(['code assistant', 'development'], 't7', wantsFree); // Cursor or GitHub Copilot
    const uiTool = findBestIn(['code', 'ui', 'productivity'], 't9', wantsFree); // v0 or Bolt
    const testTool = findBestIn(['chat', 'code'], 't2', wantsFree); // Claude

    steps.push({
      stepNumber: 1,
      phase: 'UI Component Scaffolding',
      tool: uiTool,
      task: 'Generate responsive React components and Tailwind layouts from text prompts.',
    });
    steps.push({
      stepNumber: 2,
      phase: 'Full-Stack Implementation',
      tool: scaffoldTool,
      task: 'Integrate API endpoints, manage state, and refine application logic in your IDE.',
    });
    steps.push({
      stepNumber: 3,
      phase: 'Code Review & Security Audit',
      tool: testTool,
      task: 'Analyze code for edge cases, performance bottlenecks, and unit test coverage.',
      promptTip: 'Perform a security audit on this code snippet, highlighting potential vulnerabilities and proposing fixes.',
    });

    return {
      title: 'Modern AI-Assisted Full-Stack Development Pipeline',
      useCase: 'Rapid application development from UI prototype to production code',
      estimatedCost: wantsFree ? 'Free tier eligible' : 'Freemium',
      steps,
      synergyExplanation: `Leverages **${uiTool.name}** for zero-latency component prototyping, integrated directly via **${scaffoldTool.name}** for full codebase development, and verified by **${testTool.name}**.`,
    };
  }

  // 4. General Productivity / Research Workflow
  const researchTool = findBestIn(['search', 'research'], 't4', wantsFree); // Perplexity
  const synthesisTool = findBestIn(['chat', 'writing'], 't2', wantsFree); // Claude
  const deckTool = findBestIn(['presentation', 'productivity'], 't10', wantsFree); // Gamma

  steps.push({
    stepNumber: 1,
    phase: 'Discovery & Fact Retrieval',
    tool: researchTool,
    task: 'Gather citations, competitive research, and verified benchmark data.',
  });
  steps.push({
    stepNumber: 2,
    phase: 'Synthesis & Document Drafting',
    tool: synthesisTool,
    task: 'Synthesize research data into structured briefing notes or strategy reports.',
  });
  steps.push({
    stepNumber: 3,
    phase: 'Executive Presentation',
    tool: deckTool,
    task: 'Convert briefing document into an interactive, visually formatted slide deck.',
  });

  return {
    title: 'Executive AI Research & Presentation Pipeline',
    useCase: 'Converting complex market data into executive presentations',
    estimatedCost: wantsFree ? 'Free tier eligible' : 'Freemium',
    steps,
    synergyExplanation: `Uses **${researchTool.name}** for cited web retrieval, synthesized in **${synthesisTool.name}**, and transformed into visual slide decks with **${deckTool.name}**.`,
  };
}

/**
 * Finds alternatives to a target tool based on catalog alternatives, category, and trust scores.
 */
export function findToolAlternatives(
  tool: Tool,
  constraints?: AuraClassification['constraints']
): Tool[] {
  const results: Tool[] = [];

  // 1. Check explicit tool.alternatives (array of tool IDs)
  if (tool.alternatives && Array.isArray(tool.alternatives)) {
    for (const altId of tool.alternatives) {
      const match = tools.find((t) => t.id === altId || t.name.toLowerCase() === altId.toLowerCase());
      if (match && match.id !== tool.id && !results.some((r) => r.id === match.id)) {
        results.push(match);
      }
    }
  }

  // 2. If not enough explicit alternatives, find top tools in the same category
  if (results.length < 3) {
    const categoryPeers = tools.filter(
      (t) => t.id !== tool.id && t.category.toLowerCase() === tool.category.toLowerCase()
    );
    categoryPeers.sort((a, b) => b.trustScore - a.trustScore);
    for (const peer of categoryPeers) {
      if (!results.some((r) => r.id === peer.id)) {
        results.push(peer);
      }
      if (results.length >= 4) break;
    }
  }

  // Apply budget filter if requested
  if (constraints?.budget === 'free') {
    const freeOnly = results.filter((t) => t.pricing.toLowerCase().includes('free'));
    if (freeOnly.length > 0) return freeOnly;
  }

  return results.slice(0, 4);
}

/**
 * Safe catalog search fallback when ML recommendation service is unreachable.
 * NEVER returns arbitrary tools or tools.slice(0, 3).
 * Returns empty array if no tool satisfies the functional criteria.
 */
export function searchCatalogFallback(
  query: string,
  constraints?: AuraClassification['constraints']
): Tool[] {
  const qLower = query.toLowerCase();
  const searchTerms = qLower.split(/\s+/).filter((w) => w.length > 2);

  const matched = tools.filter((tool) => {
    // 1. Category match
    const catMatch = tool.category.toLowerCase().includes(qLower);

    // 2. Keyword/tag match
    const toolText = `${tool.name} ${tool.category} ${tool.description} ${tool.tags.join(' ')} ${tool.keyFeatures?.join(' ') || ''}`.toLowerCase();
    const termMatches = searchTerms.filter((term) => toolText.includes(term)).length;

    // Must match at least 2 search terms or have strong single term match on name/tag
    const isNameMatch = tool.name.toLowerCase().includes(qLower);
    const hasSufficientOverlap = termMatches >= Math.min(2, searchTerms.length) || isNameMatch || catMatch;

    if (!hasSufficientOverlap) return false;

    // Apply budget constraint strictly
    if (constraints?.budget === 'free' && !tool.pricing.toLowerCase().includes('free')) {
      return false;
    }
    if (constraints?.budget === 'opensource' && !tool.tags.some((t) => t.toLowerCase().includes('open-source') || t.toLowerCase().includes('open source'))) {
      return false;
    }

    return true;
  });

  // Sort by trust score descending
  matched.sort((a, b) => b.trustScore - a.trustScore);

  return matched.slice(0, 4);
}
