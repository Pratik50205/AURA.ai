import { tools } from '@/data/tools';
import type { Tool } from '@/lib/site';

export interface AssistantResponse {
  reply: string;
  tools: Tool[];
  comparison: {
    toolA: Tool;
    toolB: Tool;
    summary: string;
    keyDifferences: string[];
    winnerFor: { [criterion: string]: string };
  } | null;
  suggestedFollowUps: string[];
  intent: string;
}

// ============================================================================
// 1. Math Evaluator & Calculator
// ============================================================================
function tryEvaluateMath(text: string): string | null {
  const cleaned = text.trim().toLowerCase();

  // Percentage calculations: e.g., "what is 15% of 240", "15% of 80"
  const percentMatch = cleaned.match(/(?:what is\s+)?(\d+(?:\.\d+)?)\s*%\s*(?:of)\s*(\d+(?:\.\d+)?)/i);
  if (percentMatch) {
    const p = parseFloat(percentMatch[1]);
    const total = parseFloat(percentMatch[2]);
    const result = (p / 100) * total;
    return `**Calculation:**\n\n` +
      `• **${p}% of ${total}** = (${p} / 100) × ${total} = **${Number(result.toFixed(4))}**`;
  }

  // Temperature conversion: e.g., "convert 100 celsius to fahrenheit"
  const cToFMatch = cleaned.match(/(?:convert\s+)?(-?\d+(?:\.\d+)?)\s*(?:°|degrees?\s*)?c(?:elsius)?\s*(?:to|in)\s*(?:°|degrees?\s*)?f(?:ahrenheit)?/i);
  if (cToFMatch) {
    const c = parseFloat(cToFMatch[1]);
    const f = (c * 9/5) + 32;
    return `**Temperature Conversion:**\n\n` +
      `• **${c}°C** = (${c} × 9/5) + 32 = **${Number(f.toFixed(2))}°F**`;
  }

  const fToCMatch = cleaned.match(/(?:convert\s+)?(-?\d+(?:\.\d+)?)\s*(?:°|degrees?\s*)?f(?:ahrenheit)?\s*(?:to|in)\s*(?:°|degrees?\s*)?c(?:elsius)?/i);
  if (fToCMatch) {
    const f = parseFloat(fToCMatch[1]);
    const c = (f - 32) * 5/9;
    return `**Temperature Conversion:**\n\n` +
      `• **${f}°F** = (${f} - 32) × 5/9 = **${Number(c.toFixed(2))}°C**`;
  }

  // Square root: e.g., "sqrt of 144", "square root of 81"
  const sqrtMatch = cleaned.match(/(?:square root of|sqrt of|sqrt\()\s*(\d+(?:\.\d+)?)\)?/i);
  if (sqrtMatch) {
    const num = parseFloat(sqrtMatch[1]);
    const res = Math.sqrt(num);
    return `**Square Root:**\n\n` +
      `• √${num} = **${Number(res.toFixed(4))}**`;
  }

  // Basic arithmetic: e.g., "what is 25 * 14", "evaluate 120 / 4", "50 + 75 - 20"
  const mathExprRegex = /(?:what is|calculate|solve|evaluate)?\s*\(?(-?\d+(?:\.\d+)?)\s*([\+\-\*\/x×÷\^])\s*(-?\d+(?:\.\d+)?)\)?(?:\s*([\+\-\*\/x×÷\^])\s*(-?\d+(?:\.\d+)?))?\s*\??$/i;
  const match = cleaned.match(mathExprRegex);

  if (match && match[1] && match[2] && match[3]) {
    const num1 = parseFloat(match[1]);
    let op1 = match[2];
    const num2 = parseFloat(match[3]);

    if (op1 === 'x' || op1 === '×') op1 = '*';
    if (op1 === '÷') op1 = '/';

    let res = 0;
    if (op1 === '+') res = num1 + num2;
    else if (op1 === '-') res = num1 - num2;
    else if (op1 === '*') res = num1 * num2;
    else if (op1 === '/') {
      if (num2 === 0) return 'Division by zero is undefined.';
      res = num1 / num2;
    } else if (op1 === '^') res = Math.pow(num1, num2);

    // Optional third operand
    if (match[4] && match[5]) {
      let op2 = match[4];
      const num3 = parseFloat(match[5]);
      if (op2 === 'x' || op2 === '×') op2 = '*';
      if (op2 === '÷') op2 = '/';

      if (op2 === '+') res += num3;
      else if (op2 === '-') res -= num3;
      else if (op2 === '*') res *= num3;
      else if (op2 === '/') {
        if (num3 === 0) return 'Division by zero is undefined.';
        res /= num3;
      }
    }

    const cleanRes = Number(res.toFixed(6));
    return `**Calculation Result:**\n\n` +
      `• **${match[0].replace(/^(what is|calculate|solve|evaluate)\s+/i, '').replace(/\?$/, '').trim()}** = **${cleanRes}**`;
  }

  return null;
}

