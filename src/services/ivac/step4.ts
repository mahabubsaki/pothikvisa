import { type Page } from '@browserbasehq/stagehand';
import { Step4Result } from './types';
import { waitForUrlCondition } from './httpHelpers';
import { clickButtonSafe } from './domHelpers';

/**
 * Step 4: Handles Appointment Notice & Terms step on /appointment/notice
 * Accepts conditions and clicks "Next Step" to advance to file upload.
 */
export async function executeStep4(page: Page): Promise<Step4Result> {
  const currentUrl = await page.url();

  // 1. If already on file-upload, skip
  if (currentUrl.includes('/appointment/file-upload')) {
    console.log('⚡ [Step 4] Already on file-upload, skipping notice.');
    return {
      success: true,
      currentUrl: await page.url(),
    };
  }

  // 2. Ensure on /appointment/notice
  if (!currentUrl.includes('/appointment/notice')) {
    console.log('🌐 [Step 4] Navigating to https://appointment.ivacbd.com/appointment/notice...');
    await page.goto('https://appointment.ivacbd.com/appointment/notice');
    await page.waitForTimeout(1000);
  }

  // 3. Optional: accept any agreement checkbox if rendered
  try {
    const agreeCheckbox = page.locator('input[type="checkbox"]').first();
    if (await agreeCheckbox.isVisible()) {
      const isChecked = await agreeCheckbox.isChecked();
      if (!isChecked) {
        await agreeCheckbox.click();
      }
    }
  } catch {
    // Checkbox not required/present on all versions
  }

  // 4. Click "Next Step" button
  console.log('🚀 [Step 4] Clicking "Next Step" button...');
  await clickButtonSafe(page, {
    selector: 'button',
    textPattern: /next step|continue|proceed|next/i,
    timeoutMs: 15000,
  });

  // 5. Confirm transition to /appointment/file-upload
  const finalUrl = await waitForUrlCondition(page, (u) => u.includes('/appointment/file-upload'), 15000);

  if (finalUrl.includes('/appointment/file-upload')) {
    console.log('✅ [Step 4] Successfully navigated to /appointment/file-upload');
    return {
      success: true,
      currentUrl: finalUrl,
    };
  }

  return {
    success: false,
    currentUrl: finalUrl,
    error: `Failed to confirm transition to /appointment/file-upload within 15s. Final URL: ${finalUrl}`,
  };
}
