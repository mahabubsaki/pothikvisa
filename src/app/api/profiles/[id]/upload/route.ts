import path from 'path';
import fs from 'fs';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/currentAuth';
import { getSavedProfileById, saveOrUpdateProfile } from '@/lib/db';
import { uploadBufferToStorage } from '@/lib/r2';
import { enhanceConsularPhoto, enhancePassportDocument } from '@/lib/media-enhancer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { id } = await params;
    const profile = getSavedProfileById(id, user.id);
    if (!profile && !user.isAdmin) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Profile not found' }, { status: 404 });
    }

    const targetProfile = profile!;
    const formData = await req.formData();
    const photoFile = formData.get('photo') as File | null;
    const passportPdfFile = formData.get('passportPdf') as File | null;

    let existingData: Record<string, unknown> = {};
    try {
      existingData = JSON.parse(targetProfile.data_json || '{}');
    } catch {}

    let photoUrl = (existingData.photoUrl as string) || undefined;
    let passportPdfUrl = (existingData.passportPdfUrl as string) || undefined;
    let passportPdfName = (existingData.passportPdfName as string) || undefined;
    let passportPdfSizeKb = (existingData.passportPdfSizeKb as number) || undefined;

    // 1. Process and upload Photo to R2 / Storage
    if (photoFile && photoFile.size > 0) {
      const rawBuffer = Buffer.from(await photoFile.arrayBuffer());
      const enhanced = await enhanceConsularPhoto(rawBuffer);

      const r2Key = `profiles/${id}/photo.jpg`;
      const result = await uploadBufferToStorage({
        key: r2Key,
        buffer: enhanced.buffer,
        contentType: 'image/jpeg',
      });
      photoUrl = result.url;
      console.log(`📸 [Profile ${id}] Saved consular photo to storage: ${photoUrl} (${enhanced.sizeKb} KB)`);
    }

    // 2. Process and upload Passport PDF to R2 / Storage
    if (passportPdfFile && passportPdfFile.size > 0) {
      const rawBuffer = Buffer.from(await passportPdfFile.arrayBuffer());
      const enhancedPdf = await enhancePassportDocument(rawBuffer, passportPdfFile.name);

      const r2Key = `profiles/${id}/passport.pdf`;
      const result = await uploadBufferToStorage({
        key: r2Key,
        buffer: enhancedPdf.buffer,
        contentType: 'application/pdf',
      });
      passportPdfUrl = result.url;
      passportPdfName = passportPdfFile.name;
      passportPdfSizeKb = enhancedPdf.sizeKb;
      console.log(`📄 [Profile ${id}] Saved passport PDF to storage: ${passportPdfUrl} (${enhancedPdf.sizeKb} KB)`);
    }

    // 3. Update profile's data_json
    existingData.photoUrl = photoUrl;
    existingData.passportPdfUrl = passportPdfUrl;
    existingData.passportPdfName = passportPdfName;
    existingData.passportPdfSizeKb = passportPdfSizeKb;

    const updatedProfile = saveOrUpdateProfile({
      id: targetProfile.id,
      userId: targetProfile.user_id,
      profileName: targetProfile.profile_name,
      passportNumber: targetProfile.passport_number,
      data: existingData,
    });

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      photoUrl,
      passportPdfUrl,
      passportPdfName,
      passportPdfSizeKb,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to upload profile assets';
    console.error('Error in profile upload route:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