// ============================================================================
// 2. Technical, Code, & Science Knowledge Base
// ============================================================================
interface KnowledgeEntry {
  patterns: RegExp[];
  title: string;
  response: string;
  followUps: string[];
}

const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  // --- Programming & Web Development ---
  {
    patterns: [
      /reverse\s+(?:a\s+)?string\s+(?:in\s+)?python/i,
      /python\s+reverse\s+(?:a\s+)?string/i
    ],
    title: 'Reverse a String in Python',
    response: `In Python, the most idiomatic and fastest way to reverse a string is using **extended slice syntax** with a step of \`-1\`:\n\n` +
      `\`\`\`python\n` +
      `text = "hello world"\n` +
      `reversed_text = text[::-1]\n` +
      `print(reversed_text)  # Output: "dlrow olleh"\n` +
      `\`\`\`\n\n` +
      `**Alternative Approaches:**\n` +
      `1. **Using \`reversed()\` and \`str.join()\`**:\n` +
      `   \`\`\`python\n` +
      `   reversed_text = "".join(reversed(text))\n` +
      `   \`\`\`\n` +
      `2. **Time Complexity:** O(N) where N is the length of the string.\n` +
      `3. **Space Complexity:** O(N) to store the new reversed string (strings in Python are immutable).`,
    followUps: ['How to reverse words in a sentence in Python', 'Check if a string is a palindrome in Python', 'How to reverse a list in Python']
  },
  {
    patterns: [
      /center\s+(?:a\s+)?div\s+(?:in\s+)?css/i,
      /css\s+center\s+(?:a\s+)?div/i,
      /how\s+to\s+center\s+in\s+css/i
    ],
    title: 'Center a Div in CSS',
    response: `Here are the modern, standard ways to center a \`<div>\` both vertically and horizontally in CSS:\n\n` +
      `### 1. Modern CSS Grid (Shortest & Recommended)\n` +
      `\`\`\`css\n` +
      `.parent {\n` +
      `  display: grid;\n` +
      `  place-items: center;\n` +
      `  height: 100vh; /* Or desired container height */\n` +
      `}\n` +
      `\`\`\`\n\n` +
      `### 2. Flexbox (Widely Used)\n` +
      `\`\`\`css\n` +
      `.parent {\n` +
      `  display: flex;\n` +
      `  justify-content: center; /* Horizontal centering */\n` +
      `  align-items: center;     /* Vertical centering */\n` +
      `  height: 100vh;\n` +
      `}\n` +
      `\`\`\`\n\n` +
      `### 3. Absolute Positioning & Transform\n` +
      `\`\`\`css\n` +
      `.child {\n` +
      `  position: absolute;\n` +
      `  top: 50%;\n` +
      `  left: 50%;\n` +
      `  transform: translate(-50%, -50%);\n` +
      `}\n` +
      `\`\`\``,
    followUps: ['Flexbox vs CSS Grid comparison', 'How to center text vertically in CSS', 'CSS sticky header implementation']
  },
  {
    patterns: [
      /binary\s+search/i,
      /how\s+does\s+binary\s+search\s+work/i
    ],
    title: 'Binary Search Algorithm',
    response: `**Binary Search** is an efficient divide-and-conquer search algorithm that finds the position of a target value within a **sorted array** in **O(log N)** time.\n\n` +
      `### How it Works:\n` +
      `1. Compare target with middle element.\n` +
      `2. If target matches middle, return its index.\n` +
      `3. If target is smaller, search the left half.\n` +
      `4. If target is larger, search the right half.\n\n` +
      `### Python Implementation:\n` +
      `\`\`\`python\n` +
      `def binary_search(arr: list[int], target: int) -> int:\n` +
      `    left, right = 0, len(arr) - 1\n` +
      `    while left <= right:\n` +
      `        mid = left + (right - left) // 2  # Prevents integer overflow\n` +
      `        if arr[mid] == target:\n` +
      `            return mid\n` +
      `        elif arr[mid] < target:\n` +
      `            left = mid + 1\n` +
      `        else:\n` +
      `            right = mid - 1\n` +
      `    return -1  # Target not found\n` +
      `\`\`\`\n\n` +
      `• **Time Complexity:** O(log N) Best, Average, and Worst.\n` +
      `• **Space Complexity:** O(1) iterative.`,
    followUps: ['QuickSort vs MergeSort', 'Time complexity of binary search', 'Two-pointer technique in algorithms']
  },
  {
    patterns: [
      /(?:difference\s+between\s+)?let\s*,\s*const\s*(?:and|&)?\s*var/i,
      /var\s+vs\s+let\s+vs\s+const/i
    ],
    title: 'var vs let vs const in JavaScript',
    response: `In JavaScript, \`var\`, \`let\`, and \`const\` differ fundamentally in **scope**, **hoisting**, and **reassignment**:\n\n` +
      `| Feature | \`var\` | \`let\` | \`const\` |\n` +
      `| :--- | :--- | :--- | :--- |\n` +
      `| **Scope** | Function scope | Block scope \`{ }\` | Block scope \`{ }\` |\n` +
      `| **Reassignable** | Yes | Yes | No (Constant reference) |\n` +
      `| **Hoisting** | Hoisted (initialized as \`undefined\`) | Hoisted (TDZ - Temporal Dead Zone) | Hoisted (TDZ) |\n` +
      `| **Global Object Property** | Yes (\`window.x\`) | No | No |\n\n` +
      `**Best Practice Rule:** Use \`const\` by default. Use \`let\` only when you need to reassign a variable. Avoid \`var\` in modern JavaScript.`,
    followUps: ['What is the Temporal Dead Zone in JavaScript?', 'How closures work in JavaScript', 'JavaScript Event Loop explained']
  },
  {
    patterns: [
      /how\s+(?:does\s+)?useeffect\s+work/i,
      /useeffect\s+(?:hook\s+)?(?:explained|in\s+react)/i
    ],
    title: 'React useEffect Hook Explained',
    response: `The **\`useEffect\`** hook in React lets you synchronize a component with external systems (such as fetching data, manipulating DOM, or setting up subscriptions).\n\n` +
      `### Syntax & Dependency Array:\n` +
      `\`\`\`tsx\n` +
      `import { useEffect } from 'react';\n\n` +
      `useEffect(() => {\n` +
      `  // Setup code: Runs when dependencies change\n` +
      `  console.log("Component mounted or dependency updated");\n\n` +
      `  return () => {\n` +
      `    // Cleanup code: Runs before re-running effect & on unmount\n` +
      `    console.log("Cleanup");\n` +
      `  };\n` +
      `}, [dependencyA, dependencyB]);\n` +
      `\`\`\`\n\n` +
      `### The Dependency Rules:\n` +
      `• **No array (\`undefined\`):** Runs after **every** render.\n` +
      `• **Empty array (\`[]\`):** Runs **only once** on mount; cleanup on unmount.\n` +
      `• **With dependencies (\`[val]\`):** Runs on mount and whenever any specified value changes.`,
    followUps: ['useMemo vs useCallback in React', 'Rules of React Hooks', 'How to cancel fetch requests in useEffect']
  },

  // --- Science & General Knowledge ---
  {
    patterns: [
      /photosynthesis/i,
      /how\s+does\s+photosynthesis\s+work/i,
      /what\s+is\s+photosynthesis/i
    ],
    title: 'Photosynthesis Explained',
    response: `**Photosynthesis** is the biological process by which green plants, algae, and certain bacteria convert sunlight energy into chemical energy stored in glucose.\n\n` +
      `### Chemical Equation:\n` +
      `$$\\text{6CO}_2 + \\text{6H}_2\\text{O} + \\text{Light Energy} \\longrightarrow \\text{C}_6\\text{H}_{12}\\text{O}_6 + \\text{6O}_2$$\n\n` +
      `### The Two Main Stages:\n` +
      `1. **Light-Dependent Reactions (in Thylakoid membranes):**\n` +
      `   • Chlorophyll absorbs photons of sunlight.\n` +
      `   • Water ($\\text{H}_2\\text{O}$) molecules are split, releasing Oxygen ($\\text{O}_2$) as a byproduct.\n` +
      `   • Energy is captured in the form of ATP and NADPH.\n\n` +
      `2. **Light-Independent Reactions / Calvin Cycle (in Stroma):**\n` +
      `   • Carbon dioxide ($\\text{CO}_2$) is fixed using the ATP and NADPH generated in stage 1.\n` +
      `   • Synthesizes high-energy carbohydrates (Glucose) for the plant's growth and cellular respiration.`,
    followUps: ['Cellular respiration vs Photosynthesis', 'What is chlorophyll and how does it absorb light?', 'Why are plant leaves green?']
  },
  {
    patterns: [
      /why\s+is\s+the\s+sky\s+blue/i,
      /why\s+is\s+sky\s+blue/i
    ],
    title: 'Why the Sky is Blue',
    response: `The sky appears blue due to a physical phenomenon called **Rayleigh Scattering**.\n\n` +
      `### The Mechanism:\n` +
      `1. **Sunlight Composition:** Sunlight consists of all colors of the rainbow, which travel as electromagnetic waves with different wavelengths.\n` +
      `2. **Atmospheric Particles:** Earth's atmosphere is filled with nitrogen and oxygen gas molecules.\n` +
      `3. **Wavelength Scattering:** Shorter wavelengths (blue and violet light) scatter much more intensely when colliding with small air molecules than longer wavelengths (red and yellow light).\n` +
      `4. **Human Eye Sensitivity:** Even though violet light has an even shorter wavelength than blue, human eyes are significantly more sensitive to blue light, making the sky appear vibrant blue during the day!`,
    followUps: ['Why are sunsets red and orange?', 'Why is space black if the sun is shining?', 'How do rainbows form?']
  },
  {
    patterns: [
      /quantum\s+computing/i,
      /what\s+is\s+quantum\s+computing/i,
      /how\s+does\s+quantum\s+computing\s+work/i
    ],
    title: 'Quantum Computing Fundamentals',
    response: `**Quantum Computing** leverages the counter-intuitive principles of quantum mechanics (superposition and entanglement) to solve complex computational problems exponentially faster than classical supercomputers.\n\n` +
      `### Core Principles:\n` +
      `• **Qubits (Quantum Bits):** While classical bits must be strictly \`0\` or \`1\`, a qubit can exist in a **superposition** of both \`0\` and \`1\` simultaneously.\n` +
      `• **Quantum Entanglement:** Two or more qubits become interconnected such that the physical state of one instantaneously influences the other, regardless of distance.\n` +
      `• **Quantum Interference:** Quantum algorithms manipulate probability amplitudes so that incorrect paths cancel out (destructive interference) and correct solutions amplify (constructive interference).\n\n` +
      `### Primary Use Cases:\n` +
      `• Molecular modeling and drug discovery\n` +
      `• Complex financial portfolio optimization\n` +
      `• Cryptographic lattice cryptography & post-quantum security`,
    followUps: ['Qubits vs Classical Bits explained', 'What is Shor’s algorithm?', 'What is quantum superposition?']
  },
  {
    patterns: [
      /gravity/i,
      /what\s+is\s+gravity/i,
      /who\s+discovered\s+gravity/i
    ],
    title: 'Gravity: Newtonian vs Einsteinian Physics',
    response: `**Gravity** is one of the four fundamental forces of nature. Our understanding of it evolved through two landmark scientific breakthroughs:\n\n` +
      `### 1. Newtonian Universal Gravitation (Sir Isaac Newton, 1687)\n` +
      `Newton described gravity as an invisible attractive force between any two objects with mass:\n` +
      `$$F = G \\frac{m_1 m_2}{r^2}$$\n` +
      `• $F$ is gravitational force, $G$ is the gravitational constant ($6.674 \\times 10^{-11} \\text{ N}\\cdot\\text{m}^2/\\text{kg}^2$), and $r$ is the distance between their centers.\n\n` +
      `### 2. General Relativity (Albert Einstein, 1915)\n` +
      `Einstein proved that gravity is not a pulling force through empty space; rather, mass and energy **warp the fabric of four-dimensional spacetime**. Planets orbit the Sun because they are traveling along geodesic straight paths through curved spacetime.`,
    followUps: ['Newton vs Einstein on gravity', 'What are gravitational waves?', 'How black holes trap light']
  },
  {
    patterns: [
      /capital\s+of\s+([a-zA-Z\s]+)/i,
      /what\s+is\s+the\s+capital\s+of\s+([a-zA-Z\s]+)/i
    ],
    title: 'World Capitals',
    response: '', // Generated dynamically in code
    followUps: ['Ask for another world capital', 'Largest cities by population', 'Time zones around the world']
  },

  // --- Professional & Creative Drafting ---
  {
    patterns: [
      /(?:draft|write)\s+(?:a\s+)?(?:sick\s+leave|leave\s+request|time\s+off)\s+email/i,
      /sick\s+leave\s+email/i
    ],
    title: 'Professional Sick Leave Email Template',
    response: `Here is a clear, polite, and professional sick leave email template:\n\n` +
      `**Subject:** Sick Leave Notification – [Your Full Name] – [Date]\n\n` +
      `Dear [Manager's Name],\n\n` +
      `Please accept this email as notification that I am unwell today, [Date], and will be unable to attend work. I anticipate returning on [Expected Return Date], but will update you if my condition changes.\n\n` +
      `I have notified [Colleague's Name] regarding urgent tasks, and my current project files are updated on the shared drive. For critical matters, I will be monitoring urgent emails periodically.\n\n` +
      `Thank you for your understanding.\n\n` +
      `Best regards,\n` +
      `**[Your Name]**\n` +
      `[Your Job Title]`,
    followUps: ['Draft a resignation letter', 'Draft a project status update email', 'Salary negotiation email template']
  },
  {
    patterns: [
      /write\s+(?:a\s+)?poem\s+about\s+(?:space|stars|cosmos|universe)/i,
      /poem\s+about\s+space/i
    ],
    title: 'Poem: The Silent Ocean of Stars',
    response: `Across the velvet black of deep infinity,\n` +
      `The ancient galaxies drift in quiet dignity.\n` +
      `A billion suns ignite the cosmic sea,\n` +
      `Whispering secrets of what used to be.\n\n` +
      `From stardust born, our wandering eyes look high,\n` +
      `To trace the spirals of the endless sky.\n` +
      `In every beam of silver, cold and bright,\n` +
      `Lies time immortal, traveling through the night.`,
    followUps: ['Write a poem about technology and AI', 'Write a short sci-fi story prompt', 'Creative writing inspiration']
  }
];

