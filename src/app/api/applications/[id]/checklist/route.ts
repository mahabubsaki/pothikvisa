import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/currentAuth';
import { getApplicationById } from '@/lib/db';
import { getIvacChecklistData } from '@/lib/ivacChecklist';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await getAuthenticatedUser();
    if (!profile) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { id } = await params;
    const application = getApplicationById(id);
    if (!application) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }

    if (application.user_id !== profile.id && profile.role !== 'admin') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const host = _req.headers.get('host') || 'localhost:3000';
    const proto = _req.headers.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
    const origin = `${proto}://${host}`;

    const checklistData = await getIvacChecklistData(application, origin);

    return NextResponse.json({
      success: true,
      checklist: checklistData,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate checklist';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
