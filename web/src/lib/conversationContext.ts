import type { AuraClassification } from '@/lib/auraDomainClassifier';
import { extractConstraints, extractEntities } from '@/lib/auraDomainClassifier';

export interface ToolReference {
  id: string;
  name: string;
  category?: string;
  pricing?: string;
}

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  tools?: ToolReference[];
  intent?: string;
  workflow?: unknown;
  comparison?: unknown;
}

export interface ConversationState {
  activeTask?: string;
  activeUseCase?: string;
  activeIntent?: string;
  accumulatedConstraints: {
    budget?: 'free' | 'paid' | 'freemium' | 'opensource';
    platform?: 'web' | 'mac' | 'windows' | 'linux' | 'local' | 'api';
    features?: string[];
  };
  recommendedToolsHistory: ToolReference[];
  lastRecommendedTools: ToolReference[];
  entityMentions: string[];
  turnCount: number;
}

export interface ReferenceResolutionResult {
  expandedQuery: string;
  referencedTools: ToolReference[];
  isOrdinalReference: boolean;
  isConstraintRefinement: boolean;
}

/**
 * Parses and aggregates multi-turn conversation history into a structured ConversationState.
 */
export function extractConversationState(
  history: ConversationTurn[] = [],
  currentMessage: string = ''
): ConversationState {
  const state: ConversationState = {
    accumulatedConstraints: {},
    recommendedToolsHistory: [],
    lastRecommendedTools: [],
    entityMentions: [],
    turnCount: history.length,
  };

  const seenToolIds = new Set<string>();

  // Process historical turns chronologically
  for (const turn of history) {
    // 1. Extract tools recommended by assistant
    if (turn.role === 'assistant' && Array.isArray(turn.tools) && turn.tools.length > 0) {
      state.lastRecommendedTools = turn.tools;
      for (const tool of turn.tools) {
        if (!seenToolIds.has(tool.id)) {
          seenToolIds.add(tool.id);
          state.recommendedToolsHistory.push(tool);
        }
      }
    }

    // 2. Track entities mentioned in user messages
    if (turn.role === 'user') {
      const turnEntities = extractEntities(turn.content);
      for (const ent of turnEntities) {
        if (!state.entityMentions.includes(ent)) {
          state.entityMentions.push(ent);
        }
      }

      // 3. Extract and accumulate user constraints
      const turnConstraints = extractConstraints(turn.content);
      if (turnConstraints.budget) {
        state.accumulatedConstraints.budget = turnConstraints.budget;
      }
      if (turnConstraints.platform) {
        state.accumulatedConstraints.platform = turnConstraints.platform;
      }
      if (turnConstraints.features && turnConstraints.features.length > 0) {
        state.accumulatedConstraints.features = Array.from(
          new Set([...(state.accumulatedConstraints.features || []), ...turnConstraints.features])
        );
      }
      if (turnConstraints.useCase) {
        state.activeUseCase = turnConstraints.useCase;
      }
    }

    // 4. Track intent if recorded
    if (turn.intent) {
      state.activeIntent = turn.intent;
    }
  }

  // Process current user message constraints & entities
  const currentConstraints = extractConstraints(currentMessage);
  if (currentConstraints.budget) {
    state.accumulatedConstraints.budget = currentConstraints.budget;
  }
  if (currentConstraints.platform) {
    state.accumulatedConstraints.platform = currentConstraints.platform;
  }
  if (currentConstraints.features && currentConstraints.features.length > 0) {
    state.accumulatedConstraints.features = Array.from(
      new Set([...(state.accumulatedConstraints.features || []), ...currentConstraints.features])
    );
  }
  if (currentConstraints.useCase) {
    state.activeUseCase = currentConstraints.useCase;
  }

  const currentEntities = extractEntities(currentMessage);
  for (const ent of currentEntities) {
    if (!state.entityMentions.includes(ent)) {
      state.entityMentions.push(ent);
    }
  }

  return state;
}

/**
 * Resolves conversational pronouns, ordinal references, and short constraint modifications
 * against active conversation state.
 *
 * Examples:
 * - "Only free ones" + activeUseCase: "video editing" => "free video editing tools"
 * - "Can you build a workflow using the first two?" => references tools [0] & [1]
 * - "Compare them" => references tools [0] & [1]
 */
