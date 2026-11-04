import { NextRequest, NextResponse } from 'next/server';
import { tools } from '@/data/tools';
import type { Tool } from '@/lib/site';
import { auth } from '@/lib/auth/config';
import { BoundedLruCache } from '@/lib/cache';
import { checkRateLimit, buildRateLimitResponse } from '@/lib/rate-limit';
import {
  classifyAuraIntent,
  type AuraClassification,
  type AuraIntent,
} from '@/lib/auraDomainClassifier';
import {
  extractConversationState,
  resolveReferences,
  buildGroundedContextSummary,
  type ConversationTurn,
} from '@/lib/conversationContext';
import {
  findToolByNameOrSlug,
  findComparisonTools,
  buildComparisonMatrix,
  buildWorkflowPlan,
  findToolAlternatives,
  searchCatalogFallback,
  type ToolComparisonMatrix,
  type WorkflowPlan,
} from '@/lib/assistantEngine';
import {
  resolveBrainConfig,
  queryLLMBrain,
  type BrainConfig,
} from '@/lib/llmBrain';

export const runtime = 'nodejs';

const AIML_SERVICE_URL =
  process.env.AURA_INTELLIGENCE_URL ||
  process.env.AURA_AIML_URL ||
  'http://127.0.0.1:8000';

const assistantCache = new BoundedLruCache<any>({ maxSize: 300, defaultTtlMs: 3 * 60 * 1000 });

// Polite, concise domain-specific redirect for out-of-scope requests
const DOMAIN_REDIRECT_REPLY =
  `I'm **AURA Copilot**, specialized exclusively in AI tool discovery and workflow intelligence.\n\n` +
  `I can help you discover verified AI tools, compare platforms, build AI-powered workflows, optimize prompts, and find suitable alternatives.\n\n` +
  `Let's explore how AI utilities can help you accomplish your project or workflow.`;

function isGreetingOrIdentity(text: string): { isGreeting: boolean; isIdentity: boolean; isGratitude: boolean } {
  const cleaned = text.toLowerCase().trim().replace(/[!.,?]+$/, '').trim();
  const greetings = new Set([
    'hi', 'hello', 'hey', 'heyy', 'heyyy', 'howdy', 'yo', 'sup',
    'good morning', 'good afternoon', 'good evening', 'greetings',
    'hi there', 'hello there', 'hey there', "what's up", 'whats up',
    'hi aura', 'hello aura', 'hey aura'
  ]);

  const identities = [
    'who are you', 'what are you', 'what can you do', 'how do you work',
    'what is aura', 'help', 'features', 'what do you do', 'who created you'
  ];

  const gratitudes = new Set([
    'thanks', 'thank you', 'thx', 'thanks a lot', 'thank you so much',
    'appreciate it', 'bye', 'goodbye', 'cya', 'see ya', 'good night'
  ]);

  return {
    isGreeting: greetings.has(cleaned),
    isIdentity: identities.some((p) => cleaned === p),
    isGratitude: gratitudes.has(cleaned),
  };
}

