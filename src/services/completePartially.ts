import { type Page } from '@browserbasehq/stagehand';
import { solveCaptcha, getCaptchaBuffer } from './captcha';

interface CaptchaPortalWindow extends Window {
  refreshCaptcha?: () => void;
}

export interface CompletePartiallyResult {
  success: boolean;
  currentUrl: string;
  error?: string;
}

/**
 * Automates resuming a saved application from /visa/CompletePartially
 * by navigating from the official index page, filling Temporary Application ID,
 * and solving the captcha via local OCR.
 */
export async function executeCompletePartially(
  page: Page,
  temporaryApplicationId: string,
  maxAttempts = 10
): Promise<CompletePartiallyResult> {
  const currentUrl = await page.url();

  // Navigate from index page to establish valid session & referer
  if (!currentUrl.includes('/visa/CompletePartially')) {
    await page.goto('https://indianvisa-bangladesh.nic.in/visa/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(1000);

    await page.waitForSelector('a[href*="CompletePartially"]', { timeout: 10000 });
    await page.locator('a[href*="CompletePartially"]').first().click();

    await page.waitForSelector('#tempFileNo', { timeout: 15000 });
    await page.waitForTimeout(800);
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`🔄 Attempt ${attempt}/${maxAttempts} to resume application ${temporaryApplicationId}...`);

    // 1. Enter Temporary Application ID
    await page.locator('#tempFileNo').fill(temporaryApplicationId);
    await page.waitForTimeout(400);

    // 2. Extract Captcha via getCaptchaBuffer
    await page.waitForSelector('#capt', { timeout: 8000 });
    const captchaBuffer = await getCaptchaBuffer(page);

    const recognizedCaptcha = await solveCaptcha(captchaBuffer);
    console.log(`🧩 OCR Solved Captcha: "${recognizedCaptcha}" (length: ${recognizedCaptcha.length})`);

    if (!recognizedCaptcha || recognizedCaptcha.length !== 6) {
      console.warn(`⚠️ Captcha length was ${recognizedCaptcha.length} (expected 6). Refreshing captcha...`);
      await page.evaluate(() => {
        const win = window as unknown as CaptchaPortalWindow;
        if (typeof win.refreshCaptcha === 'function') {
          win.refreshCaptcha();
        } else {
          const refreshBtn = document.querySelector('img[src*="refresh" i], a[onclick*="refresh" i], .refresh') as HTMLElement;
          refreshBtn?.click?.();
        }
      });
      await page.waitForTimeout(1200);
      continue;
    }

    // 3. Fill Captcha
    await page.locator('#captcha').fill(recognizedCaptcha);
    await page.waitForTimeout(400);

    // 4. Click Submit ("Complete Partially Filled")
    await page.locator('input[name="submit_registration"], input[value*="Complete" i]').click();
    await page.waitForTimeout(3500);

    const postSubmitUrl = await page.url();

    // Check if we navigated away from CompletePartially
    if (!postSubmitUrl.includes('/visa/CompletePartially')) {
      console.log(`✅ Successfully navigated to: ${postSubmitUrl}`);
      return {
        success: true,
        currentUrl: postSubmitUrl,
      };
    }

    // Check for "Invalid Captcha" or error on page
    const hasError = await page.evaluate(() => {
      const text = document.body ? document.body.innerText : '';
      return text.includes('Invalid Captcha') || text.includes('Invalid Application');
    });

    if (hasError) {
      console.warn(`❌ Server reported Invalid Captcha on attempt ${attempt}. Retrying with fresh captcha...`);
      await page.evaluate(() => {
        const win = window as unknown as CaptchaPortalWindow;
        if (typeof win.refreshCaptcha === 'function') {
          win.refreshCaptcha();
        }
      });
      await page.waitForTimeout(1200);
    }
  }

  const finalUrl = await page.url();
  return {
    success: false,
    currentUrl: finalUrl,
    error: `Failed to complete partially filled form after ${maxAttempts} attempts.`,
  };
}
