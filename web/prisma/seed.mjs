import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
const adapter = new PrismaLibSql({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting AURA catalog database seeding...');

  // Locate aura_tools.json
  const candidatePaths = [
    path.resolve(__dirname, '../../intelligence/data/processed/aura_tools.json'),
    path.resolve(__dirname, '../data/tools.json'),
  ];

  const toolsPath = candidatePaths.find((p) => fs.existsSync(p));
  if (!toolsPath) {
    console.warn('⚠️ aura_tools.json not found. Skipping catalog seeding.');
    return;
  }

  const raw = fs.readFileSync(toolsPath, 'utf-8');
  const catalog = JSON.parse(raw);
  console.log(`📦 Found ${catalog.length} verified AI tools to seed.`);

  let seededCount = 0;
  for (const item of catalog) {
    if (!item.id || !item.name) continue;

    await prisma.tool.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        category: item.category || 'AI Tool',
        description: item.description || '',
        url: item.url || null,
        pricing: item.pricing || 'Freemium',
        trustScore: typeof item.trustScore === 'number' ? item.trustScore : 80,
        verified: Boolean(item.verified),
        users: item.users || 'Not listed',
        tags: JSON.stringify(item.tags || []),
        keyFeatures: JSON.stringify(item.keyFeatures || []),
        useCases: JSON.stringify(item.useCases || []),
      },
      create: {
        id: item.id,
        name: item.name,
        category: item.category || 'AI Tool',
        description: item.description || '',
        url: item.url || null,
        pricing: item.pricing || 'Freemium',
        trustScore: typeof item.trustScore === 'number' ? item.trustScore : 80,
        verified: Boolean(item.verified),
        users: item.users || 'Not listed',
        tags: JSON.stringify(item.tags || []),
        keyFeatures: JSON.stringify(item.keyFeatures || []),
        useCases: JSON.stringify(item.useCases || []),
      },
    });
    seededCount++;
  }

  console.log(`✅ Successfully seeded ${seededCount} AI tools into the database.`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
