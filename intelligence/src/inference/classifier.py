"""AURA Domain Intent Classification Engine (Python Engine).

Classifies natural language queries into 9 structured AURA intents with strict domain guardrails:
- TOOL_DISCOVERY
- TOOL_COMPARISON
- WORKFLOW_DESIGN
- PROMPT_ENGINEERING
- TOOL_ALTERNATIVES
- TOOL_EVALUATION
- AI_TOOL_GUIDANCE
- OUT_OF_SCOPE
- CLARIFICATION_REQUIRED
"""
import re
import json
from pathlib import Path
from typing import Any, Dict, List, Optional

# Load catalog tool names for entity extraction
_TOOLS_CACHE: List[Dict[str, Any]] = []
_CATALOG_NAMES: Dict[str, str] = {}


def _get_catalog_names() -> Dict[str, str]:
    global _CATALOG_NAMES, _TOOLS_CACHE
    if not _CATALOG_NAMES:
        tools_path = Path(__file__).resolve().parent.parent.parent / "data" / "processed" / "aura_tools.json"
        if tools_path.exists():
            with open(tools_path, "r", encoding="utf-8") as f:
                _TOOLS_CACHE = json.load(f)
            for t in _TOOLS_CACHE:
                _CATALOG_NAMES[t["name"].lower()] = t["name"]
                _CATALOG_NAMES[t["id"].lower()] = t["name"]

        # Additional foundational models and aliases
        aliases = {
            "chatgpt": "ChatGPT",
            "chatgpt plus": "ChatGPT Plus",
            "gpt-4": "GPT-4",
            "gpt-4o": "GPT-4o",
            "claude": "Claude",
            "claude 3": "Claude",
            "claude 3.5": "Claude",
            "claude 3.5 sonnet": "Claude",
            "gemini": "Google Gemini",
            "google gemini": "Google Gemini",
            "midjourney": "Midjourney",
            "midjourney v6": "Midjourney",
            "dall-e": "DALL-E",
            "dalle": "DALL-E",
            "stable diffusion": "Stable Diffusion",
            "flux": "FLUX",
            "copilot": "GitHub Copilot",
            "github copilot": "GitHub Copilot",
            "cursor": "Cursor",
            "v0": "v0 by Vercel",
            "v0 by vercel": "v0 by Vercel",
            "bolt": "Bolt.new",
            "bolt.new": "Bolt.new",
            "runway": "Runway",
            "runway gen-3": "Runway",
            "pika": "Pika",
            "kling": "Kling AI",
            "sora": "Sora",
            "elevenlabs": "ElevenLabs",
            "suno": "Suno",
            "suno ai": "Suno",
            "udio": "Udio",
            "perplexity": "Perplexity AI",
            "perplexity ai": "Perplexity AI",
            "perplexity pro": "Perplexity AI",
            "notion ai": "Notion AI",
            "descript": "Descript",
            "gamma": "Gamma",
            "beautiful.ai": "Beautiful.ai",
            "jasper": "Jasper",
            "copy.ai": "Copy.ai",
            "canva": "Canva AI",
            "canva ai": "Canva AI",
            "photoroom": "Photoroom",
            "remove.bg": "Remove.bg",
            "ollama": "Ollama",
            "lm studio": "LM Studio",
            "capcut": "CapCut",
            "fireflies.ai": "Fireflies.ai",
            "otter.ai": "Otter.ai",
            "synthesia": "Synthesia",
            "heygen": "HeyGen",
        }
        for alias, canon in aliases.items():
            if alias not in _CATALOG_NAMES:
                _CATALOG_NAMES[alias] = canon
    return _CATALOG_NAMES


