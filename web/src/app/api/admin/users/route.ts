import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

async function checkAdmin() {
  const session = await auth();
  if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
    return false;
  }
  return session;
}

// GET /api/admin/users - List all registered users
export async function GET() {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized. Admin privileges required.' }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            reviews: true,
            savedTools: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('[admin/users] Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// PATCH /api/admin/users - Update user role
export async function PATCH(request: NextRequest) {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized. Admin privileges required.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !['USER', 'ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Invalid user ID or role specified' }, { status: 400 });
    }

    // Prevent admin from accidentally demoting themselves if they are the current user
    if (userId === session.user.id && role !== 'ADMIN') {
      return NextResponse.json({ error: 'You cannot revoke your own administrator status.' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({ message: 'User role updated successfully', user: updatedUser });
  } catch (error) {
    console.error('[admin/users] Error updating role:', error);
    return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
  }
}

// DELETE /api/admin/users - Remove user
export async function DELETE(request: NextRequest) {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized. Admin privileges required.' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (userId === session.user.id) {
      return NextResponse.json({ error: 'You cannot delete your own account from the admin console.' }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: 'User account deleted successfully' });
  } catch (error) {
    console.error('[admin/users] Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
