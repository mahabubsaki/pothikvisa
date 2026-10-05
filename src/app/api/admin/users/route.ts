import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/currentAuth';
import { apiErrorResponse } from '@/lib/api-error';
import { getUsersForAdmin } from '@/lib/db';

export async function GET() {
  try {
    await requireAdminUser();
    return NextResponse.json({ success: true, users: getUsersForAdmin() });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'Failed to fetch users');
  }
}
