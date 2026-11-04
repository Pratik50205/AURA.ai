import { tools } from '@/data/tools';

export type AuraIntent =
  | 'TOOL_DISCOVERY'
  | 'TOOL_COMPARISON'
  | 'WORKFLOW_DESIGN'
  | 'PROMPT_ENGINEERING'
  | 'TOOL_ALTERNATIVES'
  | 'TOOL_EVALUATION'
  | 'AI_TOOL_GUIDANCE'
  | 'OUT_OF_SCOPE'
  | 'CLARIFICATION_REQUIRED';

export interface AuraClassification {
  intent: AuraIntent;
  confidence: number;
  inScope: boolean;
  entities: string[];
  constraints: {
    budget?: 'free' | 'paid' | 'freemium' | 'opensource';
    platform?: 'web' | 'mac' | 'windows' | 'linux' | 'local' | 'api';
    useCase?: string;
    features?: string[];
  };
  clarificationNeeded: boolean;
  clarificationQuestion?: string;
  reasoning?: string;
}

export interface ConversationHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClassificationContext {
  history?: ConversationHistoryItem[];
  previousToolNames?: string[];
  activeUseCase?: string;
  activeIntent?: AuraIntent;
}

// Pre-indexed set of known tool names from the catalog + aliases for rapid matching
const CATALOG_TOOL_NAMES: Map<string, string> = new Map();
for (const tool of tools) {
  CATALOG_TOOL_NAMES.set(tool.name.toLowerCase(), tool.name);
  CATALOG_TOOL_NAMES.set(tool.id.toLowerCase(), tool.name);
}

// Additional notable AI utilities and foundational models to recognize as entities
const ADDITIONAL_AI_ENTITIES: Record<string, string> = {
  chatgpt: 'ChatGPT',
  'chatgpt plus': 'ChatGPT Plus',
  'gpt-4': 'GPT-4',
  'gpt-4o': 'GPT-4o',
  claude: 'Claude',
  'claude 3': 'Claude',
  'claude 3.5': 'Claude',
  'claude 3.5 sonnet': 'Claude',
  gemini: 'Google Gemini',
  'google gemini': 'Google Gemini',
  midjourney: 'Midjourney',
  'midjourney v6': 'Midjourney',
  'dall-e': 'DALL-E',
  dalle: 'DALL-E',
  'stable diffusion': 'Stable Diffusion',
  flux: 'FLUX',
  copilot: 'GitHub Copilot',
  'github copilot': 'GitHub Copilot',
  cursor: 'Cursor',
  v0: 'v0 by Vercel',
  'v0 by vercel': 'v0 by Vercel',
  bolt: 'Bolt.new',
  'bolt.new': 'Bolt.new',
  runway: 'Runway',
  'runway gen-3': 'Runway',
  pika: 'Pika',
  kling: 'Kling AI',
  sora: 'Sora',
  elevenlabs: 'ElevenLabs',
  suno: 'Suno',
  'suno ai': 'Suno',
  udio: 'Udio',
  perplexity: 'Perplexity AI',
  'perplexity ai': 'Perplexity AI',
  'perplexity pro': 'Perplexity AI',
  'notion ai': 'Notion AI',
  descript: 'Descript',
  gamma: 'Gamma',
  'beautiful.ai': 'Beautiful.ai',
  jasper: 'Jasper',
  'copy.ai': 'Copy.ai',
  canva: 'Canva AI',
  'canva ai': 'Canva AI',
  photoroom: 'Photoroom',
  'remove.bg': 'Remove.bg',
  ollama: 'Ollama',
  'lm studio': 'LM Studio',
  capcut: 'CapCut',
  'fireflies.ai': 'Fireflies.ai',
  'otter.ai': 'Otter.ai',
  synthesia: 'Synthesia',
  heygen: 'HeyGen',
};

for (const [alias, canonical] of Object.entries(ADDITIONAL_AI_ENTITIES)) {
  if (!CATALOG_TOOL_NAMES.has(alias)) {
    CATALOG_TOOL_NAMES.set(alias, canonical);
  }
}

