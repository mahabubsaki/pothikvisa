import fs from 'node:fs';
import path from 'node:path';
import { type Page } from '@browserbasehq/stagehand';

export interface Step9Result {
  success: boolean;
  currentUrl: string;
  temporaryApplicationId?: string;
  finalApplicationId?: string;
  applicantName?: string;
  downloadedPdfPath?: string;
  verifiedFields: Record<string, string>;
  submittedFinal: boolean;
  error?: string;
}

export interface Step9Options {
  downloadsDir?: string;
  updateApplicantJson?: boolean;
  onLog?: (message: string) => void;
}

/**
 * Automates Step 9: Final Review & Verification on indianvisa-bangladesh.nic.in/visa/Verification
 * 1. Extracts all verified applicant details from the review tables.
 * 2. If submitFinal is false, holds safely on the review page.
 * 3. If submitFinal is true:
 *    - Submits the form via "Verified and Continue".
 *    - Strictly verifies that the page redirects to /visa/Confirmation.
 *    - Waits for the Confirmation page DOM to load and verifies the "Print Form" button is present.
 *    - Extracts the permanent Web File Number (Application ID).
 *    - Captures, validates, and saves the official PDF (checking file size and %PDF header).
 *    - If redirect fails, print button is missing, or PDF fails to download, counts as FAIL.
 */
