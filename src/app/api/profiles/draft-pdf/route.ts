import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/currentAuth';
import { getUserSubscription } from '@/lib/db';
import { generateOfficialPdfDraft } from '@/lib/official-pdf-generator';
import { VisaApplicantProfile } from '@/types/profile';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser().catch(() => null);
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    // Lock draft preview for Starter and Free users:
    // Only available on Standard (300 ৳) and Agency Pro (500 ৳)
    const sub = getUserSubscription(user.id);
    const isAllowed =
      user.role === 'admin' ||
      sub?.plan === 'standard' ||
      sub?.plan === 'agency';

    if (!isAllowed) {
      return NextResponse.json(
        {
          error: 'UPGRADE_REQUIRED',
          message:
            'অফিসিয়াল ২-পৃষ্ঠা ড্রাফট পিডিএফ প্রিভিউ শুধুমাত্র Standard এবং Agency Pro প্ল্যানে উপলব্ধ। ড্রাফট প্রিভিউ আনলক করতে অনুগ্রহ করে Standard বা Agency Pro প্ল্যানে আপগ্রেড করুন।',
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const profile = body.profile as VisaApplicantProfile | undefined;
    const photoBase64 = body.photoBase64 as string | undefined;
    const applicationId = body.applicationId as string | undefined;

    if (!profile) {
      return NextResponse.json(
        { error: 'INVALID_DATA', message: 'Profile data is required to generate draft PDF.' },
        { status: 400 }
      );
    }

    let photoBuffer: Buffer | undefined;
    if (photoBase64) {
      const cleanB64 = photoBase64.replace(/^data:image\/\w+;base64,/, '');
      photoBuffer = Buffer.from(cleanB64, 'base64');
    }

    const pdfBytes = await generateOfficialPdfDraft({
      profile,
      photoBuffer,
      applicationId,
    });

    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

    return NextResponse.json({
      success: true,
      pdfBase64,
      pageCount: 2,
    });
  } catch (error: unknown) {
    console.error('Error generating official draft PDF:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate draft PDF';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