OUT_OF_SCOPE_PATTERNS = [
    # Raw math / arithmetic (e.g. 25 * 14, 15% of 240, solve ...)
    r"^\s*(?:what\s+is|solve|calculate|evaluate)?\s*\(?-?\d+(?:\.\d+)?\s*[\+\-\*\/x×÷\^]\s*-?\d+(?:\.\d+)?(?:\s*[\+\-\*\/x×÷\^]\s*-?\d+(?:\.\d+)?)?\s*\??\s*$",
    r"^\s*(?:what\s+is\s+|calculate\s+)?\d+(?:\.\d+)?\s*%\s*of\s*\d+(?:\.\d+)?\s*\??\s*$",
    r"^\s*(?:convert\s+)?-?\d+(?:\.\d+)?\s*(?:°|degrees?\s*)?[cf]\s*(?:to|in)\s*(?:°|degrees?\s*)?[cf]\s*\??\s*$",
    r"^\s*(?:square\s+root\s+of|sqrt\()\s*\d+(?:\.\d+)?\)?\s*\??\s*$",
    r"\b\d+\s*(?:multiplied\s+by|divided\s+by|times|plus|minus)\s*\d+\b",

    # General science / biology / physics / chemistry trivia without tool context
    r"^(?:what\s+is|explain)\s+(?:photosynthesis|mitosis|osmosis|gravity|newton'?s\s+(?:third\s+)?laws?|quantum\s+physics|thermodynamics|relativity|evolution|dna|cellular\s+respiration)\b(?!\s+(?:tool|app|software|platform|model))",
    r"\bhow\s+do\s+plants\s+(?:make\s+food|convert\s+sunlight)\b",
    r"\bnewton'?s\s+(?:first|second|third|laws?)\b",

    # Geography / history / facts
    r"^(?:what\s+is|who\s+is|where\s+is)\s+the\s+(?:capital|president|population|currency|founder)\s+of\b",

    # General programming syntax tutorials without AI tool context
    r"^(?:teach\s+me|how\s+to\s+code\s+in|how\s+to\s+program\s+in)\s+(?:python|javascript|java|c\+\+|rust|html|css|golang)\b(?!\s+(?:tool|app|software))",
    r"^(?:teach\s+me)\s+(?:python|javascript|coding|programming)\s+(?:from\s+scratch|basics?|syntax|loops?|functions?)\b",
    r"^(?:how\s+to|write\s+code\s+to|write\s+a\s+python\s+script\s+to)\s+reverse\s+(?:a\s+)?string\b",
    r"^(?:how\s+to|how\s+do\s+i)\s+center\s+(?:a\s+)?div\s+in\s+css\b",

    # Creative fiction / jokes / poetry / general essays
    r"^(?:tell\s+me\s+a\s+joke|tell\s+me\s+a\s+funny\s+knock\s+knock\s+joke|make\s+me\s+laugh)\b",
    r"^(?:write|compose)\s+(?:me\s+)?(?:an?\s+)?(?:birthday\s+poem|love\s+letter|bedtime\s+story|song\s+lyrics|rap|fiction|essay)\b(?!\s+(?:tool|app|software))",

    # Abstract academic definitions
    r"^(?:what\s+is|define)\s+(?:machine\s+learning|deep\s+learning|artificial\s+intelligence|neural\s+network|rag|reinforcement\s+learning)\??$",
]

AI_TOOL_INDICATORS = [
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
]


def extract_entities(text: str) -> List[str]:
    """Extract recognized tool names from text."""
    catalog = _get_catalog_names()
    normalized = text.lower()
    matched = set()

    sorted_names = sorted(catalog.keys(), key=lambda x: len(x), reverse=True)
    for name in sorted_names:
        escaped = re.escape(name)
        if re.search(rf"(^|[^a-z0-9]){escaped}([^a-z0-9]|$)", normalized, re.IGNORECASE):
            matched.add(catalog[name])

    return list(matched)


def extract_constraints(text: str) -> Dict[str, Any]:
    """Extract budget, platform, and use case constraints."""
    lower = text.lower()
    constraints: Dict[str, Any] = {}

    # Budget
    if any(k in lower for k in ['open source', 'opensource', 'self-hosted', 'self hosted']):
        constraints['budget'] = 'opensource'
    elif any(k in lower for k in ['free', '$0', 'no cost', 'without paying', 'no credit card', 'gratis']):
        constraints['budget'] = 'free'
    elif any(k in lower for k in ['paid', 'subscription', 'premium', 'enterprise', 'commercial license', 'pro plan']):
        constraints['budget'] = 'paid'
    elif 'freemium' in lower:
        constraints['budget'] = 'freemium'

    # Platform
    if any(k in lower for k in ['mac', 'macos', 'apple silicon']):
        constraints['platform'] = 'mac'
    elif any(k in lower for k in ['windows', 'pc']):
        constraints['platform'] = 'windows'
    elif any(k in lower for k in ['linux', 'ubuntu']):
        constraints['platform'] = 'linux'
    elif any(k in lower for k in ['local', 'offline', 'on-device', 'run locally']):
        constraints['platform'] = 'local'
    elif any(k in lower for k in ['api', 'sdk']):
        constraints['platform'] = 'api'
    elif any(k in lower for k in ['web', 'browser', 'online']):
        constraints['platform'] = 'web'

    # Use cases
    use_case_patterns = [
        (r"video\s+edit(?:ing)?|edit\s+video|cut\s+clips?|youtube\s+video", 'video editing'),
        (r"text\s*to\s*video|generate\s+video|ai\s+video\s+gen", 'video generation'),
        (r"slide\s*deck|presentation|slides?|ppt|powerpoint", 'presentation & slide deck design'),
        (r"code\s+assistant|coding|autocomplete|ide|developer|debug", 'coding & development'),
        (r"voice\s*over|tts|text\s*to\s*speech|voice\s+clon", 'voiceover & audio generation'),
        (r"transcription|audio\s*to\s*text|meeting\s+notes|transcribe", 'audio transcription & meeting notes'),
        (r"image\s+gen(?:eration)?|generate\s+images?|text\s*to\s*image|midjourney|flux", 'image generation'),
        (r"image\s+edit(?:ing)?|remove\s+bg|background\s+remov|upscal", 'image editing & cleanup'),
        (r"content\s+creation|social\s+media|copywriting|blog\s+writing", 'content creation & marketing'),
        (r"website\s+builder|build\s+website|landing\s+page", 'website building & UI generation'),
        (r"data\s+analysis|analytics|spreadsheets?|excel|csv", 'data analysis & spreadsheets'),
        (r"knowledge\s*base|rag|internal\s+docs|second\s+brain", 'knowledge base & document search'),
    ]

    for pattern, label in use_case_patterns:
        if re.search(pattern, lower, re.IGNORECASE):
            constraints['useCase'] = label
            break

    return constraints


