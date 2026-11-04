import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ savedTools: [] });
    }

    const saved = await prisma.savedTool.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: { toolId: true, createdAt: true },
    });

    return NextResponse.json({
      savedTools: saved.map((s) => s.toolId),
      items: saved,
    });
  } catch (error: any) {
    console.error('[saved:GET] Error fetching saved tools:', error);
    return NextResponse.json({ error: 'Failed to fetch saved tools' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required to save tools to account' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const toolId = typeof body?.toolId === 'string' ? body.toolId.trim() : '';

    if (!toolId) {
      return NextResponse.json({ error: 'Valid toolId is required' }, { status: 400 });
    }

    const userId = session.user.id;

    // Check if already saved
    const existing = await prisma.savedTool.findUnique({
      where: {
        userId_toolId: {
          userId,
          toolId,
        },
      },
    });

    if (existing) {
      // Remove from saved
      await prisma.savedTool.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ saved: false, toolId, message: 'Removed from saved tools' });
    } else {
      // Add to saved
      await prisma.savedTool.create({
        data: {
          userId,
          toolId,
        },
      });
      return NextResponse.json({ saved: true, toolId, message: 'Added to saved tools' });
    }
  } catch (error: any) {
    console.error('[saved:POST] Error toggling tool bookmark:', error);
    return NextResponse.json({ error: 'Failed to update saved tool' }, { status: 500 });
  }
}