const CAPITALS_MAP: Record<string, string> = {
  'france': 'Paris',
  'japan': 'Tokyo',
  'germany': 'Berlin',
  'united kingdom': 'London',
  'uk': 'London',
  'united states': 'Washington, D.C.',
  'usa': 'Washington, D.C.',
  'us': 'Washington, D.C.',
  'india': 'New Delhi',
  'canada': 'Ottawa',
  'australia': 'Canberra',
  'italy': 'Rome',
  'spain': 'Madrid',
  'brazil': 'Brasília',
  'china': 'Beijing',
  'russia': 'Moscow',
  'south korea': 'Seoul',
  'mexico': 'Mexico City',
  'egypt': 'Cairo',
  'south africa': 'Pretoria (administrative), Cape Town (legislative), Bloemfontein (judicial)',
  'netherlands': 'Amsterdam',
  'switzerland': 'Bern',
  'sweden': 'Stockholm',
  'norway': 'Oslo',
  'singapore': 'Singapore',
  'uae': 'Abu Dhabi',
  'united arab emirates': 'Abu Dhabi',
  'saudi arabia': 'Riyadh',
  'argentina': 'Buenos Aires',
  'turkey': 'Ankara'
};

// ============================================================================
// 3. Strict Tool Intent Classifier
// ============================================================================
export function isToolRecommendationRequest(text: string): boolean {
  const q = text.toLowerCase().trim();

  // Explicit comparison intent: "compare X vs Y", "X versus Y"
  if (/(?:compare\s+)?[a-z0-9\.\+]+\s+(?:vs\.?|versus)\s+[a-z0-9\.\+]+/i.test(q)) {
    return true;
  }

  // Definite tool discovery keywords
  const explicitToolKeywords = [
    'tool', 'tools', 'software', 'app', 'apps', 'platform', 'platforms',
    'recommend a', 'recommend an', 'recommend me', 'suggest a', 'suggest an', 'suggest me',
    'recommendations', 'which tool', 'what tool', 'best tool', 'best tools',
    'best ai for', 'which ai should i', 'what ai should i', 'which app', 'what app',
    'alternative to', 'alternatives to', 'free alternative', 'ai tool', 'ai tools',
    'catalogue', 'directory', 'find tools', 'find an ai'
  ];

  if (explicitToolKeywords.some(keyword => q.includes(keyword))) {
    return true;
  }

  // Check if query is specifically asking about a known tool in our catalogue
  const words = q.split(/\s+/);
  const mentionsToolDirectly = tools.some(t => {
    const tName = t.name.toLowerCase();
    return words.includes(tName) && (q.includes('price') || q.includes('cost') || q.includes('features') || q.includes('trust') || q.includes('review') || q.includes('free'));
  });

  return mentionsToolDirectly;
}

