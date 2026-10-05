import { type Page } from '@browserbasehq/stagehand';
import { safeArg } from '../../utils/sanitize';

/**
 * Robust in-browser clicker that finds elements via querySelector or text matching,
 * handles disabled attributes naturally, and executes clicks without Stagehand XPath RPC errors.
 */
export async function clickButtonSafe(
  page: Page,
  options: {
    selector?: string;
    textPattern?: string | RegExp;
    timeoutMs?: number;
    waitForEnabled?: boolean;
  }
): Promise<boolean> {
  const timeoutMs = options.timeoutMs ?? 15000;
  const start = Date.now();
  const patternStr =
    options.textPattern instanceof RegExp
      ? options.textPattern.source
      : options.textPattern || '';

  while (Date.now() - start < timeoutMs) {
    const res = await page.evaluate((args) => {
      const regex = args.patternStr ? new RegExp(args.patternStr, 'i') : null;
      let candidates: HTMLElement[] = [];

      if (args.selector) {
        try {
          candidates = Array.from(document.querySelectorAll<HTMLElement>(args.selector));
        } catch {
          candidates = [];
        }
      }

      if (candidates.length === 0) {
        candidates = Array.from(
          document.querySelectorAll<HTMLElement>('button, a, input[type="submit"], [role="button"]')
        );
      }

      const match = candidates.find((el) => {
        if (!regex) return true;
        const text = (el.innerText || el.textContent || el.getAttribute('value') || '')
          .replace(/[\s\u00a0]+/g, ' ')
          .trim();
        return regex.test(text);
      });

      if (!match) return { found: false, clicked: false };

      const isDisabled =
        match.hasAttribute('disabled') ||
        (match as HTMLButtonElement).disabled ||
        match.getAttribute('aria-disabled') === 'true' ||
        match.classList.contains('disabled');

      if (isDisabled) {
        return { found: true, clicked: false, disabled: true };
      }

      match.scrollIntoView({ behavior: 'instant', block: 'center' });
      match.click();
      return { found: true, clicked: true };
    }, safeArg({ selector: options.selector || '', patternStr, waitForEnabled: options.waitForEnabled ?? false })).catch(() => ({ found: false, clicked: false }));

    if (res.clicked) return true;
    await page.waitForTimeout(250);
  }

  return false;
}

/**
 * Waits until a target button or element is no longer disabled.
 */
export async function waitForEnabled(
  page: Page,
  selector: string,
  timeoutMs = 15000
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const isReady = await page.evaluate((sel) => {
      const el = document.querySelector(sel) as HTMLButtonElement | null;
      if (!el) return false;
      const isDisabled =
        el.disabled ||
        el.hasAttribute('disabled') ||
        el.getAttribute('aria-disabled') === 'true' ||
        el.classList.contains('disabled');
      return !isDisabled;
    }, safeArg(selector)).catch(() => false);

    if (isReady) return true;
    await page.waitForTimeout(250);
  }
  return false;
}

/**
 * Solves Cloudflare Turnstile widget if present on page by triggering native container click,
 * iframe interaction, and waiting until the response token is set in the form.
 * Matches the proven implementation from D:\goethe-browser-automation.
 */
export async function handleCloudflareTurnstile(
  page: Page,
  timeoutMs = 25000
): Promise<boolean> {
  try {
    // 1. Instant check: is token already populated?
    const alreadyDone = await page.evaluate(() => {
      const resp = document.querySelector('input[name="cf-turnstile-response"]') as HTMLInputElement | null;
      return Boolean(resp && resp.value && resp.value.trim().length > 0);
    }).catch(() => false);

    if (alreadyDone) return true;

    // 2. Check if Turnstile widget / iframe exists on this page
    const hasWidget = await page.evaluate(() => {
      return Boolean(
        document.querySelector('input[name="cf-turnstile-response"]') ||
          document.querySelector('#cf-turnstile') ||
          document.querySelector('.cf-turnstile') ||
          document.querySelector('iframe[src*="cloudflare"]') ||
          document.querySelector('iframe[src*="turnstile"]')
      );
    }).catch(() => false);

    if (!hasWidget) return true;

    // Method 0 (Visa_Automator Extension Technique):
    // In high-trust environments, clicking the outer container in the parent document triggers
    // Turnstile's native verification loop without triggering cross-origin iframe bot defenses.
    await page.evaluate(() => {
      const captchaBox = (document.querySelector('#cf-turnstile') ||
        document.querySelector('.cf-turnstile')) as HTMLElement | null;
      if (captchaBox) {
        captchaBox.click();
        captchaBox.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      }
    }).catch(() => {});

    const start = Date.now();
    let lastClickTime = 0;

    while (Date.now() - start < timeoutMs) {
      // Check if token is ready in input
      const token = await page.evaluate(() => {
        const resp = document.querySelector('input[name="cf-turnstile-response"]') as HTMLInputElement | null;
        return resp && resp.value && resp.value.trim().length > 0 ? resp.value.trim() : null;
      }).catch(() => null);

      if (token) {
        console.log(`✅ [Turnstile] Token verified (${token.slice(0, 15)}...)`);
        return true;
      }

      const now = Date.now();
      if (now - lastClickTime > 1200) {
        lastClickTime = now;

        // Container click
        await page.evaluate(() => {
          const captchaBox = (document.querySelector('#cf-turnstile') ||
            document.querySelector('.cf-turnstile')) as HTMLElement | null;
          if (captchaBox) {
            captchaBox.click();
            captchaBox.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
          }
        }).catch(() => {});

        // Stagehand locator click on container
        try {
          const containerLoc = page.locator('#cf-turnstile').first();
          if ((await containerLoc.count().catch(() => 0)) > 0 && (await containerLoc.isVisible().catch(() => false))) {
            await containerLoc.click().catch(() => {});
          }
        } catch {}

        // Stagehand locator click on iframe
        try {
          const iframeLoc = page.locator('iframe[src*="cloudflare"]').first();
          if ((await iframeLoc.count().catch(() => 0)) > 0 && (await iframeLoc.isVisible().catch(() => false))) {
            await iframeLoc.click().catch(() => {});
          }
        } catch {}
      }

      await page.waitForTimeout(250);
    }

    // Final check
    const finalCheck = await page.evaluate(() => {
      const resp = document.querySelector('input[name="cf-turnstile-response"]') as HTMLInputElement | null;
      return Boolean(resp && resp.value && resp.value.trim().length > 0);
    }).catch(() => false);

    return finalCheck;
  } catch {
    return false;
  }
}
