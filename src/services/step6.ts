import fs from 'fs';
import { type Page } from '@browserbasehq/stagehand';
import { preparePhoto } from '../utils/mediaProcessor';
import type { IndianVisaPortalWindow, JcropInstance } from './portalBrowserTypes';

export interface Step6Result {
  success: boolean;
  currentUrl: string;
  error?: string;
}

/**
 * Automates Step 6: Photo Upload on indianvisa-bangladesh.nic.in/visa/PhotoUpload
 * If a photo path is provided, uploads it, automatically applies full-frame cropping,
 * and saves.
 */
export async function executeStep6(
  page: Page,
  photoFilePath?: string,
  action: 'upload' | 'exit' = 'upload'
): Promise<Step6Result> {
  const currentUrl = await page.url();
  if (!currentUrl.includes('/visa/PhotoUpload') && !currentUrl.includes('/visa/UploadImage')) {
    throw new Error(`Expected to be on /visa/PhotoUpload or /visa/UploadImage, but currently on: ${currentUrl}`);
  }

  // Ensure DOM is ready
  await page.waitForSelector('#image_error_id, #continue, #exit', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(400);

  if (action === 'upload' && photoFilePath && fs.existsSync(photoFilePath)) {
    // 0. Automatically normalize format, dimensions, JFIF header, and size
    const prepared = await preparePhoto(photoFilePath);
    const uploadFilePath = prepared.filePath;
    console.log(`📸 [Step 6] Prepared photograph: ${uploadFilePath} (${prepared.width}x${prepared.height}, ${(prepared.sizeBytes / 1024).toFixed(1)} KB)`);

    // 1. Upload photo to #image_error_id
    await page.locator('#image_error_id').setInputFiles(uploadFilePath);
    await page.evaluate(() => {
      const win = window as unknown as IndianVisaPortalWindow;
      if (typeof win.$ === 'function') {
        win.$('#image_error_id').trigger('change');
      }
    });
    await page.waitForTimeout(1000);

    // 2. Click Upload Photo
    await page.evaluate(() => {
      const win = window as unknown as IndianVisaPortalWindow;
      win.$?.('input[type=submit]').removeAttr('clicked');
      win.$?.('#continue').attr('clicked', 'true');
    });
    await page.locator('#continue').click();
    await page.waitForTimeout(3000);

    // 3. Handle Crop Screen if present
    const hasCrop = await page.evaluate(() => {
      const win = window as unknown as IndianVisaPortalWindow;
      const target = win.$?.('#target');
      if (target && typeof target.length === 'number' && target.length > 0) {
        const jcrop = target.data?.('Jcrop') as JcropInstance | undefined;
        const img = target[0] as HTMLImageElement | undefined;
        const w = img?.naturalWidth || 600;
        const h = img?.naturalHeight || 600;

        if (jcrop && typeof jcrop.setSelect === 'function') {
          jcrop.setSelect([0, 0, w, h]);
        }
        win.$?.('#x1').val(0);
        win.$?.('#y1').val(0);
        win.$?.('#x2').val(w);
        win.$?.('#y2').val(h);
        win.$?.('#w').val(w);
        win.$?.('#h').val(h);
        return true;
      }
      return false;
    });

    if (hasCrop) {
      console.log('📐 [Step 6] Applied full-frame crop coordinates (100% frame). Saving crop...');
      const clicked = await page.evaluate(() => {
        const btn = document.querySelector('input[value="Crop and Save"]') as HTMLInputElement;
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      });
      if (!clicked) {
        await page.locator('input[value="Crop and Save"]').click();
      }
      await page.waitForTimeout(3000);
    }

    // 4. Click Save and Continue on photo review confirmation screen
    console.log('💾 [Step 6] Confirming photograph and advancing to Document Upload...');
    const confirmed = await page.evaluate(() => {
      const btn = document.querySelector('input[value="Save and Continue"]') as HTMLInputElement;
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    if (!confirmed) {
      const saveBtn = page.locator('input[value="Save and Continue"]');
      if ((await saveBtn.count()) > 0) {
        await saveBtn.first().click();
      }
    }
    await page.waitForTimeout(3000);

    const finalUrl = await page.url();
    return {
      success: true,
      currentUrl: finalUrl,
    };
  }

  // If user wants to exit, or if photo was not provided
  console.log('🚪 [Step 6] Exiting / skipping photo upload to proceed...');
  const exitClicked = await page.evaluate(() => {
    const btn = document.querySelector('#exit, input[value="Exit"], input[value="Upload Later"]') as HTMLElement;
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
