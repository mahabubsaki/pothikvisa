import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/currentAuth';
import { getApplicationById, updateApplication } from '@/lib/db';
import { checkVisaStatus } from '@/services/visaStatus';

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

    const webFileNumber = application.web_file_number;
    const passportNumber = application.passport_number;

    if (!webFileNumber) {
      return NextResponse.json(
        {
          error: 'NO_WEB_FILE_NUMBER',
          message: 'আবেদনে কোনো ওয়েব ফাইল নম্বর পাওয়া যায়নি। ফর্ম সম্পন্ন হওয়ার পর স্ট্যাটাস অনুসন্ধান করা যাবে।',
        },
        { status: 400 }
      );
    }

    const result = await checkVisaStatus(webFileNumber, passportNumber);

    if (result.success && result.found && result.status) {
      updateApplication(id, {
        status_message: `সরকারি পোর্টাল: ${result.status} (${result.statusBn})`,
      });
    }

    return NextResponse.json({
      success: result.success,
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Status enquiry failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