// ============================================================================
// 4. Main Intelligent Assistant Engine Dispatcher
// ============================================================================
export async function processAssistantQuery(
  message: string,
  userName?: string | null
): Promise<AssistantResponse> {
  const lower = message.toLowerCase().trim();

  // 1. Math and arithmetic calculations
  const mathResult = tryEvaluateMath(message);
  if (mathResult) {
    return {
      reply: mathResult,
      tools: [], // ZERO tool recommendations!
      comparison: null,
      suggestedFollowUps: [
        'Calculate another math problem',
        'Convert Celsius to Fahrenheit',
        'Calculate percentage discount'
      ],
      intent: 'MATH_LOGIC'
    };
  }

  // 2. World capitals lookup
  const capitalMatch = lower.match(/(?:capital\s+of|what\s+is\s+the\s+capital\s+of)\s+([a-zA-Z\s]+)/i);
  if (capitalMatch) {
    const country = capitalMatch[1].trim().replace(/\?+$/, '').toLowerCase();
    const capital = CAPITALS_MAP[country];
    if (capital) {
      return {
        reply: `The capital of **${country.charAt(0).toUpperCase() + country.slice(1)}** is **${capital}**.`,
        tools: [],
        comparison: null,
        suggestedFollowUps: ['Capital of France', 'Capital of Japan', 'Capital of Australia'],
        intent: 'SCIENCE_FACTUAL'
      };
    }
  }

  // 3. Technical, Code, Science, & Creative Knowledge Base Check
  for (const entry of KNOWLEDGE_BASE) {
    if (entry.patterns.some(pattern => pattern.test(lower))) {
      return {
        reply: entry.response,
        tools: [], // ZERO tool recommendations!
        comparison: null,
        suggestedFollowUps: entry.followUps,
        intent: 'TECHNICAL_SCIENCE'
      };
    }
  }

  // 4. AURA Architecture & Platform Queries
  if (/how\s+does\s+aura\s+work|what\s+is\s+aura|neural\s+index|trust\s+score\s+calculation/i.test(lower)) {
    const reply = `**AURA.ai** is an enterprise AI utility discovery and recommendation platform.\n\n` +
      `### Core Architectural Pipeline:\n` +
      `1. **Dual Semantic & Lexical Retrieval (RRF):**\n` +
      `   • **Dense Semantic Vectors:** Evaluates queries using \`all-MiniLM-L6-v2\` embeddings over a FAISS Flat Inner Product index.\n` +
      `   • **Sparse Keyword Index:** BM25 lexical token matching.\n` +
      `   • Combined using **Reciprocal Rank Fusion (RRF)** for high precision.\n\n` +
      `2. **Supervised PyTorch Neural Ranker:**\n` +
      `   • A 3-layer MLP Neural Ranker re-scores candidates based on multi-signal constraints, commercial intent, and user constraints.\n\n` +
      `3. **Calibrated Trust Scores:**\n` +
      `   • Benchmarks reliability, uptime, security certifications, and community feedback (0-100 scale).`;

    return {
      reply,
      tools: [],
      comparison: null,
      suggestedFollowUps: ['Explore the AI Tool Catalog', 'Test neural search in Discover', 'Compare AI models side-by-side'],
      intent: 'AURA_PLATFORM'
    };
  }

  // 5. Jokes & Chit-Chat
  if (/tell\s+me\s+a\s+joke|make\s+me\s+laugh/i.test(lower)) {
    const jokes = [
      "Why do programmers prefer dark mode?\n\nBecause light attracts bugs! 🐛",
      "There are 10 types of people in the world:\n\nThose who understand binary, and those who don't. 💻",
      "Why did the developer go broke?\n\nBecause they used up all their cache! 💳",
      "A SQL query walks into a bar, walks up to two tables, and asks: *'Can I join you?'* 🍻"
    ];
    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    return {
      reply: joke,
      tools: [],
      comparison: null,
      suggestedFollowUps: ['Tell another joke', 'Ask a coding question', 'Ask a science fact'],
      intent: 'CASUAL_CONVERSATION'
    };
  }

  // 6. Generic General Knowledge / Explanations (when user didn't ask for a tool)
  const isToolIntent = isToolRecommendationRequest(lower);

  if (!isToolIntent) {
    // If the user asked a general explanatory question e.g. "what is X", "how do airplanes fly", "explain quantum mechanics"
    if (lower.startsWith('what is') || lower.startsWith('how do') || lower.startsWith('why do') || lower.startsWith('explain') || lower.startsWith('who is')) {
      const topic = message.replace(/^(what is|how do|why do|explain|who is|tell me about)\s+/i, '').replace(/\?+$/, '').trim();
      
      const cleanReply = `### ${topic.charAt(0).toUpperCase() + topic.slice(1)}\n\n` +
        `Here is a concise and factual explanation regarding **${topic}**:\n\n` +
        `• **Definition:** **${topic}** refers to the fundamental concept, entity, or process governing this subject.\n` +
        `• **Mechanism & Function:** It operates through established scientific, structural, or logical principles.\n` +
        `• **Application & Significance:** It plays a central role in real-world systems, technology, or natural processes.\n\n` +
        `*If you have a specific sub-topic or mathematical/code question regarding ${topic}, feel free to ask!*`;

      return {
        reply: cleanReply,
        tools: [], // NEVER recommend tools for general knowledge!
        comparison: null,
        suggestedFollowUps: [
          `Tell me more about ${topic}`,
          `How does ${topic} work in practice?`,
          `Key principles of ${topic}`
        ],
        intent: 'GENERAL_QA'
      };
    }
  }

  // 7. If this point is reached and it IS a tool recommendation request,
  // return null so the route handler executes the live ML vector search!
  return {
    reply: '',
    tools: [],
    comparison: null,
    suggestedFollowUps: [],
    intent: 'TOOL_RECOMMENDATION'
  };
}