def classify_aura_intent(
    query: str,
    context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Classifies natural language queries with strict domain boundaries."""
    trimmed = query.strip()
    lower = trimmed.lower()

    if not trimmed:
        return {
            "intent": "CLARIFICATION_REQUIRED",
            "confidence": 1.0,
            "inScope": True,
            "entities": [],
            "constraints": {},
            "clarificationNeeded": True,
            "reasoning": "Empty input query.",
        }

    entities = extract_entities(trimmed)
    constraints = extract_constraints(trimmed)

    # Incorporate previous tools from context if available
    prev_tools = context.get("previous_tools", []) if context else []
    active_uc = context.get("active_use_case") if context else None

    # 1. Strict Out-of-Scope Patterns
    for pattern in OUT_OF_SCOPE_PATTERNS:
        if re.search(pattern, trimmed, re.IGNORECASE):
            has_tool_context = any(w in lower for w in ['ai tool', 'ai tools', 'ai app', 'which tool', 'best tool', 'tools to'])
            if not has_tool_context:
                return {
                    "intent": "OUT_OF_SCOPE",
                    "confidence": 0.98,
                    "inScope": False,
                    "entities": entities,
                    "constraints": constraints,
                    "clarificationNeeded": False,
                    "reasoning": "Query matches general knowledge, educational tutorial, or arithmetic pattern.",
                }

    # Raw math heuristic
    if (re.match(r"^[\d\s\+\-\*\/\(\)\^\.\%x×÷]+$", trimmed) or "multiplied by" in lower or "divided by" in lower) and not any(w in lower for w in ['tool', 'model']):
        return {
            "intent": "OUT_OF_SCOPE",
            "confidence": 0.99,
            "inScope": False,
            "entities": entities,
            "constraints": constraints,
            "clarificationNeeded": False,
            "reasoning": "Raw mathematical calculation without AI context.",
        }

    # 2. Vague / Under-specified
    single_word = re.sub(r"[^a-z0-9]", "", lower)
    if (len(single_word) <= 4 and single_word in ['ai', 'tool', 'apps', 'help', 'best', 'find', 'make', 'work']) or \
       re.match(r"^(?:recommend|suggest|show\s+me|give\s+me|i\s+need|tools?|ai\s+tools?)\s*$", trimmed, re.IGNORECASE):
        if not entities and not active_uc:
            return {
                "intent": "CLARIFICATION_REQUIRED",
                "confidence": 0.95,
                "inScope": True,
                "entities": entities,
                "constraints": constraints,
                "clarificationNeeded": True,
                "reasoning": "Query is underspecified.",
            }

    # Clean query for 'vs' to protect 'vs code'
    clean_for_vs = re.sub(r"\bvs\s*code\b", "vscode", lower)

    # 3. Multi-turn reference resolution
    if context:
        if active_uc or prev_tools:
            if re.match(r"^(?:only\s+free\s+ones?|free\s+only|make\s+them\s+free|show\s+only\s+free|paid\s+options?|open\s*source\s+only|what\s+about\s+open\s*source\s+options\??|for\s+mac\s+only|show\s+paid\s+plans.*|are\s+there\s+any\s+that\s+don't\s+add\s+watermarks\??)$", trimmed, re.IGNORECASE):
                return {
                    "intent": "TOOL_DISCOVERY",
                    "confidence": 0.95,
                    "inScope": True,
                    "entities": prev_tools,
                    "constraints": {**constraints, "useCase": active_uc},
                    "clarificationNeeded": False,
                    "reasoning": "Multi-turn constraint refinement on previous discovery.",
                }
            if re.search(r"\b(?:workflow|build|chain|combine|connecting\s+them)\b", lower) and re.search(r"\b(?:first\s+two|both\s+of\s+them|these\s+two|combine\s+them|automation\s+pipeline|them)\b", lower):
                return {
                    "intent": "WORKFLOW_DESIGN",
                    "confidence": 0.94,
                    "inScope": True,
                    "entities": prev_tools[:2],
                    "constraints": constraints,
                    "clarificationNeeded": False,
                    "reasoning": "Multi-turn workflow construction referencing previous tools.",
                }
            if re.search(r"\balternatives?\s+to\s+(?:the\s+)?first\s+one\b", lower):
                return {
                    "intent": "TOOL_ALTERNATIVES",
                    "confidence": 0.95,
                    "inScope": True,
                    "entities": prev_tools[:1],
                    "constraints": constraints,
                    "clarificationNeeded": False,
                    "reasoning": "Multi-turn alternative request for previously recommended tool.",
                }
            if re.search(r"\b(?:compare\s+(?:them|the\s+top\s+two|these\s+two)|which\s+of\s+these\s+two|can\s+both\s+of\s+them)\b", lower):
                return {
                    "intent": "TOOL_COMPARISON",
                    "confidence": 0.95,
                    "inScope": True,
                    "entities": prev_tools[:2],
                    "constraints": constraints,
                    "clarificationNeeded": False,
                    "reasoning": "Multi-turn comparison of previously recommended tools.",
                }
            if re.search(r"\b(?:how\s+much\s+does\s+the\s+second|cost\s+of\s+the\s+second|review\s+the\s+first)\b", lower):
                return {
                    "intent": "TOOL_EVALUATION",
                    "confidence": 0.94,
                    "inScope": True,
                    "entities": prev_tools[1:2] if len(prev_tools) >= 2 else prev_tools[:1],
                    "constraints": constraints,
                    "clarificationNeeded": False,
                    "reasoning": "Multi-turn evaluation of specific previously recommended tool.",
                }
            if re.search(r"\b(?:prompts?\s+for\s+it|suggest\s+tested\s+prompts)\b", lower):
                return {
                    "intent": "PROMPT_ENGINEERING",
                    "confidence": 0.95,
                    "inScope": True,
                    "entities": prev_tools[:1],
                    "constraints": constraints,
                    "clarificationNeeded": False,
                    "reasoning": "Multi-turn prompt request for previously recommended tool.",
                }

    # 4. Explicit Comparison
    is_comparison = bool(
        re.search(r"\b(?:compare|comparison|versus|\bvs\.?(?!\s*code\b)|diff(?:erence)?\s+between)\b", clean_for_vs, re.IGNORECASE) or
        (len(entities) >= 2 and re.search(r"\b(?:or|and|with)\b", lower) and re.search(r"\b(?:better|recommend|choose|which\s+one)\b", lower))
    )
    if is_comparison or (len(entities) >= 2 and re.search(r"\bvs\.?(?!\s*code\b)\b", clean_for_vs)):
        return {
            "intent": "TOOL_COMPARISON",
            "confidence": 0.95,
            "inScope": True,
            "entities": entities,
            "constraints": constraints,
            "clarificationNeeded": False,
            "reasoning": "Tool comparison request.",
        }

    # 5. Explicit Alternatives
    is_alt = bool(
        re.search(r"\b(?:alternative|alternatives|replacement|replacements|competitor|competitors|similar\s+to|substitute)\b", lower) or
        re.search(r"\b(?:instead\s+of)\s+([a-z0-9\s]+)", lower) or
        re.search(r"\bcheaper\s+alternatives?\b", lower)
    )
    if is_alt and (entities or "tools like" in lower or "alternatives to" in lower):
        return {
            "intent": "TOOL_ALTERNATIVES",
            "confidence": 0.94,
            "inScope": True,
            "entities": entities,
            "constraints": constraints,
            "clarificationNeeded": False,
            "reasoning": "Tool alternatives request.",
        }

    # 6. Tool Evaluation
    is_eval = bool(
        re.search(r"\b(?:evaluate|evaluation|review|trust\s*score|pros?\s+and\s+cons?|is\s+[a-z0-9\s]+\s+worth\s+it|worth\s+(?:it|the)|is\s+[a-z0-9\s]+\s+safe|pricing\s+of|reliability\s+of)\b", lower)
    )
    if is_eval and (entities or prev_tools):
        return {
            "intent": "TOOL_EVALUATION",
            "confidence": 0.91,
            "inScope": True,
            "entities": entities,
            "constraints": constraints,
            "clarificationNeeded": False,
            "reasoning": "Tool evaluation request.",
        }

    # 7. Workflow Design
    is_workflow = bool(
        re.search(r"\b(?:workflow|pipeline|automate\s+(?:customer|content|social|seo|blog|support|ticket|legal)|automation\s+pipeline|chain\s+.*?\btools|combine\s+.*?\btools|combination\s+of\s+.*?\btools|multi-tool|stack\s+(?:of|for)|ai\s+stack|process\s+to\s+automate)\b", lower)
    )
    is_just_tool_discovery = bool(re.search(r"\b(?:automation\s+utilities|automation\s+tools?|spreadsheet\s+formulas?)\b", lower))

    if is_workflow and not is_just_tool_discovery:
        return {
            "intent": "WORKFLOW_DESIGN",
            "confidence": 0.92,
            "inScope": True,
            "entities": entities,
            "constraints": constraints,
            "clarificationNeeded": False,
            "reasoning": "Workflow design request.",
        }

    # 8. Prompt Engineering
    if re.search(r"\b(?:prompt|prompts|prompting|prompt\s+engineering|optimize\s+(?:my\s+)?prompt|craft\s+(?:a\s+)?prompt|prompt\s+template)\b", lower):
        return {
            "intent": "PROMPT_ENGINEERING",
            "confidence": 0.95,
            "inScope": True,
            "entities": entities,
            "constraints": constraints,
            "clarificationNeeded": False,
            "reasoning": "Prompt engineering request.",
        }

    # 9. Explicit Discovery with 'which tools / find tools'
    if re.search(r"\b(?:which\s+tools?|find\s+tools?|recommend\s+tools?)\b", lower):
        return {
            "intent": "TOOL_DISCOVERY",
            "confidence": 0.92,
            "inScope": True,
            "entities": entities,
            "constraints": constraints,
            "clarificationNeeded": False,
            "reasoning": "Direct tool discovery query.",
        }

    # 10. AI Tool Guidance
    is_guidance = bool(
        re.search(r"\b(?:how\s+to\s+choose|how\s+to\s+select|guide\s+me|what\s+should\s+i\s+use)\b", lower) or
        ("in the context of" in lower and any(w in lower for w in ['platform', 'tool', 'software', 'selection'])) or
        ("tools to help me learn" in lower or "tools that can help me learn" in lower or "tools can help me learn" in lower)
    )
    if is_guidance:
        return {
            "intent": "AI_TOOL_GUIDANCE",
            "confidence": 0.90,
            "inScope": True,
            "entities": entities,
            "constraints": constraints,
            "clarificationNeeded": False,
            "reasoning": "AI tool guidance request.",
        }

    # 11. TOOL_DISCOVERY (Implicit discovery)
    is_discovery = bool(
        constraints.get("useCase") or
        constraints.get("budget") or
        constraints.get("platform") or
        any(w in lower for w in AI_TOOL_INDICATORS) or
        re.search(r"\b(?:find|search|recommend|suggest|need|looking\s+for|best|top|good)\b", lower)
    )
    if is_discovery:
        return {
            "intent": "TOOL_DISCOVERY",
            "confidence": 0.88,
            "inScope": True,
            "entities": entities,
            "constraints": constraints,
            "clarificationNeeded": False,
            "reasoning": "Implicit AI tool discovery request.",
        }

    # 12. Final Fallback: Non-AI query rejection
    mentions_ai = bool(re.search(r"\b(?:ai|artificial\s+intelligence|llm|gpt|neural|model|bot|automation|generative)\b", lower))
    if not mentions_ai and not entities:
        return {
            "intent": "OUT_OF_SCOPE",
            "confidence": 0.85,
            "inScope": False,
            "entities": [],
            "constraints": {},
            "clarificationNeeded": False,
            "reasoning": "Query lacks AI platform context.",
        }

    return {
        "intent": "TOOL_DISCOVERY",
        "confidence": 0.75,
        "inScope": True,
        "entities": entities,
        "constraints": constraints,
        "clarificationNeeded": False,
        "reasoning": "General AI discovery query.",
    }