function attachGenerativeUi(
  reply: string,
  intent: string,
  tools: Tool[],
  comparison: ToolComparisonMatrix | null,
  workflow: WorkflowPlan | null,
  followUps: string[]
): string {
  let enhanced = reply;

  // 1. Comparison Matrix block
  if (comparison && !enhanced.includes('gen-ui:compare') && !enhanced.includes('gen-ui-compare')) {
    const payload = {
      title: `${comparison.toolA.name} vs ${comparison.toolB.name}`,
      tools: [
        {
          id: comparison.toolA.id,
          name: comparison.toolA.name,
          pricing: comparison.toolA.pricing,
          category: comparison.toolA.category,
          bestFor: comparison.toolA.keyFeatures?.[0] || comparison.toolA.description.slice(0, 50),
        },
        {
          id: comparison.toolB.id,
          name: comparison.toolB.name,
          pricing: comparison.toolB.pricing,
          category: comparison.toolB.category,
          bestFor: comparison.toolB.keyFeatures?.[0] || comparison.toolB.description.slice(0, 50),
        },
      ],
    };
    enhanced += `\n\n\`\`\`gen-ui:compare\n${JSON.stringify(payload, null, 2)}\n\`\`\``;
  }

  // 2. Workflow Timeline Stepper block
  if (workflow && !enhanced.includes('gen-ui:workflow') && !enhanced.includes('gen-ui-workflow')) {
    const payload = {
      title: workflow.title,
      description: workflow.useCase,
      steps: workflow.steps.map((s) => ({
        step: s.stepNumber,
        title: s.phase,
        tool: s.tool.name,
        duration: '15m',
        description: s.task,
        promptTemplate: s.promptTip || undefined,
      })),
    };
    enhanced += `\n\n\`\`\`gen-ui:workflow\n${JSON.stringify(payload, null, 2)}\n\`\`\``;
  }

  // 3. Tool Recommendation Cards block (if discovery or alternatives)
  if (
    (intent === 'TOOL_DISCOVERY' || intent === 'TOOL_ALTERNATIVES') &&
    tools.length > 0 &&
    !enhanced.includes('gen-ui:tool') &&
    !enhanced.includes('gen-ui-tool')
  ) {
    const payload = {
      tools: tools.slice(0, 4).map((t) => ({
        id: t.id,
        name: t.name,
        tagline: t.description,
        category: t.category,
        pricing: t.pricing,
        trustScore: t.trustScore,
        rating: (t.trustScore / 20).toFixed(1),
        websiteUrl: t.url,
        features: t.keyFeatures?.slice(0, 2) || t.tags?.slice(0, 2) || [],
      })),
    };
    enhanced += `\n\n\`\`\`gen-ui:tool-recommendation\n${JSON.stringify(payload, null, 2)}\n\`\`\``;
  }

  // 4. Action Suggestion Chips
  if (
    followUps.length > 0 &&
    !enhanced.includes('gen-ui:action-chips') &&
    !enhanced.includes('gen-ui:chips')
  ) {
    const payload = {
      heading: 'Next Actions:',
      chips: followUps,
    };
    enhanced += `\n\n\`\`\`gen-ui:action-chips\n${JSON.stringify(payload, null, 2)}\n\`\`\``;
  }

  return enhanced;
}

