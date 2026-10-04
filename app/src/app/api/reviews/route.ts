import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const toolId = searchParams.get('toolId');

    if (!toolId) {
      return NextResponse.json({ error: 'toolId query parameter is required' }, { status: 400 });
    }

    const reviews = await prisma.review.findMany({
      where: { toolId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const totalReviews = reviews.length;
    let averageRating = 0;
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    if (totalReviews > 0) {
      const sum = reviews.reduce((acc, r) => {
        const rating = Math.min(5, Math.max(1, r.rating)) as 1 | 2 | 3 | 4 | 5;
        breakdown[rating] = (breakdown[rating] || 0) + 1;
        return acc + r.rating;
      }, 0);
      averageRating = Number((sum / totalReviews).toFixed(1));
    }

    return NextResponse.json({
      reviews,
      stats: {
        totalReviews,
        averageRating,
        breakdown,
      },
    });
  } catch (error: any) {
    console.error('[reviews:GET] Error fetching reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to submit a review.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { toolId, rating, comment } = body;

    if (!toolId || typeof toolId !== 'string') {
      return NextResponse.json({ error: 'Valid toolId is required' }, { status: 400 });
    }

    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return NextResponse.json({ error: 'Rating must be an integer between 1 and 5' }, { status: 400 });
    }

    if (!comment || typeof comment !== 'string' || comment.trim().length < 5) {
      return NextResponse.json(
        { error: 'Please write a thoughtful review of at least 5 characters' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const userName = session.user.name || session.user.email?.split('@')[0] || 'Community Member';
    const userImage = session.user.image || null;

    // Check if user already reviewed this tool
    const existing = await prisma.review.findFirst({
      where: { toolId, userId },
    });

    let review;
    if (existing) {
      review = await prisma.review.update({
        where: { id: existing.id },
        data: {
          rating: Math.round(numericRating),
          comment: comment.trim(),
          userName,
          userImage,
        },
      });
    } else {
      review = await prisma.review.create({
        data: {
          toolId,
          userId,
          userName,
          userImage,
          rating: Math.round(numericRating),
          comment: comment.trim(),
        },
      });
    }

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    console.error('[reviews:POST] Error submitting review:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
