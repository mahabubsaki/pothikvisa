import { NextResponse } from 'next/server';
import { extractProfileFromText } from '@/lib/ai-profile-extractor';
import { getAuthenticatedUser } from '@/lib/currentAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // Authenticate user if signed in
    await getAuthenticatedUser().catch(() => null);

    const body = await req.json().catch(() => ({}));
    const rawText = (body.text || '').trim();

    if (!rawText) {
      return NextResponse.json(
        {
          success: false,
          error: 'EMPTY_TEXT',
          message: 'No text or unstructured data provided for extraction.',
        },
        { status: 400 }
      );
    }

    if (rawText.length > 50000) {
      return NextResponse.json(
        {
          success: false,
          error: 'TEXT_TOO_LONG',
          message: 'Text exceeds maximum character limit of 50,000.',
        },
        { status: 400 }
      );
    }

    const result = await extractProfileFromText(rawText);

    return NextResponse.json({
      success: true,
      profile: result.profile,
      fieldsCount: result.fieldsCount,
      detectedFormat: result.detectedFormat,
      sanitizationNotices: result.sanitizationNotices,
      providerUsed: result.providerUsed,
    });
  } catch (error: unknown) {
    console.error('Error in /api/ai/extract-profile:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'EXTRACTION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to extract profile from text.',
      },
      { status: 500 }
    );
  }
}
