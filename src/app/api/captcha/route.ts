import { NextResponse } from 'next/server';
import { solveCaptcha } from '@/services/captcha';

export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: 'imageBase64 required' }, { status: 400 });
    }
    const text = await solveCaptcha(imageBase64);
    return NextResponse.json({ text });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Captcha error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
