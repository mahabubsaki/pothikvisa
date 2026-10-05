import { type Page } from '@browserbasehq/stagehand';
import { Step3Result } from './types';
import { waitForUrlCondition } from './httpHelpers';
import { clickButtonSafe } from './domHelpers';

/**
 * Step 3: Handles Home Dashboard, dismisses Advisory Notice modal,
 * and clicks "Take Your Appointment".
 */
export async function executeStep3(page: Page): Promise<Step3Result> {
  const currentUrl = await page.url();

  // 1. If already on notice or beyond, skip
  if (currentUrl.includes('/appointment/notice') || currentUrl.includes('/appointment/file-upload')) {
    console.log('⚡ [Step 3] Already past dashboard, skipping.');
    return {
      success: true,
      currentUrl: await page.url(),
    };
  }

  // 2. Wait for page to settle
  await page.waitForTimeout(1000);

  // 3. Dismiss any Advisory popup/modal
  console.log('🛡️ [Step 3] Checking for Advisory notice popups to dismiss...');
  try {
    await page.evaluate(() => {
      const closeButtons = Array.from(document.querySelectorAll('button')).filter((b) =>
        /close notice|close popup|close/i.test(b.getAttribute('aria-label') || b.textContent || '')
      );
      closeButtons.forEach((b) => b.click());
    });
  } catch {
    // No popup or already closed
  }

  await page.waitForTimeout(500);

  // 4. Click "Take Your Appointment" CTA
  console.log('🎯 [Step 3] Locating and clicking "Take Your Appointment"...');
  await clickButtonSafe(page, {
    selector: 'a[href*="/appointment/notice"], button',
    textPattern: /take your appointment|take appointment/i,
    timeoutMs: 15000,
  });

  // 5. Confirm navigation to /appointment/notice
  const finalUrl = await waitForUrlCondition(page, (u) => u.includes('/appointment/notice'), 15000);

  if (finalUrl.includes('/appointment/notice')) {
    console.log('✅ [Step 3] Successfully navigated to /appointment/notice');
    return {
      success: true,
      currentUrl: finalUrl,
    };
  }

  return {
    success: false,
    currentUrl: finalUrl,
    error: `Failed to confirm navigation to /appointment/notice within 15s. Final URL: ${finalUrl}`,
  };
}
