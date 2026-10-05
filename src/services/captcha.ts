import { DdddOcr, CHARSET_RANGE } from 'ddddocr-node';
import type { Page } from '@browserbasehq/stagehand';

let ocrInstance: DdddOcr | null = null;

function getOcr(): DdddOcr {
  if (!ocrInstance) {
    const ocr = new DdddOcr();
    // Restrict OCR results to strictly lowercase letters (a-z) and numbers (0-9)
    ocr.setRanges(CHARSET_RANGE.MIX_LOWER_NUM_CASE);
    ocrInstance = ocr;
  }
  return ocrInstance;
}

/**
 * High-speed neural network captcha solver powered by ddddocr-node.
 * Directly decodes distorted, noisy, strikethrough captchas with touching letters in ~20ms.
 */
export async function solveCaptcha(input: string | Buffer): Promise<string> {
  const buffer = Buffer.isBuffer(input)
    ? input
    : Buffer.from(input.replace(/^data:image\/\w+;base64,/, ''), 'base64');

  const ocr = getOcr();
  const rawResult = await ocr.classification(buffer as unknown as string);

  if (typeof rawResult !== 'string') {
    return '';
  }

  return rawResult.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

export async function solveCaptchaFromBase64(base64Data: string): Promise<string> {
  return solveCaptcha(base64Data);
}

/**
 * Extracts the captcha image from the page safely using in-memory canvas
 * or bounding box screenshot.
 */
export async function getCaptchaBuffer(page: Page): Promise<Buffer> {
  const base64Data: string = await page.evaluate(() => {
    const img = document.querySelector('#capt, img[src*="captcha" i], img[src*="Captcha" i]') as HTMLImageElement;
    if (!img) return '';
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || 200;
    canvas.height = img.naturalHeight || 50;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL('image/png');
  });

  if (base64Data && base64Data.length > 100) {
    return Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  }

  // Fallback to bounding box screenshot
  const box = await page.evaluate(() => {
    const img = document.querySelector('#capt, img[src*="captcha" i], img[src*="Captcha" i]') as HTMLImageElement;
    if (!img) return null;
    const rect = img.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });

  if (box && typeof page.screenshot === 'function') {
    const shot = await page.screenshot({ clip: box });
    return Buffer.isBuffer(shot) ? shot : Buffer.from(shot);
  }

  throw new Error('Unable to extract captcha image from page');
}
