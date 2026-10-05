import { type Page, type Response } from '@browserbasehq/stagehand';
import { Step6Result } from './types';
import { waitForResponse, waitForUrlCondition } from './httpHelpers';
import { clickButtonSafe, handleCloudflareTurnstile, waitForEnabled } from './domHelpers';

/**
 * Step 6: Automates Center Selection on /appointment/mission
 * Note: Mission dropdown is already disabled/locked by IVAC based on Webfile jurisdiction.
 * This step dynamically clicks the active Center dropdown and auto-selects the available center option.
 */
export async function executeStep6(
  page: Page,
  options?: { centerName?: string }
): Promise<Step6Result> {
  const currentUrl = await page.url();

  // 1. If already on /time-slot, skip
  if (currentUrl.includes('/appointment/time-slot')) {
    console.log('⚡ [Step 6] Already on time-slot selection, skipping center selection.');
    return {
      success: true,
      mission: 'Auto-Locked',
      center: 'Auto-Selected',
      currentUrl: await page.url(),
    };
  }

  // 2. Ensure on /appointment/mission
  if (!currentUrl.includes('/appointment/mission')) {
    console.log('🌐 [Step 6] Navigating to https://appointment.ivacbd.com/appointment/mission...');
    await page.goto('https://appointment.ivacbd.com/appointment/mission');
    await page.waitForTimeout(1000);
  }

  console.log('🏢 [Step 6] Detecting active IVAC Center dropdown (Mission is auto-locked by webfile)...');

  // 3. Locate the active Center dropdown trigger button
  await page.waitForSelector('button[role="combobox"], button', {
    timeout: 20000,
  });

  // Check if center is already selected
  const alreadySelectedText = await page.evaluate(() => {
    const btn = (document.querySelector('button[role="combobox"]') ||
      document.querySelector('button')) as HTMLElement | null;
    if (!btn) return null;
    const txt = (btn.innerText || btn.textContent || '').replace(/[\s\u00a0]+/g, ' ').trim();
    if (txt && !/select your|select a mission/i.test(txt)) return txt;
    return null;
  });

  let selectedCenterName = alreadySelectedText;

  if (alreadySelectedText) {
    console.log(`ℹ️ [Step 6] Center already selected: "${alreadySelectedText}"`);
  } else {
    // 4. Click the trigger to open available centers list
    console.log('👉 [Step 6] Clicking Center dropdown trigger to reveal available centers...');
    await page.evaluate(() => {
      const btn = (document.querySelector('button[role="combobox"]') ||
        Array.from(document.querySelectorAll('button')).find((b) => /select your ivac center/i.test(b.textContent || ''))) as HTMLElement | null;
      if (btn) btn.click();
    });
    await page.waitForTimeout(600);

    // 5. Query open popover / listbox for candidate center options
    const targetKeyword = options?.centerName || '';
    selectedCenterName = await page.evaluate((target: string) => {
      // Collect all containers that Radix / Cmdk uses for dropdown overlays
      const containers = Array.from(document.querySelectorAll([
        '[data-radix-popper-content-wrapper]',
        '[role="dialog"]',
        '[role="listbox"]',
        '[role="menu"]',
        'div[data-state="open"]',
        'div[class*="popover"]',
        'div[cmdk-root]',
        'div[cmdk-list]',
        'div.z-50',
      ].join(',')));

      let candidates: HTMLElement[] = [];
      for (const c of containers) {
        const items = Array.from(c.querySelectorAll<HTMLElement>(
          '[role="option"], [role="menuitem"], [cmdk-item], div[data-radix-collection-item], button, div[class*="cursor-pointer"], li'
        ));
        candidates.push(...items);
      }

      // Also include global option roles
      candidates.push(...Array.from(document.querySelectorAll<HTMLElement>(
        '[role="option"], [cmdk-item], div[data-radix-collection-item]'
      )));

      // Deduplicate and filter visible, valid items
      const seen = new Set<HTMLElement>();
      const valid = candidates.filter((el) => {
        if (seen.has(el)) return false;
        seen.add(el);
        const rect = el.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).display !== 'none';
        const text = (el.innerText || el.textContent || '').replace(/[\s\u00a0]+/g, ' ').trim();
        if (!isVisible || text.length < 2 || text.length > 90) return false;
        if (/confirm mission|select your ivac center|select a mission|profile|logout|back/i.test(text)) return false;
        return true;
      });

      if (valid.length === 0) return null;

      // Pick matching target if specified, otherwise auto-select the first available option
      let chosen = valid[0];
      if (target) {
        const matched = valid.find((el) => new RegExp(target, 'i').test(el.innerText || el.textContent || ''));
        if (matched) chosen = matched;
      }

      const chosenText = (chosen.innerText || chosen.textContent || '').replace(/[\s\u00a0]+/g, ' ').trim();
      chosen.click();
      return chosenText;
    }, targetKeyword);

    if (selectedCenterName) {
      console.log(`✅ [Step 6] Auto-selected IVAC center: "${selectedCenterName}"`);
    } else {
      // Fallback: keyboard navigation
      console.warn('⚠️ [Step 6] Popover items query returned empty. Pressing ArrowDown + Enter on trigger...');
      await page.evaluate(() => {
        const btn = document.querySelector('button[role="combobox"]') as HTMLElement;
        if (btn) btn.click();
      });
      await page.waitForTimeout(300);
      await page.keyPress('ArrowDown');
      await page.waitForTimeout(200);
      await page.keyPress('Enter');
    }
  }

  // 6. Check/solve Cloudflare Turnstile if present on Mission/Center page
  console.log('⏳ [Step 6] Verifying Turnstile readiness before confirming center...');
  await handleCloudflareTurnstile(page, 15000);
  await waitForEnabled(page, 'button[type="submit"], button', 15000);

  // 7. Set up HTTP interception for POST /appointment/appointment-booking-config
  console.log('🚀 [Step 6] Submitting center config and intercepting POST /appointment/appointment-booking-config...');
  const responsePromise = waitForResponse(
    page,
    (res: Response) => res.url().includes('/appointment/appointment-booking-config') && res.status() !== 0,
    30000
  );

  // 8. Click "Confirm Mission & IVAC Center" / "Save and Continue"
  await clickButtonSafe(page, {
    selector: 'button[type="submit"], button',
    textPattern: /confirm mission|save and continue|save & continue|save/i,
    timeoutMs: 15000,
  });

  // 8. Evaluate HTTP Response
  const response = await responsePromise;
  const status = response.status();
  console.log(`📡 [Step 6] /appointment/appointment-booking-config responded with HTTP ${status}`);

  if (status === 200 || status === 201) {
    const finalUrl = await waitForUrlCondition(page, (u) => u.includes('/appointment/time-slot'), 15000);
    console.log('✅ [Step 6] Center confirmed! Navigating to /appointment/time-slot');

    return {
      success: true,
      mission: 'Auto-Locked',
      center: selectedCenterName || options?.centerName || 'Auto-Selected',
      currentUrl: finalUrl,
    };
  }

  return {
    success: false,
    mission: 'Auto-Locked',
    center: selectedCenterName || options?.centerName || 'Failed',
    currentUrl: await page.url(),
    error: `Mission configuration failed with HTTP ${status}`,
  };
}