export function resolveReferences(
  message: string,
  state: ConversationState
): ReferenceResolutionResult {
  const lower = message.trim().toLowerCase();
  const referencedTools: ToolReference[] = [];
  let isOrdinalReference = false;
  let isConstraintRefinement = false;
  let expanded = message;

  const lastTools = state.lastRecommendedTools;

  // 1. Ordinal References (e.g., "first two", "first one", "second one", "the third", "both of them")
  if (lastTools.length >= 1) {
    if (/\b(?:the\s+)?first\s+two\b|\bboth\s+(?:of\s+)?them\b|\btop\s+2\b/i.test(lower)) {
      isOrdinalReference = true;
      referencedTools.push(...lastTools.slice(0, 2));
    } else if (/\b(?:the\s+)?first\s+one\b|\btool\s+#?1\b|\bthe\s+first\b/i.test(lower)) {
      isOrdinalReference = true;
      referencedTools.push(lastTools[0]);
    } else if (/\b(?:the\s+)?second\s+one\b|\btool\s+#?2\b|\bthe\s+second\b/i.test(lower) && lastTools.length >= 2) {
      isOrdinalReference = true;
      referencedTools.push(lastTools[1]);
    } else if (/\b(?:the\s+)?third\s+one\b|\btool\s+#?3\b|\bthe\s+third\b/i.test(lower) && lastTools.length >= 3) {
      isOrdinalReference = true;
      referencedTools.push(lastTools[2]);
    } else if (/\b(?:these|them|those\s+tools)\b/i.test(lower)) {
      referencedTools.push(...lastTools.slice(0, 2));
    }
  }

  // 2. Multi-turn Workflow Construction Reference
  // e.g. "Can you build a workflow using the first two?" -> expands explicitly
  if (isOrdinalReference && referencedTools.length >= 2 && /\b(?:workflow|combine|pipeline|together)\b/i.test(lower)) {
    const toolNames = referencedTools.map((t) => t.name).join(' and ');
    const useCaseStr = state.activeUseCase ? ` for ${state.activeUseCase}` : '';
    expanded = `Build an AI workflow combining ${toolNames}${useCaseStr}`;
    return {
      expandedQuery: expanded,
      referencedTools,
      isOrdinalReference,
      isConstraintRefinement: false,
    };
  }

  // 3. Multi-turn Comparison Reference
  // e.g. "Compare them" / "Compare the first two"
  if (referencedTools.length >= 2 && /\b(?:compare|comparison|versus|vs\.?)\b/i.test(lower)) {
    expanded = `Compare ${referencedTools[0].name} vs ${referencedTools[1].name}`;
    return {
      expandedQuery: expanded,
      referencedTools,
      isOrdinalReference,
      isConstraintRefinement: false,
    };
  }

  // 4. Constraint Refinement
  // e.g. "Only free ones", "What about open source?", "For Mac only", "Are there any free options?"
  const isBudgetConstraintOnly =
    /^(?:only\s+free\s+(?:ones?|options?|tools?)|free\s+only|free\s+ones?|what\s+about\s+free|show\s+me\s+free\s+ones?|open\s*source\s+only|any\s+free\s+tools\??)$/i.test(
      lower
    );

  const isPlatformConstraintOnly =
    /^(?:for\s+mac(?:\s+only)?|mac\s+os|windows\s+only|linux\s+support|run\s+locally|local\s+only)$/i.test(
      lower
    );

  if (isBudgetConstraintOnly || isPlatformConstraintOnly) {
    isConstraintRefinement = true;
    const parts: string[] = [];
    if (state.accumulatedConstraints.budget) parts.push(state.accumulatedConstraints.budget);
    if (state.accumulatedConstraints.platform) parts.push(state.accumulatedConstraints.platform);
    if (state.activeUseCase) parts.push(state.activeUseCase);
    parts.push('AI tools');

    expanded = parts.join(' ');
  }

  return {
    expandedQuery: expanded,
    referencedTools,
    isOrdinalReference,
    isConstraintRefinement,
  };
}

/**
 * Builds a clean, focused system context block to inject into the LLM prompt.
 * Keeps memory scoped to active task and tools without leaking unbounded tokens.
 */
export function buildGroundedContextSummary(state: ConversationState): string {
  const lines: string[] = [];

  if (state.activeUseCase) {
    lines.push(`- Active Task / Use Case: ${state.activeUseCase}`);
  }

  const constraintTokens: string[] = [];
  if (state.accumulatedConstraints.budget) constraintTokens.push(`Budget: ${state.accumulatedConstraints.budget}`);
  if (state.accumulatedConstraints.platform) constraintTokens.push(`Platform: ${state.accumulatedConstraints.platform}`);
  if (state.accumulatedConstraints.features && state.accumulatedConstraints.features.length > 0) {
    constraintTokens.push(`Features: ${state.accumulatedConstraints.features.join(', ')}`);
  }
  if (constraintTokens.length > 0) {
    lines.push(`- Active Constraints: ${constraintTokens.join(' | ')}`);
  }

  if (state.lastRecommendedTools.length > 0) {
    const toolList = state.lastRecommendedTools
      .slice(0, 4)
      .map((t, idx) => `#${idx + 1} ${t.name} (${t.pricing || 'Freemium'})`)
      .join(', ');
    lines.push(`- Previously Recommended Tools in this conversation: ${toolList}`);
  }

  if (lines.length === 0) {
    return '';
  }

  return `\nACTIVE CONVERSATION CONTEXT:\n${lines.join('\n')}\n`;
}

