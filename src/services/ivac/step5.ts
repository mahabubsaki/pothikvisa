import fs from 'node:fs';
import path from 'node:path';
import { type Page } from '@browserbasehq/stagehand';
import { Step5Result } from './types';
import { waitForUrlCondition } from './httpHelpers';
import { clickButtonSafe, handleCloudflareTurnstile } from './domHelpers';

/**
 * Step 5: Automates PDF Webfile Upload & Verification on /appointment/file-upload
 * Strictly follows the proven implementation from D:\goethe-browser-automation:
 * 1. Checks if Primary Applicant is already loaded (Count > 0)
 * 2. Waits for Cloudflare Turnstile token to be 100% resolved BEFORE uploading the webfile
 * 3. Uploads PDF webfile and dispatches DOM change/input events
 * 4. Waits until applicant count > 0 or applicant card is rendered
 * 5. Waits for 'Confirm All Information is Correct' button to become naturally enabled
 * 6. Clicks 'Confirm All Information is Correct', verifies modal, and clicks 'Save & Continue'
 */
export async function executeStep5(page: Page, pdfPath: string): Promise<Step5Result> {
  const currentUrl = await page.url();

  // 1. If already past webfile upload stage, skip
  if (
    currentUrl.includes('/appointment/time-slot') ||
    currentUrl.includes('/appointment/mission') ||
    currentUrl.includes('/continue-payment')
  ) {
    console.log(`⚡ [Step 5] Already past webfile upload stage (${currentUrl}) — skipping Step 5.`);
    return {
      success: true,
      currentUrl,
    };
  }

  // 2. Verify local PDF file exists
  const resolvedPdf = path.resolve(pdfPath);
  if (!fs.existsSync(resolvedPdf) || fs.statSync(resolvedPdf).size === 0) {
    throw new Error(`PDF file does not exist or is empty at: ${resolvedPdf}`);
  }

  // 3. Ensure on /appointment/file-upload or /appointment/application
  if (!currentUrl.includes('/appointment/file-upload') && !currentUrl.includes('/appointment/application')) {
    console.log('🌐 [Step 5] Navigating to https://appointment.ivacbd.com/appointment/file-upload...');
    await page.goto('https://appointment.ivacbd.com/appointment/file-upload');
    await page.waitForTimeout(1000);
  }

  // 4. Primary Applicant Upload Check: Only considered loaded if count > 0 or applicant card exists
  const isPrimaryLoaded = await page.evaluate(() => {
    const countEl = document.querySelector('span.text-orange') || document.querySelector('[class*="text-orange"]');
    const count = parseInt(countEl?.textContent?.trim() || '0', 10);
    if (!isNaN(count) && count > 0) return true;

    const cards = document.querySelectorAll('.applicant-card');
    return cards.length > 0;
  });

  if (isPrimaryLoaded) {
    console.log('🎉 [Step 5] Primary Applicant is already loaded from account profile (Count > 0)!');
  } else {
    // ── CRITICAL: Resolve Cloudflare Turnstile token BEFORE uploading webfile ──
    console.log('🛡️ [Step 5] Resolving Cloudflare Turnstile token BEFORE starting webfile upload...');
    const turnstileOk = await handleCloudflareTurnstile(page, 30000);
    if (turnstileOk) {
      console.log('⚡ [Step 5] Cloudflare Turnstile token is fully READY! Starting webfile upload...');
    } else {
      console.warn('⚠️ [Step 5] Turnstile challenge wait reached timeout. Proceeding with file attachment...');
    }

    await page.waitForTimeout(500);

    console.log(`📄 [Step 5] Attaching webfile PDF: ${path.basename(resolvedPdf)}`);
    const fileInput = page.locator('input[type="file"]').first();

    // Attach file with explicit application/pdf MIME type so React file validator accepts it
    await fileInput.setInputFiles({
      name: path.basename(resolvedPdf),
      mimeType: 'application/pdf',
      buffer: fs.readFileSync(resolvedPdf),
    });
    console.log('✅ [Step 5] Primary Webfile PDF attached.');

    // Dispatch DOM events so React form state registers the file attachment immediately
    await page.evaluate(() => {
      const el = (document.querySelector('input[type="file"][accept*="pdf"]') ||
        document.querySelector('input[type="file"]')) as HTMLInputElement | null;
      if (el) {
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }).catch(() => {});

    // Wait up to 60s for primary applicant card / count to increment (Count > 0)
    console.log('⏳ [Step 5] Waiting for applicant card to render and count to increment...');
    let applicantRendered = false;
    for (let i = 0; i < 60; i++) {
      await page.waitForTimeout(1000);
      const pollResult = await page.evaluate(() => {
        // 1. Check for server validation errors (e.g. "File already exists.. Try again")
        const errorNodes = Array.from(document.querySelectorAll('p, div, span')).filter((el) => {
          const cls = el.className || '';
          const style = window.getComputedStyle(el);
          const isRed = cls.includes('red') || style.color.includes('239') || style.color.includes('rgb(239') || style.color === 'red';
          const text = (el.textContent || '').trim();
          return isRed && text.length > 2 && /already exists|try again|invalid|error|not allowed/i.test(text);
        });

        if (errorNodes.length > 0) {
          return { error: errorNodes[0].textContent?.trim() };
        }

        // 2. Check for success
        const countEl = document.querySelector('span.text-orange') || document.querySelector('[class*="text-orange"]');
        const count = parseInt(countEl?.textContent?.trim() || '0', 10);
        if (!isNaN(count) && count > 0) return { success: true };

        const cards = document.querySelectorAll('.applicant-card');
        const body = document.body ? document.body.innerText : '';
        if (cards.length > 0 || /Applicant 1|Primary Applicant Details/i.test(body)) {
          return { success: true };
        }

        return { success: false };
      });

      if (pollResult.error) {
        console.error(`\n❌ [Step 5] IVAC Server Rejected Upload: "${pollResult.error}"`);
        throw new Error(`IVAC rejected webfile upload: "${pollResult.error}". This Webfile application ID has already been registered or booked in IVAC system.`);
      }

      if (pollResult.success) {
        console.log('✅ [Step 5] Primary Applicant card rendered successfully (Count > 0)!');
        applicantRendered = true;
        break;
      }
    }

    if (!applicantRendered) {
      console.warn('⚠️ [Step 5] Applicant count did not increment within 60s, continuing to verification check...');
    }
  }

  // 5. CRITICAL: Wait for Turnstile token AND 'Confirm All Information is Correct' button to become enabled!
  console.log('⏳ [Step 5] Waiting for Turnstile resolution and "Confirm All Information is Correct" button unlock...');
  let readyToConfirm = false;
  const startWait = Date.now();
  while (Date.now() - startWait < 60000) {
    // Solve Turnstile if challenge appears or reset
    await handleCloudflareTurnstile(page, 2000).catch(() => {});

    readyToConfirm = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        /Confirm All Information is Correct/i.test(b.textContent || '')
      ) as HTMLButtonElement | null;
      if (!btn || btn.disabled || btn.hasAttribute('disabled') || btn.getAttribute('aria-disabled') === 'true') {
        return false;
      }

      const turnstileInput = document.querySelector('input[name="cf-turnstile-response"]') as HTMLInputElement | null;
      const hasTurnstileWidget = Boolean(turnstileInput || document.querySelector('#cf-turnstile, .cf-turnstile'));
      if (hasTurnstileWidget) {
        return Boolean(turnstileInput && turnstileInput.value && turnstileInput.value.trim().length > 0);
      }
      return true;
    });

    if (readyToConfirm) {
      console.log('⚡ [Step 5] "Confirm All Information is Correct" button is ENABLED and Turnstile is SOLVED!');
      break;
    }

    await page.waitForTimeout(500);
  }

  if (!readyToConfirm) {
    throw new Error('Timed out waiting for "Confirm All Information is Correct" button to become enabled and Turnstile to resolve.');
  }

  // 6. Click "Confirm All Information is Correct"
  console.log('👉 [Step 5] Clicking "Confirm All Information is Correct"...');
  const confirmClicked = await clickButtonSafe(page, {
    selector: 'button',
    textPattern: /Confirm All Information is Correct/i,
    timeoutMs: 15000,
  });

  if (!confirmClicked) {
    throw new Error('Failed to click enabled "Confirm All Information is Correct" button.');
  }

  // 7. Resiliently wait for confirmation modal ("Please confirm your details" / "Save & Continue")
  console.log('⏳ [Step 5] Waiting for confirmation modal ("Please confirm your details")...');
  let modalVisible = false;
  const modalStart = Date.now();
  while (Date.now() - modalStart < 30000) {
    modalVisible = await page.evaluate(() => {
      const t = document.body ? document.body.innerText : '';
      const hasModalTitle = /Please confirm your details/i.test(t);
      const hasSaveBtn = Array.from(document.querySelectorAll('button')).some((b) =>
        /Save & Continue|Save and Continue/i.test(b.textContent || '')
      );
      return hasModalTitle || hasSaveBtn;
    });

    if (modalVisible) break;

    // Retrigger confirm click if modal hasn't opened after 5s
    if (Date.now() - modalStart > 5000) {
      await clickButtonSafe(page, {
        selector: 'button',
        textPattern: /Confirm All Information is Correct/i,
        timeoutMs: 2000,
      });
    }

    await page.waitForTimeout(1000);
  }

  if (!modalVisible) {
    throw new Error('Confirmation modal did not appear after clicking "Confirm All Information is Correct".');
  }

  // 8. Click "Save & Continue" on the modal
  console.log('👉 [Step 5] Clicking "Save & Continue" on confirmation modal...');
  const saveClicked = await clickButtonSafe(page, {
    selector: 'button',
    textPattern: /Save & Continue|Save and Continue/i,
    timeoutMs: 20000,
  });

  if (!saveClicked) {
    throw new Error('Failed to click "Save & Continue" button on modal.');
  }

  // 9. Confirm navigation to /appointment/mission
  console.log('⏳ [Step 5] Waiting for navigation to /appointment/mission...');
  const finalUrl = await waitForUrlCondition(
    page,
    (u) => u.includes('/appointment/mission') || u.includes('/appointment/time-slot'),
    30000
  );

  if (finalUrl.includes('/appointment/mission') || finalUrl.includes('/appointment/time-slot')) {
    console.log(`✅ [Step 5] Successfully advanced to ${finalUrl}`);
    return {
      success: true,
      currentUrl: finalUrl,
    };
  }

  return {
    success: false,
    currentUrl: finalUrl,
    error: `Failed to advance to /appointment/mission. Final URL: ${finalUrl}`,
  };
}
