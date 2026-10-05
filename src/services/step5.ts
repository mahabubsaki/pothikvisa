import { type Page } from '@browserbasehq/stagehand';
import { Step5AdditionalQuestionsProfile } from '../types/profile';
import { safeArg } from '../utils/sanitize';
import type { IndianVisaPortalWindow } from './portalBrowserTypes';

export interface Step5Result {
  success: boolean;
  currentUrl: string;
  error?: string;
}

/**
 * Automates Step 5: Additional Questions & Declaration on indianvisa-bangladesh.nic.in/visa/AdditionalQuestions
 */
export async function executeStep5(
  page: Page,
  details: Step5AdditionalQuestionsProfile,
  action: 'continue' | 'exit' = 'continue'
): Promise<Step5Result> {
  const currentUrl = await page.url();
  if (!currentUrl.includes('/visa/AdditionalQuestions')) {
    throw new Error(`Expected to be on /visa/AdditionalQuestions, but currently on: ${currentUrl}`);
  }

  // Ensure DOM is ready
  await page.waitForSelector('#question_no_1', { timeout: 15000 });
  await page.waitForTimeout(400);

  // Set the 6 radio options (NO by default) and check declaration
  await page.evaluate((data: {
    q1: boolean;
    q2: boolean;
    q3: boolean;
    q4: boolean;
    q5: boolean;
    q6: boolean;
  }) => {
    const win = window as unknown as IndianVisaPortalWindow;
    const flags = [data.q1, data.q2, data.q3, data.q4, data.q5, data.q6];
    for (let idx = 0; idx < flags.length; idx++) {
      const isYes = flags[idx];
      const num = idx + 1;
      const radioId = isYes ? `#question_yes_${num}` : `#question_no_${num}`;
      win.$?.(radioId).prop('checked', true);
      win.$?.(radioId).trigger('change');
    }

    const verifyCheck = document.getElementById('verifyQuestions') as HTMLInputElement;
    if (verifyCheck) {
      verifyCheck.checked = true;
      win.$?.(verifyCheck).trigger('change');
    }
  }, safeArg({
    q1: Boolean(details.arrestedOrConvicted),
    q2: Boolean(details.refusedEntryOrDeported),
    q3: Boolean(details.humanOrDrugTrafficking),
    q4: Boolean(details.cyberCrimeOrTerrorism),
    q5: Boolean(details.viewsJustifyingTerrorism),
    q6: Boolean(details.soughtAsylum),
  }));

  // Submit or Exit
  const buttonSelector = action === 'continue' ? '#continue' : '#exit';

  await page.evaluate((btnId: string) => {
    const win = window as unknown as IndianVisaPortalWindow;
    win.$?.('input[type=submit]').removeAttr('clicked');
    win.$?.(btnId).attr('clicked', 'true');
  }, buttonSelector);

  await page.locator(buttonSelector).click();
  await page.waitForTimeout(3000);

  const finalUrl = await page.url();
  return {
    success: !finalUrl.includes('/visa/AdditionalQuestions') || action === 'exit',
    currentUrl: finalUrl,
  };
}
