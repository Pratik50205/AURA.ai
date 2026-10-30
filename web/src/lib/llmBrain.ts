import type { Tool } from '@/lib/site';

export interface BrainConfig {
  provider: 'gemini' | 'openai' | 'groq' | 'ollama' | 'builtin';
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export interface BrainResult {
  reply: string;
  provider: string;
  model: string;
  latencyMs: number;
}

const SYSTEM_PROMPT = `You are AURA Copilot, a frontier AI assistant and intelligent consultant embedded inside AURA.ai (The AI Utility Discovery Platform).

CORE OPERATING DIRECTIVES:
1. ACCURACY & QUALITY: Provide factually accurate, concise, and helpful answers for all technical (Python, JS, CSS, SQL, Git), scientific, mathematical, and general knowledge questions.
2. STRICT CONSTRAINT ON RECOMMENDATIONS:
   - DO NOT recommend, mention, or force-feed any AI tools or software products UNLESS the user explicitly asks for tool, software, or app recommendations or comparisons.
   - If the user asks a general question (e.g. "What is photosynthesis?", "Calculate 25 * 14", "How do I reverse a string in Python?", "What is quantum computing?"), answer the question directly, cleanly, and thoroughly. DO NOT append tool suggestions.
3. WHEN TOOLS ARE EXPLICITLY REQUESTED:
   - Provide clear, objective advice highlighting exact strengths, pricing models, and trust benchmarks.
4. CODE & FORMATTING: Format code inside standard triple-backtick fenced blocks with language specifiers (e.g. \`\`\`python). Use bullet points and bold headers for readability.`;

/**
 * Resolves active LLM configuration from parameters or environment variables
 */
export function resolveBrainConfig(customConfig?: Partial<BrainConfig>): BrainConfig {
  // 1. Explicit custom config from client
  if (customConfig?.apiKey && customConfig?.provider) {
    return {
      provider: customConfig.provider,
      apiKey: customConfig.apiKey.trim(),
      model: customConfig.model || getDefaultModel(customConfig.provider),
      baseUrl: customConfig.baseUrl,
    };
  }

  // 2. Environment variables fallback
  if (process.env.GEMINI_API_KEY) {
    return {
      provider: 'gemini',
      apiKey: process.env.GEMINI_API_KEY.trim(),
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    };
  }

  if (process.env.GROQ_API_KEY) {
    return {
      provider: 'groq',
      apiKey: process.env.GROQ_API_KEY.trim(),
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    };
  }

  if (process.env.OPENAI_API_KEY) {
    return {
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY.trim(),
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    };
  }

  if (process.env.OLLAMA_BASE_URL) {
    return {
      provider: 'ollama',
      baseUrl: process.env.OLLAMA_BASE_URL,
      model: process.env.OLLAMA_MODEL || 'llama3',
    };
  }

  return {
    provider: 'builtin',
    model: 'aura-neural-engine',
  };
}

export function getDefaultModel(provider: string): string {
  switch (provider) {
    case 'gemini':
      return 'gemini-1.5-flash';
    case 'groq':
      return 'llama-3.3-70b-versatile';
    case 'openai':
      return 'gpt-4o-mini';
    case 'ollama':
      return 'llama3';
    default:
      return 'aura-neural-engine';
  }
}

/**
 * Executes inference through the selected LLM provider
 */
export async function queryLLMBrain(
  message: string,
  history: Array<{ role: string; content: string }> = [],
  config: BrainConfig
): Promise<BrainResult | null> {
  const startTime = Date.now();

  try {
    switch (config.provider) {
      case 'gemini':
        return await queryGemini(message, history, config, startTime);
      case 'groq':
        return await queryOpenAICompatible(
          'https://api.groq.com/openai/v1/chat/completions',
          message,
          history,
          config,
          startTime,
          'Groq'
        );
      case 'openai':
        return await queryOpenAICompatible(
          'https://api.openai.com/v1/chat/completions',
          message,
          history,
          config,
          startTime,
          'OpenAI'
        );
      case 'ollama':
        return await queryOllama(message, history, config, startTime);
      default:
        return null; // Uses built-in local reasoner
    }
  } catch (error) {
    console.error(`[AURA LLM Brain] Error invoking ${config.provider}:`, error);
    return null;
  }
}

/**
 * Google Gemini Provider
 */
async function queryGemini(
  message: string,
  history: Array<{ role: string; content: string }>,
  config: BrainConfig,
  startTime: number
): Promise<BrainResult> {
  if (!config.apiKey) throw new Error('Missing Gemini API key');

  const model = config.model || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;

  // Map history to Gemini contents format
  const contents: any[] = [];

  // Add system instruction as initial context
  contents.push({
    role: 'user',
    parts: [{ text: `${SYSTEM_PROMPT}\n\nPlease acknowledge your instructions.` }]
  });
  contents.push({
    role: 'model',
    parts: [{ text: 'Understood. I will answer all questions with high accuracy and will strictly avoid recommending tools unless explicitly asked.' }]
  });

  // Recent history
  history.slice(-4).forEach((h) => {
    contents.push({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }]
    });
  });

  // Current message
  contents.push({
    role: 'user',
    parts: [{ text: message }]
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      }
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  return {
    reply: reply.trim(),
    provider: 'Google Gemini',
    model,
    latencyMs: Date.now() - startTime,
  };
}

/**
 * OpenAI & Groq (OpenAI-compatible) Provider
 */
async function queryOpenAICompatible(
  endpoint: string,
  message: string,
  history: Array<{ role: string; content: string }>,
  config: BrainConfig,
  startTime: number,
  providerLabel: string
): Promise<BrainResult> {
  if (!config.apiKey) throw new Error(`Missing ${providerLabel} API key`);

  const model = config.model || (providerLabel === 'Groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini');

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-4).map((h) => ({
      role: h.role === 'assistant' ? 'assistant' : 'user',
      content: h.content,
    })),
    { role: 'user', content: message },
  ];

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      max_tokens: 1024,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${providerLabel} API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const reply = data?.choices?.[0]?.message?.content || '';

  return {
    reply: reply.trim(),
    provider: providerLabel,
    model,
    latencyMs: Date.now() - startTime,
  };
}

/**
 * Ollama Local Provider (100% Offline / Private)
 */
async function queryOllama(
  message: string,
  history: Array<{ role: string; content: string }>,
  config: BrainConfig,
  startTime: number
): Promise<BrainResult> {
  const baseUrl = config.baseUrl || 'http://127.0.0.1:11434';
  const model = config.model || 'llama3';

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-4).map((h) => ({
      role: h.role === 'assistant' ? 'assistant' : 'user',
      content: h.content,
    })),
    { role: 'user', content: message },
  ];

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
    }),
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    throw new Error(`Ollama error (${response.status}) at ${baseUrl}`);
  }

  const data = await response.json();
  const reply = data?.message?.content || '';

  return {
    reply: reply.trim(),
    provider: 'Ollama (Local)',
    model,
    latencyMs: Date.now() - startTime,
  };
}
