import { NextResponse } from 'next/server';
import { solveCaptcha } from '@/services/captcha';
import { requirePermission } from '@/lib/currentAuth';
import { apiErrorResponse } from '@/lib/api-error';

export async function POST(req: Request) {
  try {
    await requirePermission('captcha.solve');
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: 'imageBase64 required' }, { status: 400 });
    }
    const text = await solveCaptcha(imageBase64);
    return NextResponse.json({ text });
  } catch (err: unknown) {
    return apiErrorResponse(err, 'Captcha error');
  }
}
