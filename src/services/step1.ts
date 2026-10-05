import { type Page } from '@browserbasehq/stagehand';
import { solveCaptcha, getCaptchaBuffer } from './captcha';
import { Step1RegistrationProfile } from '../types/profile';
import { safeArg } from '../utils/sanitize';
import type { IndianVisaPortalWindow } from './portalBrowserTypes';

export interface Step1Result {
  success: boolean;
  temporaryApplicationId?: string;
  currentUrl: string;
  error?: string;
}

/**
 * Helper to poll until a condition returns true inside the page context.
 */
async function waitForPageCondition(
  page: Page,
  checkFn: () => boolean,
  timeoutMs = 12000,
  intervalMs = 250,
  conditionName = 'page condition'
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const passed = await page.evaluate(checkFn);
    if (passed) return;
    await page.waitForTimeout(intervalMs);
  }
  throw new Error(`Timed out waiting for ${conditionName} after ${timeoutMs}ms`);
}

/**
 * Automates Step 1: Online Registration Form on indianvisa-bangladesh.nic.in
 * Handles cascading AJAX dropdowns, human-like pacing, and local Tesseract OCR captcha solving.
 */
export async function executeStep1(
  page: Page,
  profile: Step1RegistrationProfile,
  onProgress?: (message: string, messageBn: string) => void
): Promise<Step1Result> {
  const currentInitialUrl = await page.url();

  // 1. Ensure we are on the registration page
  if (!currentInitialUrl.includes('/visa/Registration')) {
    onProgress?.('Step 1: Navigating to Indian Visa Registration portal...', 'ধাপ ১: সরকারি ভিসা রেজিস্ট্রেশন পোর্টালে প্রবেশ করা হচ্ছে...');
    await page.goto('https://indianvisa-bangladesh.nic.in/');
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      const win = window as unknown as IndianVisaPortalWindow;
      if (typeof win.verify === 'function') {
        win.verify();
      }
    });
    await waitForPageCondition(
      page,
      () => window.location.href.includes('/visa/Registration'),
      12000,
      250,
      '/visa/Registration page'
    );
  }

  // 2. Select Country Applying From (triggers mission population)
  const targetCountry = profile.countryApplyingFrom || 'BGD';
  await page.waitForSelector('#countryname_id', { timeout: 15000 });
  await page.evaluate((val: string) => {
    const el = document.getElementById('countryname_id') as HTMLSelectElement;
    if (el) {
      el.value = val;
      if (!el.value) {
        for (let i = 0; i < el.options.length; i++) {
          if (el.options[i].value === val || el.options[i].text.includes('BANGLADESH')) {
            el.selectedIndex = i;
            break;
          }
        }
      }
      const win = window as unknown as IndianVisaPortalWindow;
      win.$?.(el).trigger('change');
    }
  }, targetCountry);
  await page.waitForTimeout(600);

  // 3. Select Indian Mission (triggers nationality population via AJAX)
  await waitForPageCondition(
    page,
    () => {
      const mission = document.getElementById('missioncode_id') as HTMLSelectElement;
      return !!(mission && mission.options && mission.options.length > 1);
    },
    12000,
    250,
    'Indian Mission dropdown options'
  );

  await page.evaluate((val: string) => {
    const el = document.getElementById('missioncode_id') as HTMLSelectElement;
    if (el) {
      el.value = val;
      const win = window as unknown as IndianVisaPortalWindow;
      win.$?.(el).trigger('change');
    }
  }, profile.indianMission);
  await page.waitForTimeout(1000);

  // 4. Select Nationality (triggers visa purpose population via AJAX)
  const targetNationality = profile.nationality || 'BGD';
  await waitForPageCondition(
    page,
    () => {
      const nat = document.getElementById('nationality_id') as HTMLSelectElement;
      return !!(nat && nat.options && nat.options.length > 1);
    },
    12000,
    250,
    'Nationality dropdown options'
  );

  await page.evaluate((val: string) => {
    const el = document.getElementById('nationality_id') as HTMLSelectElement;
    if (el) {
      el.value = val;
      if (!el.value) {
        for (let i = 0; i < el.options.length; i++) {
          if (el.options[i].value === val || el.options[i].text.includes('BANGLADESH')) {
            el.selectedIndex = i;
            break;
          }
        }
      }
      const win = window as unknown as IndianVisaPortalWindow;
      win.$?.(el).trigger('change');
    }
  }, targetNationality);
  await page.waitForTimeout(1200);

  // 5. Select Visa Purpose
  await waitForPageCondition(
    page,
    () => {
      const purpose = document.getElementById('visaPurposeDropdown') as HTMLSelectElement;
      return !!(purpose && purpose.options && purpose.options.length > 1);
    },
    12000,
    250,
    'Visa Purpose dropdown options'
  );

  await page.evaluate((val: string) => {
    const el = document.getElementById('visaPurposeDropdown') as HTMLSelectElement;
    if (el) {
      el.value = val;
      if (!el.value || el.value === '') {
        const lower = (val || '').toLowerCase();
        for (let i = 0; i < el.options.length; i++) {
          const opt = el.options[i];
          if (opt.value === val || opt.text.toLowerCase().includes(lower)) {
            el.selectedIndex = i;
            break;
          }
        }
      }
      const win = window as unknown as IndianVisaPortalWindow;
      win.$?.(el).trigger('change').trigger('chosen:updated');
    }
  }, profile.visaPurpose);
  await page.waitForTimeout(600);

  // 6. Fill Text Fields (DOB, Email, Re-enter Email, Journey Date)
  await page.evaluate((data: { dateOfBirth: string; email: string; reEnterEmail: string; expectedDateOfArrival: string }) => {
    (document.getElementById('dob_id') as HTMLInputElement).value = data.dateOfBirth;
    (document.getElementById('email_id') as HTMLInputElement).value = data.email;
    (document.getElementById('email_re_id') as HTMLInputElement).value = data.reEnterEmail;
    (document.getElementById('jouryney_id') as HTMLInputElement).value = data.expectedDateOfArrival;
  }, safeArg({
    dateOfBirth: profile.dateOfBirth,
    email: profile.email,
    reEnterEmail: profile.reEnterEmail,
    expectedDateOfArrival: profile.expectedDateOfArrival,
  }));

  // 7. Solve Captcha & Submit loop with automatic retry (up to 10 attempts for ~100% success)
  const maxSubmitAttempts = 10;
  for (let submitAttempt = 1; submitAttempt <= maxSubmitAttempts; submitAttempt++) {
    try {
      console.log(`🧩 [Registration] Captcha attempt ${submitAttempt}/${maxSubmitAttempts}...`);
      onProgress?.(
        `Step 1: Solving portal Captcha (Attempt ${submitAttempt}/${maxSubmitAttempts})...`,
        `ধাপ ১: সরকারি ক্যাপচা সমাধান করা হচ্ছে (চেষ্টা ${submitAttempt}/${maxSubmitAttempts})...`
      );

      // Capture Captcha via getCaptchaBuffer
      await page.waitForSelector('#capt', { timeout: 10000 });
      const captchaBuffer = await getCaptchaBuffer(page);

      const recognized = await solveCaptcha(captchaBuffer);
      console.log(`🔍 [Registration] Recognized captcha: "${recognized}" (len: ${recognized.length})`);

      if (!recognized || recognized.length !== 6) {
        console.warn(`⚠️ [Registration] Invalid captcha length. Refreshing...`);
        await page.evaluate(() => {
          const win = window as unknown as IndianVisaPortalWindow;
          if (typeof win.refreshCaptcha === 'function') {
            win.refreshCaptcha();
          }
        }).catch(() => {});
        await page.waitForTimeout(1000);
        continue;
      }

      // Set solved captcha
      await page.locator('#captcha').fill(recognized);
      await page.waitForTimeout(300);

      // 8. Submit Form and wait for navigation
      await page.locator('input[name="submit_registration"]').click();

      // Dynamically wait for redirect to /visa/BasicDetails (up to 8s)
      const waitStart = Date.now();
      let isRedirected = false;
      let checkUrl = await page.url();
      while (Date.now() - waitStart < 8000) {
        await page.waitForTimeout(400);
        checkUrl = await page.url();
        if (checkUrl.includes('/visa/BasicDetails')) {
          isRedirected = true;
          break;
        }
        // If error message or new captcha rendered, retry early without waiting 8s
        if (Date.now() - waitStart > 1800) {
          const hasError = await page.evaluate(() => {
            const body = document.body ? document.body.innerText : '';
            return /invalid captcha|captcha.*incorrect|enter.*captcha/i.test(body);
          }).catch(() => false);
          if (hasError) break;
        }
      }

      if (isRedirected) {
        const tempId = await page.evaluate(() => {
          const text = document.body ? document.body.innerText : '';
          const match = text.match(/Temporary Application ID\s*:\s*([A-Z0-9]+)/i);
          return match ? match[1] : undefined;
        });

        console.log(`🎉 [Registration] Passed! Temporary Application ID: ${tempId}`);
        return {
          success: true,
          temporaryApplicationId: tempId,
          currentUrl: checkUrl,
        };
      }

      console.warn(`❌ [Registration] Server rejected captcha on attempt ${submitAttempt}. Refreshing and retrying...`);
      onProgress?.(
        `Step 1: Captcha retrying (Attempt ${submitAttempt + 1}/${maxSubmitAttempts})...`,
        `ধাপ ১: ক্যাপচা পুনরায় চেষ্টা করা হচ্ছে (চেষ্টা ${submitAttempt + 1}/${maxSubmitAttempts})...`
      );
      
      // Ensure text fields are still intact if portal reloaded
      await page.evaluate((data: { dateOfBirth: string; email: string; reEnterEmail: string; expectedDateOfArrival: string }) => {
        const dob = document.getElementById('dob_id') as HTMLInputElement;
        if (dob && !dob.value) dob.value = data.dateOfBirth;
        const email = document.getElementById('email_id') as HTMLInputElement;
        if (email && !email.value) email.value = data.email;
        const emailRe = document.getElementById('email_re_id') as HTMLInputElement;
        if (emailRe && !emailRe.value) emailRe.value = data.reEnterEmail;
        const jDate = document.getElementById('jouryney_id') as HTMLInputElement;
        if (jDate && !jDate.value) jDate.value = data.expectedDateOfArrival;
      }, safeArg({
        dateOfBirth: profile.dateOfBirth,
        email: profile.email,
        reEnterEmail: profile.reEnterEmail,
        expectedDateOfArrival: profile.expectedDateOfArrival,
      })).catch(() => {});

      // Refresh Captcha image
      await page.evaluate(() => {
        const win = window as unknown as IndianVisaPortalWindow;
        if (typeof win.refreshCaptcha === 'function') {
          win.refreshCaptcha();
        }
      }).catch(() => {});
      await page.waitForTimeout(1500);
    } catch (attemptErr) {
      console.warn(`⚠️ [Registration] Error during captcha attempt ${submitAttempt}:`, attemptErr instanceof Error ? attemptErr.message : String(attemptErr));
      await page.waitForTimeout(2000);
    }
  }

  const lastUrl = await page.url();
  return {
    success: false,
    currentUrl: lastUrl,
    error: 'Form submitted but did not reach BasicDetails page',
  };
}