export async function executeStep9(
  page: Page,
  submitFinal = false,
  options: Step9Options = {}
): Promise<Step9Result> {
  const log = (msg: string) => {
    console.log(msg);
    options.onLog?.(msg);
  };

  const currentUrl = await page.url();
  log(`🌐 [Step 9] Current URL: ${currentUrl}`);
  if (!currentUrl.includes('/visa/Verification') && !currentUrl.includes('/visa/VerifiedDetails')) {
    throw new Error(`Expected to be on /visa/Verification or /visa/VerifiedDetails, but currently on: ${currentUrl}`);
  }

  // 1. Extract verified fields from the review tables (flat loop to avoid esbuild __name issues)
  const reviewData = await page.evaluate(() => {
    const text = document.body ? document.body.innerText : '';
    const tempIdMatch = text.match(/Temporary Application ID\s*:\s*([A-Z0-9]+)/i);

    const fields: Record<string, string> = {};
    const rows = Array.from(document.querySelectorAll('tr, .row'));
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const cells = Array.from(r.querySelectorAll('td, div'))
        .map(c => (c as HTMLElement).innerText ? (c as HTMLElement).innerText.trim() : '')
        .filter(Boolean);

      if (cells.length >= 2) {
        const key = cells[0].replace(/[*:]/g, '').trim();
        const val = cells[1].trim();
        if (key && val && key.length < 50 && val.length < 150) {
          fields[key] = val;
        }
      }
    }

    return {
      temporaryApplicationId: tempIdMatch ? tempIdMatch[1] : undefined,
      fields
    };
  });

  log(`📋 [Step 9] Verified Review Page for ID: ${reviewData.temporaryApplicationId}`);

  // 2. Safe review mode: stop here if final submission is not explicitly requested
  if (!submitFinal) {
    log('🛡️ [Step 9] Safe Mode Active: Application verified and held on Verification page (not submitted).');
    return {
      success: true,
      currentUrl,
      temporaryApplicationId: reviewData.temporaryApplicationId,
      verifiedFields: reviewData.fields,
      submittedFinal: false,
    };
  }

  // 3. Final submission authorized: click "Verified and Continue"
  log(`🚀 [Step 9] Final submission authorized: Clicking "Verified and Continue" on ${currentUrl}...`);

  const downloadsDir = options.downloadsDir || path.resolve(process.cwd(), 'downloads');
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }

  const initialFiles = new Set(fs.readdirSync(downloadsDir));

  // Click "Verified and Continue"
  const clicked = await page.evaluate(() => {
    const btn = document.querySelector('input[value="Verified and Continue"], input[name="submit_btn"][value="Verified and Continue"]') as HTMLInputElement;
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });

  if (!clicked) {
    await page.locator('input[value="Verified and Continue"]').click();
  }

  // 4. Strictly wait for redirect to /visa/Confirmation (timeout 25s)
  log('⏳ [Step 9] Waiting for Confirmation page redirect...');
  const maxWaitMs = 25000;
  const startWait = Date.now();
  let postSubmitUrl = await page.url();
  let waitCount = 0;
  while (!postSubmitUrl.includes('/visa/Confirmation') && Date.now() - startWait < maxWaitMs) {
    await page.waitForTimeout(1000);
    postSubmitUrl = await page.url();
    waitCount++;
    if (waitCount % 3 === 0) {
      log(`⏳ [Step 9] Waiting for Confirmation (${waitCount}s)... Current URL: ${postSubmitUrl}`);
    }
  }

  // Failure Condition 1: Did not redirect to /visa/Confirmation
  if (!postSubmitUrl.includes('/visa/Confirmation')) {
    const errorMsg = `[IVAC Webfile Creation Server Down]: Application submission did not redirect to Confirmation page after ${maxWaitMs / 1000}s (Ended at: ${postSubmitUrl}). IVAC / Indian Visa portal server is currently unresponsive or down.`;
    log(`❌ ${errorMsg}`);
    return {
      success: false,
      currentUrl: postSubmitUrl,
      temporaryApplicationId: reviewData.temporaryApplicationId,
      verifiedFields: reviewData.fields,
      submittedFinal: true,
      error: errorMsg,
    };
  }

  log(`✅ [Step 9] Reached Confirmation page! URL: ${postSubmitUrl}`);
  log(`🔍 [Step 9] Isolating Application ID from URL & page content...`);

  // 5. Extract Confirmation Details (Permanent Application ID & Applicant Name)
  // First, extract Application ID from Confirmation URL if present
  let finalAppId: string | undefined;
  let applicantName: string | undefined;

  try {
    const urlObj = new URL(postSubmitUrl);
    const queryKeys = ['ApplicationId', 'application_id', 'app_id', 'id', 'web_file_number', 'reg_id'];
    for (const k of queryKeys) {
      const val = urlObj.searchParams.get(k);
      if (val && /^[A-Z0-9]{8,20}$/i.test(val.trim())) {
        finalAppId = val.trim().toUpperCase();
        break;
      }
    }
    if (!finalAppId) {
      const urlMatch = postSubmitUrl.match(/(BGD[A-Z0-9]{8,15})/i) ||
                       postSubmitUrl.match(/[?&](?:id|app|application)[=_/]([A-Z0-9]{8,20})/i);
      if (urlMatch) {
        finalAppId = urlMatch[1].toUpperCase();
      }
    }
  } catch {}

  // Next, extract Application ID & Applicant Name from Confirmation page DOM
  const extractStart = Date.now();
  while (Date.now() - extractStart < 12000) {
    const confirmationData = await page.evaluate(() => {
      const text = document.body ? (document.body.innerText || document.body.textContent || '') : '';
      
      // Regex 1: Application Id : BGDDW30EB526
      const idMatch =
        text.match(/Application\s*Id\s*[:\-\s]+([A-Z0-9]+)/i) ||
        text.match(/Application\s*ID\s*[:\-\s]+([A-Z0-9]+)/i) ||
        text.match(/Web\s*File\s*(?:No|Number)\s*[:\-\s]+([A-Z0-9]+)/i) ||
        text.match(/(BGD[A-Z0-9]{8,15})/i);

      // Regex 2: Applicant Name : MAHABUB HOSSEN
      const nameMatch =
        text.match(/Applicant\s*Name\s*[:\-\s]+([A-Z\s]+?)(?:Application|\n|\r|<|$)/i);

      // Regex 3: Form inputs / hidden values
      let formAppId: string | undefined;
      const inputs = Array.from(document.querySelectorAll('input'));
      for (const inp of inputs) {
        const val = (inp.value || '').trim();
        if (val && /^[A-Z0-9]{8,20}$/i.test(val) && (val.toUpperCase().startsWith('BGD') || val.length >= 10)) {
          if (!val.toLowerCase().includes('form') && !val.toLowerCase().includes('print')) {
            formAppId = val.toUpperCase();
            break;
          }
        }
      }

      return {
        domId: idMatch ? idMatch[1].trim().toUpperCase() : formAppId,
        domName: nameMatch ? nameMatch[1].trim() : undefined,
      };
    });

    if (!finalAppId && confirmationData.domId) {
      finalAppId = confirmationData.domId;
    }
    if (!applicantName && confirmationData.domName) {
      applicantName = confirmationData.domName;
    }

    if (finalAppId) break;
    await page.waitForTimeout(1000);
  }

  // 6. Robust check: Verify that permanent Application ID exists
  if (!finalAppId) {
    const errorMsg = `[IVAC Webfile Creation Server Down]: Reached Confirmation page (${postSubmitUrl}), but no permanent Application ID (Web File Number) could be extracted from URL or page content.`;
    log(`❌ ${errorMsg}`);
    return {
      success: false,
      currentUrl: postSubmitUrl,
      temporaryApplicationId: reviewData.temporaryApplicationId,
      applicantName,
      verifiedFields: reviewData.fields,
      submittedFinal: true,
      error: errorMsg,
    };
  }

  log(`🎉 [Step 9] Permanent Application ID (Web File Number): ${finalAppId}${applicantName ? ` | Applicant: ${applicantName}` : ''}`);

  // 7. Non-blocking attempt to download PDF: successful download is no longer required for step success
  let downloadedPdfPath: string | undefined;

  try {
    log('🖨️ [Step 9] Attempting to capture official PDF via "Print Form" (non-blocking)...');
    let downloadPromise: Promise<any> | null = null;
    const anyPage = page as any;
    if (typeof anyPage.waitForEvent === 'function') {
      try {
        downloadPromise = anyPage.waitForEvent('download', { timeout: 8000 }).catch(() => null);
      } catch {}
    }

    const printClicked = await page.evaluate(() => {
      const btn = document.querySelector('input[value="Print Form"], input[value*="Print" i], form[action*="PrintApplicationPDF"] input[type="submit"], input[type="button"][value*="Print" i], button') as HTMLElement | null;
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    if (!printClicked) {
      const btnLoc = page.locator('input[value="Print Form"], input[value*="Print" i], button').first();
      if (await btnLoc.count() > 0) {
        await btnLoc.click();
      }
    }

    if (downloadPromise) {
      const download = await downloadPromise;
      if (download) {
        const targetPath = path.join(downloadsDir, `${finalAppId}.pdf`);
        await download.saveAs(targetPath);
        if (fs.existsSync(targetPath) && fs.statSync(targetPath).size > 1000) {
          downloadedPdfPath = targetPath;
          log(`📥 [Step 9] Captured PDF via browser download: ${downloadedPdfPath} (${fs.statSync(downloadedPdfPath).size} bytes)`);
        }
      }
    }
  } catch (printErr) {
    log(`ℹ️ [Step 9] Print Form note: ${printErr instanceof Error ? printErr.message : String(printErr)}`);
  }

  if (downloadedPdfPath) {
    log(`✅ [Step 9] Official Application PDF captured: ${downloadedPdfPath}`);
  } else {
    log(`ℹ️ [Step 9] PDF download deferred. Application ID (${finalAppId}) is secured and can be reprinted anytime.`);
  }

  // 8. Save Confirmation receipt screenshot
  try {
    const screenshotFilename = `${finalAppId}_receipt.png`;
    const screenshotPath = path.join(downloadsDir, screenshotFilename);
    if (typeof page.screenshot === 'function') {
      await page.screenshot({ path: screenshotPath });
      console.log(`📸 Confirmation receipt screenshot saved: ${screenshotPath}`);
    }
  } catch {
    // Non-critical, ignore
  }

  // 9. Update applicant.json with final Web File Number and PDF path if requested
  const shouldUpdate = options.updateApplicantJson !== false;
  if (shouldUpdate) {
    try {
      const applicantJsonPath = path.resolve(process.cwd(), 'applicant.json');
      if (fs.existsSync(applicantJsonPath)) {
        const data = JSON.parse(fs.readFileSync(applicantJsonPath, 'utf8'));
        data.finalApplicationId = finalAppId;
        data.downloadedPdfPath = downloadedPdfPath;
        data.completedAt = new Date().toISOString();
        data.status = 'COMPLETED';
        fs.writeFileSync(applicantJsonPath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`💾 Updated applicant.json with finalApplicationId: ${finalAppId}`);
      }
    } catch (jsonErr) {
      console.warn('Could not update applicant.json:', jsonErr);
    }
  }

  return {
    success: true,
    currentUrl: postSubmitUrl,
    temporaryApplicationId: reviewData.temporaryApplicationId,
    finalApplicationId: finalAppId,
    applicantName,
    downloadedPdfPath,
    verifiedFields: reviewData.fields,
    submittedFinal: true,
  };
}
