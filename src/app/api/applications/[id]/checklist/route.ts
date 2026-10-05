import { NextResponse } from 'next/server';
import { requireApplicationAccess } from '@/lib/currentAuth';
import { apiErrorResponse } from '@/lib/api-error';
import { getIvacChecklistData } from '@/lib/ivacChecklist';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { application } = await requireApplicationAccess(id, 'applications.read');

    const host = _req.headers.get('host') || 'localhost:3000';
    const proto = _req.headers.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
    const origin = `${proto}://${host}`;

    const checklistData = await getIvacChecklistData(application, origin);

    return NextResponse.json({
      success: true,
      checklist: checklistData,
    });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'Failed to generate checklist');
  }
}
