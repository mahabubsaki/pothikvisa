import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/currentAuth';
import { getSavedProfileById, getDb, SavedProfileRecord } from '@/lib/db';
import { downloadR2Buffer } from '@/lib/r2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { id } = await params;
    let profile = getSavedProfileById(id, user.id);
    if (!profile && user.isAdmin) {
      const db = getDb();
      profile = (db.prepare('SELECT * FROM applicant_profiles WHERE id = ?').get(id) as unknown as SavedProfileRecord) || null;
    }

    if (!profile) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Profile not found' }, { status: 404 });
    }

    let existingData: Record<string, unknown> = {};
    try {
      existingData = JSON.parse(profile.data_json || '{}');
    } catch {}

    let passport: { fileName: string; sizeKb: number; base64: string } | null = null;
    let photo: { base64: string; dataUrl: string } | null = null;

    // 1. Retrieve Passport PDF buffer
    try {
      const passportKey = `profiles/${id}/passport.pdf`;
      let passportBuffer: Buffer | null = null;
      try {
        passportBuffer = await downloadR2Buffer(passportKey);
      } catch {
        if (existingData.passportPdfUrl && typeof existingData.passportPdfUrl === 'string') {
          const customKey = existingData.passportPdfUrl.replace(/^\/uploads\//, '');
          passportBuffer = await downloadR2Buffer(customKey);
        }
      }

      if (passportBuffer && passportBuffer.length > 0) {
        passport = {
          fileName: (existingData.passportPdfName as string) || 'Passport.pdf',
          sizeKb: (existingData.passportPdfSizeKb as number) || Math.round(passportBuffer.length / 1024),
          base64: passportBuffer.toString('base64'),
        };
      }
    } catch (err) {
      console.warn(`[Profile ${id}] No passport PDF found:`, err);
    }

    // 2. Retrieve Consular Photo buffer
    try {
      const photoKey = `profiles/${id}/photo.jpg`;
      let photoBuffer: Buffer | null = null;
      try {
        photoBuffer = await downloadR2Buffer(photoKey);
      } catch {
        if (existingData.photoUrl && typeof existingData.photoUrl === 'string') {
          const customKey = existingData.photoUrl.replace(/^\/uploads\//, '');
          photoBuffer = await downloadR2Buffer(customKey);
        }
      }

      if (photoBuffer && photoBuffer.length > 0) {
        const photoBase64 = photoBuffer.toString('base64');
        photo = {
          base64: photoBase64,
          dataUrl: `data:image/jpeg;base64,${photoBase64}`,
        };
      }
    } catch (err) {
      console.warn(`[Profile ${id}] No consular photo found:`, err);
    }

    return NextResponse.json({
      success: true,
      hasPassport: Boolean(passport),
      hasPhoto: Boolean(photo),
      passport,
      photo,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve profile media';
    console.error('Error in profile media route:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
