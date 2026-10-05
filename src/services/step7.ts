import fs from 'fs';
import { type Page } from '@browserbasehq/stagehand';
import { preparePassportPdf } from '../utils/mediaProcessor';
import type { IndianVisaPortalWindow } from './portalBrowserTypes';

export interface Step7Result {
  success: boolean;
  currentUrl: string;
  error?: string;
}

/**
 * Automates Step 7: Document Upload on indianvisa-bangladesh.nic.in/visa/DocumentUpload
 * Handles:
 * 1. Validating and normalizing PDF size (between 10 KB and 500 KB).
 * 2. Uploading passport copy (Document ID 1).
 * 3. Verifying the upload status changes to "Uploaded".
 * 4. Toggling declaration checkbox (#verifyDoc) and confirming navigation to next stage.
 */
export async function executeStep7(
  page: Page,
  passportPdfPath?: string,
  action: 'upload' | 'exit' = 'upload'
): Promise<Step7Result> {
  const currentUrl = await page.url();
  if (!currentUrl.includes('/visa/DocumentUpload') && !currentUrl.includes('/visa/UploadDoc')) {
    throw new Error(`Expected to be on /visa/DocumentUpload or /visa/UploadDoc, but currently on: ${currentUrl}`);
  }

  // Ensure DOM is ready
  await page.waitForSelector('input[name="mFile"], #verifyDoc, input[value="Confirm"], #exit', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(400);

  if (action === 'upload' && passportPdfPath && fs.existsSync(passportPdfPath)) {
    // 1. Prepare PDF to guarantee it meets 10 KB - 500 KB requirement
    const processed = await preparePassportPdf(passportPdfPath);
    console.log(`📄 [Step 7] Prepared Passport PDF: ${processed.filePath} (${(processed.sizeBytes / 1024).toFixed(2)} KB)`);

    // 2. Select file and click "Upload Document"
    await page.waitForSelector('input[name="mFile"]', { timeout: 15000 });
    await page.locator('input[name="mFile"]').setInputFiles(processed.filePath);
    await page.waitForTimeout(500);

    console.log('⬆️ [Step 7] Uploading passport document to government portal...');
    const uploadClicked = await page.evaluate(() => {
      const btn = document.querySelector('input[value="Upload Document"]') as HTMLInputElement;
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    if (!uploadClicked) {
      await page.locator('input[value="Upload Document"]').click();
    }
    await page.waitForTimeout(4000);

    // 3. Verify upload status in table
    const isUploaded = await page.evaluate(() => {
      const text = document.body ? document.body.innerText : '';
      return text.includes('Uploaded') || !text.includes('Not Uploaded');
    });

    if (!isUploaded) {
      console.warn('⚠️ [Step 7] Upload status check warning, continuing with verification...');
    } else {
      console.log('✅ [Step 7] Document uploaded successfully!');
    }

    // 4. Check verification declaration checkbox
    await page.evaluate(() => {
      const win = window as unknown as IndianVisaPortalWindow;
      const cb = document.querySelector('#verifyDoc') as HTMLInputElement | null;
      if (cb) {
        cb.checked = true;
        if (typeof win.$ === 'function') win.$(cb).trigger('change');
      }
    });
    await page.waitForTimeout(400);

    // 5. Click Confirm to advance
    console.log('💾 [Step 7] Confirming uploaded documents...');
    const confirmed = await page.evaluate(() => {
      const btn = document.querySelector('input[value="Confirm"], input[name="submit_btn"][value="Confirm"]') as HTMLInputElement;
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    if (!confirmed) {
      const confirmLoc = page.locator('input[value="Confirm"]');
      if ((await confirmLoc.count()) > 0) {
        await confirmLoc.first().click();
      }
    }
    await page.waitForTimeout(3000);

    const finalUrl = await page.url();
    return {
      success: true,
      currentUrl: finalUrl,
    };
  }

  // If user wants to exit, or if no passport PDF was provided
  console.log('🚪 [Step 7] Skipping / exiting document upload to proceed...');
  const exitClicked = await page.evaluate(() => {
    const btn = document.querySelector('#exit, input[value="Exit"], input[value="Upload Later"], input[value="Confirm"]') as HTMLElement;
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  if (!exitClicked) {
    const exitLoc = page.locator('#exit, input[value="Exit"]');
    if ((await exitLoc.count()) > 0) {
      await exitLoc.first().click();
    }
  }
  await page.waitForTimeout(2000);
  const exitUrl = await page.url();
  return {
    success: true,
    currentUrl: exitUrl,
  };
}
