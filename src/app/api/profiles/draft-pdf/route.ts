import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/currentAuth';
import { apiErrorResponse } from '@/lib/api-error';
import { generateOfficialPdfDraft } from '@/lib/official-pdf-generator';
import { VisaApplicantProfile } from '@/types/profile';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    await requirePermission('pdf.preview');
    const body = await request.json();
    const profile = body.profile as VisaApplicantProfile | undefined;
    if (!profile) {
      return NextResponse.json({ error: 'Profile data is required.' }, { status: 400 });
    }

    const encodedPhoto = body.photoBase64 as string | undefined;
    const photoBuffer = encodedPhoto
      ? Buffer.from(encodedPhoto.replace(/^data:image\/\w+;base64,/, ''), 'base64')
      : undefined;
    const pdfBytes = await generateOfficialPdfDraft({
      profile,
      photoBuffer,
      applicationId: body.applicationId as string | undefined,
    });

    return NextResponse.json({
      success: true,
      pdfBase64: Buffer.from(pdfBytes).toString('base64'),
      pageCount: 2,
    });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'Failed to generate draft PDF');
  }
}
