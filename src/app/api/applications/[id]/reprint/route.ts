import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/currentAuth';
import { getApplicationById } from '@/lib/db';
import { reprintOfficialPdf } from '@/services/reprintPdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
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

    if (!application.web_file_number) {
      return NextResponse.json(
        {
          error: 'NO_WEB_FILE_NUMBER',
          message: 'আবেদনের স্থায়ী ওয়েব ফাইল নম্বর (Application ID) এখনো নেই।',
        },
        { status: 400 }
      );
    }

    console.log(`📥 [API Reprint] Explicit reprint requested for ${application.web_file_number} (${id})`);
    const result = await reprintOfficialPdf(application.id);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'REPRINT_FAILED',
          message: result.error || 'সরকারি সার্ভার থেকে পিডিএফ ডাউনলোড করা যায়নি।',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      webFileNumber: result.webFileNumber,
      downloadUrl: `/api/applications/${id}/pdf`,
      finalPdfUrl: result.finalPdfUrl,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to reprint PDF';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
