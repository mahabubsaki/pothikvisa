import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/currentAuth';
import { apiErrorResponse } from '@/lib/api-error';
import {
  approveAccount,
  getUserById,
  getUsersForAdmin,
  setUserTier,
  suspendAccount,
} from '@/lib/db';

const ACTIONS = ['approve', 'suspend', 'grant_free', 'grant_paid'] as const;
type UserAction = (typeof ACTIONS)[number];

export async function POST(request: Request) {
  try {
    const admin = await requireAdminUser();
    const body = await request.json() as { action?: string; userId?: string };
    const action = body.action as UserAction;
    const userId = body.userId?.trim();

    if (!userId || !ACTIONS.includes(action)) {
      return NextResponse.json({ error: 'A valid user and action are required' }, { status: 400 });
    }
    if (userId === admin.id && action === 'suspend') {
      return NextResponse.json({ error: 'You cannot suspend your own account' }, { status: 400 });
    }

    const target = getUserById(userId);
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'suspend') {
      suspendAccount(userId, admin.id);
    } else {
      if (target.account_status !== 'approved') {
        approveAccount(userId, admin.id);
      }
      if (action === 'grant_free') setUserTier(userId, 'free', admin.id);
      if (action === 'grant_paid') setUserTier(userId, 'paid', admin.id);
    }

    const user = getUsersForAdmin().find((record) => record.id === userId);
    return NextResponse.json({ success: true, user });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'Failed to update user access');
  }
}