// Regex patterns strictly out of scope (general education, raw math, general non-AI topics)
const OUT_OF_SCOPE_PATTERNS: RegExp[] = [
  // Raw arithmetic / Math equations (e.g. "what is 25 * 14", "solve 50 + 20", "sqrt(144)")
  /^\s*(?:what\s+is|solve|calculate|evaluate)?\s*\(?-?\d+(?:\.\d+)?\s*[\+\-\*\/x×÷\^]\s*-?\d+(?:\.\d+)?(?:\s*[\+\-\*\/x×÷\^]\s*-?\d+(?:\.\d+)?)?\s*\??\s*$/i,
  /^\s*(?:what\s+is\s+|calculate\s+)?\d+(?:\.\d+)?\s*%\s*of\s*\d+(?:\.\d+)?\s*\??\s*$/i,
  /^\s*(?:convert\s+)?-?\d+(?:\.\d+)?\s*(?:°|degrees?\s*)?[cf]\s*(?:to|in)\s*(?:°|degrees?\s*)?[cf]\s*\??\s*$/i,
  /^\s*(?:square\s+root\s+of|sqrt\()\s*\d+(?:\.\d+)?\)?\s*\??\s*$/i,
  /\b\d+\s*(?:multiplied\s+by|divided\s+by|times|plus|minus)\s*\d+\b/i,

  // General science / biology / physics / chemistry trivia without AI tool context
  /^(?:what\s+is|explain)\s+(?:photosynthesis|mitosis|osmosis|gravity|newton'?s\s+(?:third\s+)?laws?|quantum\s+physics|thermodynamics|relativity|evolution|dna|cellular\s+respiration)\b(?!\s+(?:tool|app|software|platform|model))/i,
  /\bhow\s+do\s+plants\s+(?:make\s+food|convert\s+sunlight)\b/i,
  /\bnewton'?s\s+(?:first|second|third|laws?)\b/i,

  // Geography / world history / trivia
  /^(?:what\s+is|who\s+is|where\s+is)\s+the\s+(?:capital|president|population|currency|founder)\s+of\b/i,
  /\bwho\s+(?:discovered\s+america|invented\s+the\s+telephone|built\s+the\s+pyramids|won\s+the\s+world\s+cup)\b/i,

  // General programming tutorials / homework (teaching syntax rather than recommending AI tools)
  /^(?:teach\s+me|how\s+to\s+code\s+in|how\s+to\s+program\s+in)\s+(?:python|javascript|java|c\+\+|rust|html|css|golang)\b(?!\s+(?:tool|app|software))/i,
  /^(?:teach\s+me)\s+(?:python|javascript|coding|programming)\s+(?:from\s+scratch|basics?|syntax|loops?|functions?)\b/i,
  /^(?:how\s+to|write\s+code\s+to|write\s+a\s+python\s+script\s+to)\s+reverse\s+(?:a\s+)?string\b/i,
  /^(?:how\s+to|how\s+do\s+i)\s+center\s+(?:a\s+)?div\s+in\s+css\b/i,

  // Entertainment / creative writing / poetry / jokes / general essays
  /^(?:tell\s+me\s+a\s+joke|tell\s+me\s+a\s+funny\s+knock\s+knock\s+joke|make\s+me\s+laugh)\b/i,
  /^(?:write|compose)\s+(?:me\s+)?(?:an?\s+)?(?:birthday\s+poem|love\s+letter|bedtime\s+story|song\s+lyrics|rap|fiction|essay)\b(?!\s+(?:tool|app|software))/i,

  // General non-AI queries (cooking, health, travel, finance advice)
  /^(?:recipe\s+for|how\s+to\s+cook|how\s+to\s+bake)\b/i,
  /^(?:what\s+are\s+the\s+symptoms\s+of|how\s+to\s+cure)\b/i,
  /^(?:book\s+a\s+flight|hotels\s+in|weather\s+in|horoscope\s+for)\b/i,

  // Abstract academic definition questions without tool context
  /^(?:what\s+is|define)\s+(?:machine\s+learning|deep\s+learning|artificial\s+intelligence|neural\s+network|rag|reinforcement\s+learning)\??$/i,
];

// Helper: Check if query contains explicit AI tool indicators
const AI_TOOL_INDICATORS = [
  'tool', 'tools', 'app', 'apps', 'software', 'platform', 'platforms',
  'service', 'utility', 'utilities', 'solution', 'stack', 'extension',
  'alternative', 'alternatives', 'competitor', 'competitors',
  'compare', 'comparison', 'versus',
  'workflow', 'pipeline', 'automation',
  'prompt', 'prompts',
  'recommend', 'recommendation', 'recommendations', 'suggest', 'suggestion',
  'catalog', 'directory', 'discovery', 'find', 'best',
  'which ai', 'which tool', 'which app', 'what ai', 'free ai',
  'pricing', 'cost', 'plan', 'trust score'
];

/**
 * Extracts recognized AI tool names and entities from text.
 */
export function extractEntities(text: string): string[] {
  const normalized = text.toLowerCase();
  const matched = new Set<string>();

  // Check known tool names (longest match first to avoid partials)
  const sortedNames = Array.from(CATALOG_TOOL_NAMES.keys()).sort((a, b) => b.length - a.length);

  for (const name of sortedNames) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
    if (regex.test(normalized)) {
      const canonical = CATALOG_TOOL_NAMES.get(name) || name;
      matched.add(canonical);
    }
  }

  return Array.from(matched);
}

/**
 * Extracts explicit user constraints such as budget, platform, and use case.
 */
export function extractConstraints(text: string): AuraClassification['constraints'] {
  const lower = text.toLowerCase();
  const constraints: AuraClassification['constraints'] = {};

  // Budget constraints
  if (
    lower.includes('open source') ||
    lower.includes('opensource') ||
    lower.includes('self-hosted') ||
    lower.includes('self hosted')
  ) {
    constraints.budget = 'opensource';
  } else if (
    lower.includes('free') ||
    lower.includes('$0') ||
    lower.includes('no cost') ||
    lower.includes('without paying') ||
    lower.includes('no credit card') ||
    lower.includes('gratis')
  ) {
    constraints.budget = 'free';
  } else if (
    lower.includes('paid') ||
    lower.includes('subscription') ||
    lower.includes('premium') ||
    lower.includes('enterprise') ||
    lower.includes('commercial license') ||
    lower.includes('pro plan')
  ) {
    constraints.budget = 'paid';
  } else if (lower.includes('freemium')) {
    constraints.budget = 'freemium';
  }

  // Platform constraints
  if (lower.includes('mac') || lower.includes('macos') || lower.includes('apple silicon')) {
    constraints.platform = 'mac';
  } else if (lower.includes('windows') || lower.includes('pc')) {
    constraints.platform = 'windows';
  } else if (lower.includes('linux') || lower.includes('ubuntu')) {
    constraints.platform = 'linux';
  } else if (
    lower.includes('local') ||
    lower.includes('offline') ||
    lower.includes('on-device') ||
    lower.includes('on device') ||
    lower.includes('run locally')
  ) {
    constraints.platform = 'local';
  } else if (lower.includes('api') || lower.includes('sdk')) {
    constraints.platform = 'api';
  } else if (lower.includes('web') || lower.includes('browser') || lower.includes('online')) {
    constraints.platform = 'web';
  }

  // Common use case extraction
  const useCasePatterns: [RegExp, string][] = [
    [/video\s+edit(?:ing)?|edit\s+video|cut\s+clips?|youtube\s+video/i, 'video editing'],
    [/text\s*to\s*video|generate\s+video|ai\s+video\s+gen/i, 'video generation'],
    [/slide\s*deck|presentation|slides?|ppt|powerpoint/i, 'presentation & slide deck design'],
    [/code\s+assistant|coding|autocomplete|ide|developer|debug/i, 'coding & development'],
    [/voice\s*over|tts|text\s*to\s*speech|voice\s+clon/i, 'voiceover & audio generation'],
    [/transcription|audio\s*to\s*text|meeting\s+notes|transcribe/i, 'audio transcription & meeting notes'],
    [/image\s+gen(?:eration)?|generate\s+images?|text\s*to\s*image|midjourney|flux/i, 'image generation'],
    [/image\s+edit(?:ing)?|remove\s+bg|background\s+remov|upscal/i, 'image editing & cleanup'],
    [/content\s+creation|social\s+media|copywriting|blog\s+writing/i, 'content creation & marketing'],
    [/website\s+builder|build\s+website|landing\s+page/i, 'website building & UI generation'],
    [/data\s+analysis|analytics|spreadsheets?|excel|csv/i, 'data analysis & spreadsheets'],
    [/knowledge\s*base|rag|internal\s+docs|second\s+brain/i, 'knowledge base & document search'],
  ];

  for (const [regex, label] of useCasePatterns) {
    if (regex.test(lower)) {
      constraints.useCase = label;
      break;
    }
  }

  // Feature constraints
  const features: string[] = [];
  if (lower.includes('caption') || lower.includes('subtitle')) features.push('subtitles/captions');
  if (lower.includes('watermark free') || lower.includes('no watermark') || lower.includes("don't add watermarks")) features.push('no watermark');
  if (lower.includes('timeline')) features.push('timeline editor');
  if (lower.includes('voice clone') || lower.includes('voice cloning')) features.push('voice cloning');
  if (lower.includes('multi-track') || lower.includes('multitrack')) features.push('multitrack');
  if (lower.includes('commercial use')) features.push('commercial rights');
  if (features.length > 0) {
    constraints.features = features;
  }

  return constraints;
}

/**
 * Dedicated domain intent classification engine.
 * Classifies natural language queries into structured AURA intents with strict domain guardrails.
 */
export function classifyAuraIntent(
  query: string,
  context?: ClassificationContext
): AuraClassification {
  const trimmed = query.trim();
  const lower = trimmed.toLowerCase();

  // 1. Check for empty or trivial query
  if (!trimmed) {
    return {
      intent: 'CLARIFICATION_REQUIRED',
      confidence: 1.0,
      inScope: true,
      entities: [],
      constraints: {},
      clarificationNeeded: true,
      clarificationQuestion: 'What AI utility or workflow can I help you find today?',
      reasoning: 'Empty input query.'
    };
  }

  // 2. Extract entities and constraints early
  const entities = extractEntities(trimmed);
  const constraints = extractConstraints(trimmed);

  const prevTools = context?.previousToolNames || [];
  const activeUc = context?.activeUseCase;

  // 3. Strict Out-of-Scope Evaluation
  for (const pattern of OUT_OF_SCOPE_PATTERNS) {
    if (pattern.test(trimmed)) {
      const hasToolContext = /\b(?:ai\s+tool|ai\s+tools|ai\s+app|which\s+tool|best\s+tool|tools\s+to)\b/i.test(lower);
      if (!hasToolContext) {
        return {
          intent: 'OUT_OF_SCOPE',
          confidence: 0.98,
          inScope: false,
          entities,
          constraints,
          clarificationNeeded: false,
          reasoning: 'Query matches general knowledge, educational tutorial, or arithmetic pattern.'
        };
      }
    }
  }

  // Additional raw math check
  if ((/^[\d\s\+\-\*\/\(\)\^\.\%x×÷]+$/.test(trimmed) || lower.includes('multiplied by') || lower.includes('divided by')) && !lower.includes('tool')) {
    return {
      intent: 'OUT_OF_SCOPE',
      confidence: 0.99,
      inScope: false,
      entities,
      constraints,
      clarificationNeeded: false,
      reasoning: 'Raw mathematical calculation without AI platform context.'
    };
  }

  // 4. Check for Under-Specified Queries requiring Clarification
  const singleWord = lower.replace(/[^a-z0-9]/g, '');
  const isVagueShortQuery =
    (singleWord.length <= 4 && ['ai', 'tool', 'apps', 'help', 'best', 'find', 'make', 'work'].includes(singleWord)) ||
    /^(?:recommend|suggest|show\s+me|give\s+me|i\s+need|tools?|ai\s+tools?)\s*$/i.test(trimmed);

  if (isVagueShortQuery && entities.length === 0 && !activeUc) {
    return {
      intent: 'CLARIFICATION_REQUIRED',
      confidence: 0.95,
      inScope: true,
      entities,
      constraints,
      clarificationNeeded: true,
      clarificationQuestion: 'What specific task or project are you looking to accomplish with AI? (e.g. video editing, presentation slides, coding, voiceover)',
      reasoning: 'Query is underspecified.'
    };
  }

  // Clean for 'vs' to protect 'vs code'
  const cleanForVs = lower.replace(/\bvs\s*code\b/g, 'vscode');

  // 5. Multi-Turn Contextual Reference Resolution
  if (context && (activeUc || prevTools.length > 0)) {
    if (/^(?:only\s+free\s+ones?|free\s+only|make\s+them\s+free|show\s+only\s+free|paid\s+options?|open\s*source\s+only|what\s+about\s+open\s*source\s+options\??|for\s+mac\s+only|show\s+paid\s+plans.*|are\s+there\s+any\s+that\s+don't\s+add\s+watermarks\??)$/i.test(trimmed)) {
      return {
        intent: 'TOOL_DISCOVERY',
        confidence: 0.95,
        inScope: true,
        entities: prevTools,
        constraints: { ...constraints, useCase: activeUc },
        clarificationNeeded: false,
        reasoning: 'Multi-turn constraint refinement on previous tool discovery.'
      };
    }

    if (/\b(?:workflow|build|chain|combine|connecting\s+them)\b/i.test(lower) && /\b(?:first\s+two|both\s+of\s+them|these\s+two|combine\s+them|automation\s+pipeline|them)\b/i.test(lower)) {
      return {
        intent: 'WORKFLOW_DESIGN',
        confidence: 0.94,
        inScope: true,
        entities: prevTools.slice(0, 2),
        constraints,
        clarificationNeeded: false,
        reasoning: 'Multi-turn workflow construction referencing previous tools.'
      };
    }

    if (/\balternatives?\s+to\s+(?:the\s+)?first\s+one\b/i.test(lower)) {
      return {
        intent: 'TOOL_ALTERNATIVES',
        confidence: 0.95,
        inScope: true,
        entities: prevTools.slice(0, 1),
        constraints,
        clarificationNeeded: false,
        reasoning: 'Multi-turn alternative request for previously recommended tool.'
      };
    }

    if (/\b(?:compare\s+(?:them|the\s+top\s+two|these\s+two)|which\s+of\s+these\s+two|can\s+both\s+of\s+them)\b/i.test(lower)) {
      return {
        intent: 'TOOL_COMPARISON',
        confidence: 0.95,
        inScope: true,
        entities: prevTools.slice(0, 2),
        constraints,
        clarificationNeeded: false,
        reasoning: 'Multi-turn comparison of previously recommended tools.'
      };
    }

    if (/\b(?:how\s+much\s+does\s+the\s+second|cost\s+of\s+the\s+second|review\s+the\s+first)\b/i.test(lower)) {
      return {
        intent: 'TOOL_EVALUATION',
        confidence: 0.94,
        inScope: true,
        entities: prevTools.length >= 2 ? prevTools.slice(1, 2) : prevTools.slice(0, 1),
        constraints,
        clarificationNeeded: false,
        reasoning: 'Multi-turn evaluation of specific previously recommended tool.'
      };
    }

    if (/\b(?:prompts?\s+for\s+it|suggest\s+tested\s+prompts)\b/i.test(lower)) {
      return {
        intent: 'PROMPT_ENGINEERING',
        confidence: 0.95,
        inScope: true,
        entities: prevTools.slice(0, 1),
        constraints,
        clarificationNeeded: false,
        reasoning: 'Multi-turn prompt request for previously recommended tool.'
      };
    }
  }

  // 6. Explicit Tool Comparison Intent
  const isComparisonSyntax =
    /\b(?:compare|comparison|versus|\bvs\.?(?!\s*code\b)|diff(?:erence)?\s+between)\b/i.test(cleanForVs) ||
    (entities.length >= 2 && /\b(?:or|and|with)\b/i.test(lower) && /\b(?:better|recommend|choose|which\s+one)\b/i.test(lower));

  if (isComparisonSyntax || (entities.length >= 2 && /\bvs\.?(?!\s*code\b)\b/i.test(cleanForVs))) {
    return {
      intent: 'TOOL_COMPARISON',
      confidence: 0.95,
      inScope: true,
      entities,
      constraints,
      clarificationNeeded: false,
      reasoning: 'User is comparing two or more tools or platforms.'
    };
  }

  // 7. Explicit Tool Alternatives Intent
  const isAlternativeSyntax =
    /\b(?:alternative|alternatives|replacement|replacements|competitor|competitors|similar\s+to|substitute)\b/i.test(lower) ||
    /\b(?:instead\s+of)\s+([a-z0-9\s]+)/i.test(lower) ||
    /\bcheaper\s+alternatives?\b/i.test(lower);

  if (isAlternativeSyntax && (entities.length > 0 || lower.includes('tools like') || lower.includes('alternatives to'))) {
    return {
      intent: 'TOOL_ALTERNATIVES',
      confidence: 0.94,
      inScope: true,
      entities,
      constraints,
      clarificationNeeded: false,
      reasoning: 'User is seeking substitutes or alternatives to an existing tool.'
    };
  }

  // 8. Explicit Tool Evaluation Intent
  const isEvaluationSyntax =
    /\b(?:evaluate|evaluation|review|trust\s*score|pros?\s+and\s+cons?|is\s+[a-z0-9\s]+\s+worth\s+it|worth\s+(?:it|the)|is\s+[a-z0-9\s]+\s+safe|pricing\s+of|reliability\s+of)\b/i.test(lower);

  if (isEvaluationSyntax && (entities.length > 0 || prevTools.length > 0)) {
    return {
      intent: 'TOOL_EVALUATION',
      confidence: 0.91,
      inScope: true,
      entities,
      constraints,
      clarificationNeeded: false,
      reasoning: 'User is evaluating specific tool metrics, pricing, or trustworthiness.'
    };
  }

  // 9. WORKFLOW_DESIGN Intent
  const isWorkflowSyntax =
    /\b(?:workflow|pipeline|automate\s+(?:customer|content|social|seo|blog|support|ticket|legal)|automation\s+pipeline|chain\s+.*?\btools|combine\s+.*?\btools|combination\s+of\s+.*?\btools|multi-tool|stack\s+(?:of|for)|ai\s+stack|process\s+to\s+automate)\b/i.test(lower);

  const isJustToolDiscovery =
    /\b(?:automation\s+utilities|automation\s+tools?|spreadsheet\s+formulas?)\b/i.test(lower);

  if (isWorkflowSyntax && !isJustToolDiscovery) {
    return {
      intent: 'WORKFLOW_DESIGN',
      confidence: 0.92,
      inScope: true,
      entities,
      constraints,
      clarificationNeeded: false,
      reasoning: 'User is designing a multi-step AI workflow or tool combination.'
    };
  }

  // 10. PROMPT_ENGINEERING Intent
  const isPromptSyntax =
    /\b(?:prompt|prompts|prompting|prompt\s+engineering|optimize\s+(?:my\s+)?prompt|craft\s+(?:a\s+)?prompt|prompt\s+template)\b/i.test(lower);

  if (isPromptSyntax) {
    return {
      intent: 'PROMPT_ENGINEERING',
      confidence: 0.95,
      inScope: true,
      entities,
      constraints,
      clarificationNeeded: false,
      reasoning: 'User is requesting prompt generation, optimization, or templates for AI tools.'
    };
  }

  // 11. Explicit Discovery with 'which tools / find tools'
  if (/\b(?:which\s+tools?|find\s+tools?|recommend\s+tools?)\b/i.test(lower)) {
    return {
      intent: 'TOOL_DISCOVERY',
      confidence: 0.92,
      inScope: true,
      entities,
      constraints,
      clarificationNeeded: false,
      reasoning: 'Direct tool discovery query.'
    };
  }

  // 12. AI_TOOL_GUIDANCE Intent
  const isGuidanceSyntax =
    /\b(?:how\s+to\s+choose|how\s+to\s+select|guide\s+me|what\s+should\s+i\s+use)\b/i.test(lower) ||
    (lower.includes('in the context of') && ['platform', 'tool', 'software', 'selection'].some(w => lower.includes(w))) ||
    /\b(?:tools?\s+(?:to|that\s+can|can)\s+help\s+me\s+learn)\b/i.test(lower);

  if (isGuidanceSyntax) {
    return {
      intent: 'AI_TOOL_GUIDANCE',
      confidence: 0.90,
      inScope: true,
      entities,
      constraints,
      clarificationNeeded: false,
      reasoning: 'User is asking for consultative decision guidance on selecting or adopting AI utilities.'
    };
  }

  // 13. In-Scope Default: TOOL_DISCOVERY
  const isImplicitDiscovery =
    constraints.useCase !== undefined ||
    constraints.budget !== undefined ||
    constraints.platform !== undefined ||
    AI_TOOL_INDICATORS.some((w) => lower.includes(w)) ||
    /\b(?:find|search|recommend|suggest|need|looking\s+for|best|top|good)\b/i.test(lower);

  if (isImplicitDiscovery) {
    return {
      intent: 'TOOL_DISCOVERY',
      confidence: 0.88,
      inScope: true,
      entities,
      constraints,
      clarificationNeeded: false,
      reasoning: 'User is discovering AI tools matching functional use-case requirements.'
    };
  }

  // 14. Final Fallback: Non-AI query rejection
  const mentionsAi = /\b(?:ai|artificial\s+intelligence|llm|gpt|neural|model|bot|automation|generative)\b/i.test(lower);
  if (!mentionsAi && entities.length === 0) {
    return {
      intent: 'OUT_OF_SCOPE',
      confidence: 0.85,
      inScope: false,
      entities: [],
      constraints: {},
      clarificationNeeded: false,
      reasoning: 'Query does not involve AI tools, discovery, workflows, or prompt optimization.'
    };
  }

  return {
    intent: 'TOOL_DISCOVERY',
    confidence: 0.75,
    inScope: true,
    entities,
    constraints,
    clarificationNeeded: false,
    reasoning: 'General AI discovery query.'
  };
}
