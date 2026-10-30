import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { tools } from '@/data/tools';

export const runtime = 'nodejs';

export async function GET() {
  const session = await auth();
  if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized. Admin privileges required.' }, { status: 403 });
  }

  try {
    const [userCount, adminCount, reviewCount, savedCount, recentReviews] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.review.count(),
      prisma.savedTool.count(),
      prisma.review.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true, email: true, role: true },
          },
        },
      }),
    ]);

    // Group tools by category
    const categoryCounts: Record<string, number> = {};
    for (const tool of tools) {
      categoryCounts[tool.category] = (categoryCounts[tool.category] || 0) + 1;
    }

    return NextResponse.json({
      metrics: {
        totalUsers: userCount,
        adminUsers: adminCount,
        regularUsers: Math.max(0, userCount - adminCount),
        totalReviews: reviewCount,
        totalSavedBookmarks: savedCount,
        catalogToolCount: tools.length,
        categoriesCount: Object.keys(categoryCounts).length,
      },
      categoryBreakdown: categoryCounts,
      recentReviews,
      engine: {
        model: 'all-MiniLM-L6-v2',
        dimension: 384,
        indexType: 'FAISS FlatIP Cosine',
        latencyTargetMs: 40,
        status: 'OPERATIONAL',
      },
    });
  } catch (error) {
    console.error('[admin/stats] Error loading telemetry:', error);
    return NextResponse.json({ error: 'Failed to load system metrics' }, { status: 500 });
  }
}
