import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/currentAuth';
import { apiErrorResponse } from '@/lib/api-error';
import { extractPassportDetails } from '@/lib/passport-extractor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await requirePermission('passport.extract');

    const formData = await req.formData();
    const file = formData.get('passport') as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: 'NO_FILE', message: 'No passport file provided' },
        { status: 400 }
      );
    }

    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'FILE_TOO_LARGE', message: 'File size exceeds 15 MB limit' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await extractPassportDetails(buffer, file.type || 'application/pdf');

    if (!result.success && !result.fields.passportNumber) {
      return NextResponse.json(
        {
          success: false,
          error: 'MRZ_UNCLEAR',
          message:
            'পাসপোর্টের নিচের দুটি লাইন (MRZ) স্পষ্টভাবে বোঝা যাচ্ছে না। অনুগ্রহ করে স্পষ্ট ও সোজা ছবি বা পিডিএফ পুনরায় আপলোড করুন।',
          messageEn:
            'Could not read passport MRZ lines clearly. Please upload a clearer, uncropped scan or image of the bio-data page.',
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      fields: result.fields,
      mrzValid: result.mrzValid,
      confidence: result.confidence,
    });
  } catch (err: unknown) {
    return apiErrorResponse(err, 'Failed to process passport document');
  }
}