export async function POST(request: NextRequest) {
  // 1. Rate limiting (40 requests per minute per client IP)
  const rateLimit = checkRateLimit(request, { limit: 40, windowMs: 60_000, keyPrefix: 'assistant' });
  if (!rateLimit.success) {
    return buildRateLimitResponse(rateLimit);
  }

  const startTime = Date.now();
  try {
    const body = await request.json();
    const rawMessage = typeof body?.message === 'string' ? body.message.trim() : '';
    const rawHistory: ConversationTurn[] = Array.isArray(body?.history) ? body.history : [];
    const clientBrainConfig = body?.brainConfig;

    // 2. Validate and sanitize the request
    if (!rawMessage) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }
    if (rawMessage.length > 2000) {
      return NextResponse.json({ error: 'Message exceeds maximum character limit (2000)' }, { status: 400 });
    }

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

    // Resolve Active Brain Config (Ollama, Gemini, Groq, OpenAI, or Built-in)
    const brainConfig = resolveBrainConfig(clientBrainConfig);

    // 3. Multi-Turn Context Tracking & Reference Resolution
    const conversationState = extractConversationState(rawHistory, rawMessage);
    const { expandedQuery, referencedTools, isOrdinalReference } = resolveReferences(rawMessage, conversationState);

    // Check greetings / identity / gratitude before classification
    const { isGreeting, isIdentity, isGratitude } = isGreetingOrIdentity(rawMessage);

    if (isGreeting) {
      const salutation = userName ? `Hello **${userName}**! 👋` : 'Hello! 👋';
      const reply = `${salutation} I'm **AURA Copilot**, your AI Utility Intelligence Assistant.\n\n` +
        `Tell me what task or project you are working on, and I will recommend verified AI tools, compare platforms, or assemble an automated workflow.`;

      return NextResponse.json({
        reply,
        intent: 'AI_TOOL_GUIDANCE',
        inScope: true,
        tools: [],
        comparison: null,
        workflow: null,
        suggestedFollowUps: [],
        needsClarification: false,
        brainInfo: { provider: brainConfig.provider, model: brainConfig.model },
        latencyMs: Math.max(Date.now() - startTime, 15),
      });
    }

    if (isIdentity) {
      const reply = `I am **AURA Copilot**, the specialized AI Utility Intelligence Assistant for **AURA.ai**.\n\n` +
        `I assist with:\n` +
        `• **AI Tool Discovery**: Finding the highest-rated AI utilities for your specific workflow, budget, and platform.\n` +
        `• **Platform Comparisons**: Objective side-by-side benchmarks on features, pricing, and trust scores.\n` +
        `• **Workflow Automation**: Designing multi-tool pipelines that connect AI services seamlessly.\n` +
        `• **Prompt Engineering**: Crafting optimized, tool-specific prompt templates.`;

      return NextResponse.json({
        reply,
        intent: 'AI_TOOL_GUIDANCE',
        inScope: true,
        tools: [],
        comparison: null,
        workflow: null,
        suggestedFollowUps: [],
        needsClarification: false,
        brainInfo: { provider: brainConfig.provider, model: brainConfig.model },
        latencyMs: Math.max(Date.now() - startTime, 15),
      });
    }

    if (isGratitude) {
      return NextResponse.json({
        reply: `You're very welcome! Let me know whenever you need AI tool recommendations, comparisons, or workflow designs.`,
        intent: 'AI_TOOL_GUIDANCE',
        inScope: true,
        tools: [],
        comparison: null,
        workflow: null,
        suggestedFollowUps: [],
        needsClarification: false,
        brainInfo: { provider: brainConfig.provider, model: brainConfig.model },
        latencyMs: Math.max(Date.now() - startTime, 15),
      });
    }

    // 4. Dedicated Domain Intent Classification
    const classification: AuraClassification = classifyAuraIntent(expandedQuery, {
      history: rawHistory.map((h) => ({ role: h.role, content: h.content })),
      previousToolNames: conversationState.lastRecommendedTools.map((t) => t.name),
      activeUseCase: conversationState.activeUseCase,
    });

    // 5. Check Domain Eligibility
    if (!classification.inScope || classification.intent === 'OUT_OF_SCOPE') {
      return NextResponse.json({
        reply: DOMAIN_REDIRECT_REPLY,
        intent: 'OUT_OF_SCOPE',
        inScope: false,
        tools: [],
        comparison: null,
        workflow: null,
        suggestedFollowUps: [], // No unwanted suggestions on out of scope
        needsClarification: false,
        brainInfo: { provider: brainConfig.provider, model: brainConfig.model },
        latencyMs: Math.max(Date.now() - startTime, 15),
      });
    }

    // 6. Clarification Handling
    if (classification.clarificationNeeded || classification.intent === 'CLARIFICATION_REQUIRED') {
      const question =
        classification.clarificationQuestion ||
        'What specific task or project would you like to accomplish with AI? (e.g., video editing, presentation slides, coding, voiceover)';

      return NextResponse.json({
        reply: question,
        intent: 'CLARIFICATION_REQUIRED',
        inScope: true,
        tools: [],
        comparison: null,
        workflow: null,
        suggestedFollowUps: [],
        needsClarification: true,
        brainInfo: { provider: brainConfig.provider, model: brainConfig.model },
        latencyMs: Math.max(Date.now() - startTime, 15),
      });
    }

    // 7. Route to Specialized Domain Modules
    let responseReply = '';
    let responseTools: Tool[] = [];
    let responseComparison: ToolComparisonMatrix | null = null;
    let responseWorkflow: WorkflowPlan | null = null;
    const contextualFollowUps: string[] = [];

    // --- MODULE A: TOOL COMPARISON ---
    if (classification.intent === 'TOOL_COMPARISON') {
      const comparisonPair = findComparisonTools(expandedQuery, classification.entities);
      if (comparisonPair) {
        const [toolA, toolB] = comparisonPair;
        responseComparison = buildComparisonMatrix(toolA, toolB);
        responseTools = [toolA, toolB];

        responseReply =
          `Here is an objective side-by-side benchmark between **${toolA.name}** and **${toolB.name}**:\n\n` +
          `• **${toolA.name}** (${toolA.category} • ${toolA.pricing}): ${toolA.description}\n` +
          `• **${toolB.name}** (${toolB.category} • ${toolB.pricing}): ${toolB.description}\n\n` +
          `**Trust Score Analysis:** ${toolA.name} scores **${toolA.trustScore}/100**, while ${toolB.name} scores **${toolB.trustScore}/100** on verified community benchmarks.\n\n` +
          `**Recommendation:** Choose **${toolA.name}** if your priority is ${
            toolA.keyFeatures?.[0] || 'rapid deployment'
          }. Choose **${toolB.name}** if you need ${toolB.keyFeatures?.[0] || 'advanced flexibility'}.`;

        contextualFollowUps.push(`Build a workflow combining ${toolA.name} and ${toolB.name}`);
      } else {
        responseReply = `Which two AI tools would you like to compare? (e.g., *Compare Cursor vs GitHub Copilot* or *Runway vs Pika*).`;
      }
    }

    // --- MODULE B: WORKFLOW DESIGN ---
    else if (classification.intent === 'WORKFLOW_DESIGN') {
      const workflowPlan = buildWorkflowPlan(expandedQuery, classification);
      responseWorkflow = workflowPlan;
      responseTools = workflowPlan.steps.map((s) => s.tool);

      const stepsText = workflowPlan.steps
        .map((s) => `**Step ${s.stepNumber} [${s.phase}]:** Use **${s.tool.name}** (${s.tool.pricing}) — ${s.task}`)
        .join('\n');

      responseReply =
        `### ${workflowPlan.title}\n\n` +
        `**Use Case:** ${workflowPlan.useCase}\n` +
        `**Estimated Tier:** ${workflowPlan.estimatedCost}\n\n` +
        `${stepsText}\n\n` +
        `*Synergy:* ${workflowPlan.synergyExplanation}`;

      contextualFollowUps.push('Filter workflow with 100% free tools');
    }

    // --- MODULE C: TOOL ALTERNATIVES ---
    else if (classification.intent === 'TOOL_ALTERNATIVES') {
      const targetName = classification.entities[0];
      const targetTool = targetName ? findToolByNameOrSlug(targetName) : undefined;

      if (targetTool) {
        const alternatives = findToolAlternatives(targetTool, classification.constraints);
        responseTools = alternatives;

        const altListText = alternatives
          .map((alt) => `• **${alt.name}** (${alt.pricing} • Trust: ${alt.trustScore}/100): ${alt.description}`)
          .join('\n');

        responseReply =
          `Here are verified AI alternatives to **${targetTool.name}** based on catalog features and community trust:\n\n` +
          `${altListText}\n\n` +
          `*Why switch:* Depending on whether you prioritize pricing or features, these options provide equivalent or specialized workflows.`;

        if (alternatives.length >= 2) {
          contextualFollowUps.push(`Compare ${targetTool.name} vs ${alternatives[0].name}`);
        }
      } else {
        responseReply = `Which AI tool are you looking to replace or find alternatives for? (e.g. *Find alternatives to ChatGPT* or *Free replacement for Jasper*).`;
      }
    }

    // --- MODULE D: PROMPT ENGINEERING ---
    else if (classification.intent === 'PROMPT_ENGINEERING') {
      const targetName = classification.entities[0];
      const targetTool = targetName ? findToolByNameOrSlug(targetName) : undefined;

      const toolPrefix = targetTool ? `for **${targetTool.name}**` : 'for your AI workflow';
      const promptSnippet = targetTool?.bestPrompts?.[0]?.prompt
        ? targetTool.bestPrompts[0].prompt
        : `Role: Expert AI Consultant\nObjective: Execute [SPECIFIC_TASK] with maximum fidelity.\nContext: [PROJECT_DETAILS]\nConstraints: Maintain concise, production-ready output without filler.\nOutput Format: Structured markdown.`;

      responseReply =
        `Here is an optimized prompt template ${toolPrefix}:\n\n` +
        `\`\`\`markdown\n${promptSnippet}\n\`\`\`\n\n` +
        `**Optimization Tips:**\n` +
        `1. Replace bracketed placeholders with specific details.\n` +
        `2. Explicitly state output constraints (format, length, tone).\n` +
        `3. Provide 1 concrete example for in-context few-shot guidance.`;

      if (targetTool) responseTools = [targetTool];
      contextualFollowUps.push('Refine prompt with specific constraints');
    }

    // --- MODULE E: TOOL EVALUATION ---
    else if (classification.intent === 'TOOL_EVALUATION') {
      const targetName = classification.entities[0];
      const targetTool = targetName ? findToolByNameOrSlug(targetName) : undefined;

      if (targetTool) {
        responseTools = [targetTool];
        const prosText = targetTool.pros?.slice(0, 3).map((p) => `  + ${p}`).join('\n') || '  + Verified community reliability';
        const consText = targetTool.cons?.slice(0, 2).map((c) => `  - ${c}`).join('\n') || '  - May require premium plan for high volume';

        responseReply =
          `### Evaluation: **${targetTool.name}**\n\n` +
          `• **Category:** ${targetTool.category}\n` +
          `• **Pricing Model:** ${targetTool.pricing}\n` +
          `• **Trust Score:** **${targetTool.trustScore}/100** (Verified)\n` +
          `• **Verified Status:** ${targetTool.verified ? 'Verified Partner' : 'Community Curated'}\n\n` +
          `**Strengths & Considerations:**\n${prosText}\n${consText}\n\n` +
          `**Verdict:** Recommended for users needing ${targetTool.keyFeatures?.[0] || targetTool.category.toLowerCase()}.`;

        contextualFollowUps.push(`Find alternatives to ${targetTool.name}`);
      } else {
        responseReply = `Which AI tool would you like me to evaluate? (e.g. *Evaluate Cursor* or *Is Runway worth it?*).`;
      }
    }

    // --- MODULE F: TOOL DISCOVERY / AI TOOL GUIDANCE (DEFAULT) ---
    else {
      // 8. Hybrid Retrieval Engine (FAISS Dense + BM25 Sparse + RRF + Neural Ranker)
      let mlResults: any[] = [];
      try {
        const mlResponse = await fetch(`${AIML_SERVICE_URL}/recommend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: expandedQuery,
            top_k: 6,
            use_reranker: true,
          }),
          signal: AbortSignal.timeout(4000),
        });

        if (mlResponse.ok) {
          const data = await mlResponse.json();
          mlResults = data.results || [];
        }
      } catch {
        // ML service unreachable; proceed to safe fallback
      }

      // Map ML results to catalog tools
      if (mlResults.length > 0) {
        for (const res of mlResults) {
          const found = tools.find((t) => t.id === res.tool_id || t.name.toLowerCase() === res.name?.toLowerCase());
          if (found && !responseTools.some((t) => t.id === found.id)) {
            responseTools.push(found);
          }
        }
      }

      // Safe fallback: NEVER return random tools or tools.slice(0, 3)
      if (responseTools.length === 0) {
        responseTools = searchCatalogFallback(expandedQuery, classification.constraints);
      }

      // Apply strict budget constraint if specified
      if (classification.constraints.budget === 'free') {
        const freeTools = responseTools.filter((t) => t.pricing.toLowerCase().includes('free'));
        if (freeTools.length > 0) {
          responseTools = freeTools;
        }
      }

      if (responseTools.length > 0) {
        const lead = responseTools[0];
        const count = responseTools.length;
        const toolListText = responseTools
          .map((t) => `• **${t.name}** (${t.pricing} • Trust: ${t.trustScore}/100) — ${t.description}`)
          .join('\n');

        responseReply =
          `Based on your discovery request, here are **${count} verified AI tools** from the AURA catalog:\n\n` +
          `${toolListText}\n\n` +
          `**Top Recommendation:** **${lead.name}** holds a **${lead.trustScore}/100 Trust Score** and specializes in ${lead.tags.slice(0, 3).join(', ')}.`;

        if (responseTools.length >= 2) {
          contextualFollowUps.push(`Compare ${responseTools[0].name} vs ${responseTools[1].name}`);
        }
        if (classification.constraints.budget !== 'free') {
          contextualFollowUps.push('Filter by free plans');
        }
      } else {
        responseReply =
          `I couldn't find verified AI tools in the catalog matching your exact criteria. ` +
          `Could you clarify your required format (e.g. video, code, slides, voice) or specific features?`;
      }
    }

    // 9. Grounded LLM Brain Generation (Optional Ollama / Gemini / Groq / OpenAI)
    // When external brain is configured and we have catalog tools, let the LLM generate a polished consultative response
    if (brainConfig.provider !== 'builtin' && responseTools.length > 0) {
      const groundedEvidence = responseTools
        .map((t) => `Tool: ${t.name} | Category: ${t.category} | Pricing: ${t.pricing} | TrustScore: ${t.trustScore}/100 | Features: ${t.keyFeatures?.join(', ') || 'N/A'} | Description: ${t.description}`)
        .join('\n');

      const brainResult = await queryLLMBrain(
        expandedQuery,
        rawHistory.map((h) => ({ role: h.role, content: h.content })),
        brainConfig,
        {
          groundedContext: groundedEvidence,
          maxHistoryTurns: 8,
        }
      );

      if (brainResult && brainResult.reply) {
        responseReply = brainResult.reply;
      }
    }

    // Ensure rich Generative UI blocks are present for interactive rendering
    responseReply = attachGenerativeUi(
      responseReply,
      classification.intent,
      responseTools,
      responseComparison,
      responseWorkflow,
      contextualFollowUps
    );

    // 10. Format and Return Standardized JSON Response
    const responsePayload = {
      reply: responseReply,
      intent: classification.intent,
      inScope: classification.inScope,
      tools: responseTools,
      comparison: responseComparison,
      workflow: responseWorkflow,
      suggestedFollowUps: contextualFollowUps, // Only contextual actions, never generic clutter
      needsClarification: false,
      brainInfo: {
        provider: brainConfig.provider === 'builtin' ? 'AURA Neural Engine' : brainConfig.provider.toUpperCase(),
        model: brainConfig.model || 'aura-neural-ranker-v2',
      },
      latencyMs: Math.max(Date.now() - startTime, 20),
    };

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error('[AURA Assistant API error]', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request.' },
      { status: 500 }
    );
  }
}
