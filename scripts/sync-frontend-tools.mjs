import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceCandidates = [
  path.join(projectRoot, 'intelligence', 'data', 'processed', 'aura_tools.json'),
  path.join(projectRoot, 'data', 'processed', 'aura_tools.json'),
  path.join(projectRoot, 'aiml', 'data', 'processed', 'aura_tools.json'),
];
const sourcePath = sourceCandidates.find((p) => fs.existsSync(p)) || sourceCandidates[0];

const targetCandidates = [
  path.join(projectRoot, 'web', 'src', 'data', 'tools.ts'),
  path.join(projectRoot, 'app', 'src', 'data', 'tools.ts'),
  path.join(projectRoot, 'src', 'data', 'tools.ts'),
  path.join(projectRoot, 'AURA.ai', 'src', 'data', 'tools.ts'),
];
const targetPath = targetCandidates.find((p) => fs.existsSync(p)) || targetCandidates[0];
const sourceTools = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

const tools = sourceTools.map((tool) => ({
  ...tool,
  pricing: tool.pricing === 'Paid' ? 'Premium' : (tool.pricing || 'Freemium'),
  icon: tool.icon || `https://www.google.com/s2/favicons?domain=${new URL(tool.url).hostname}&sz=128`,
  trustScore: typeof tool.trustScore === 'number' ? tool.trustScore : 80,
  users: tool.users || 'Not publicly listed',
  tags: Array.isArray(tool.tags) ? tool.tags : [],
  verified: Boolean(tool.verified),
}));

fs.writeFileSync(sourcePath, `${JSON.stringify(tools, null, 2)}\n`);

const output = `// Generated from intelligence/data/processed/aura_tools.json. Run scripts/sync-frontend-tools.mjs after dataset changes.\n\nimport type { Tool, ToolCategory } from '@/lib/site';\n\nexport const tools: Tool[] = ${JSON.stringify(tools, null, 2)};\n\nexport function getToolById(id: string): Tool | undefined {\n  return tools.find((tool) => tool.id === id);\n}\n\nexport function getToolsByCategory(category: ToolCategory): Tool[] {\n  return tools.filter((tool) => tool.category === category);\n}\n\nexport function getToolsByPricing(pricing: Tool['pricing']): Tool[] {\n  return tools.filter((tool) => tool.pricing === pricing);\n}\n\nexport function getVerifiedTools(): Tool[] {\n  return tools.filter((tool) => tool.verified);\n}\n\nexport function getTrendingTools(limit = 10): Tool[] {\n  return tools\n    .filter((tool) => tool.trustScore >= 96)\n    .sort((first, second) => second.trustScore - first.trustScore)\n    .slice(0, limit);\n}\n\nexport function searchTools(query: string): Tool[] {\n  const lowerQuery = query.toLowerCase();\n  return tools.filter((tool) =>\n    tool.name.toLowerCase().includes(lowerQuery) ||\n    tool.description.toLowerCase().includes(lowerQuery) ||\n    tool.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||\n    tool.category.toLowerCase().includes(lowerQuery)\n  );\n}\n\nexport function getCategories(): { key: ToolCategory; count: number }[] {\n  const counts = tools.reduce((acc, tool) => {\n    acc[tool.category] = (acc[tool.category] || 0) + 1;\n    return acc;\n  }, {} as Record<string, number>);\n\n  return Object.entries(counts).map(([key, count]) => ({ key, count }));\n}\n`;

fs.writeFileSync(targetPath, output);
console.log(`Synchronized ${tools.length} tools to ${targetPath}`);