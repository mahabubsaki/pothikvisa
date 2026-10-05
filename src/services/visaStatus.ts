import { initStagehand } from '@/stagehand';
import { solveCaptcha, getCaptchaBuffer } from './captcha';

export interface VisaStatusResult {
  success: boolean;
  found: boolean;
  webFileNumber: string;
  passportNumber: string;
  status: string;
  statusTextFull: string;
  statusBn: string;
  rawText: string;
  checkedAt: string;
  error?: string;
}

/**
 * Translates official portal status string to clear Bengali description.
 */
function translateStatusToBn(statusText: string): string {
  const upper = statusText.toUpperCase();
  if (upper.includes('UNDER PROCESS')) {
    return 'প্রক্রিয়াধীন রয়েছে (দূতাবাসে যাচাইকরণ চলছে)';
  }
  if (upper.includes('GRANTED') || upper.includes('ISSUED')) {
    return 'ভিসা অনুমোদিত / ইস্যু করা হয়েছে';
  }
  if (upper.includes('DISPATCHED') || upper.includes('TRANSIT')) {
    return 'পাসপোর্ট আইভ্যাক সেন্টারে পাঠানো হয়েছে';
  }
  if (upper.includes('READY FOR COLLECTION') || upper.includes('DELIVERED')) {
    return 'পাসপোর্ট ডেলিভারির জন্য প্রস্তুত';
  }
  if (upper.includes('REJECTED')) {
    return 'আবেদন প্রত্যাখ্যাত হয়েছে';
  }
  if (upper.includes('NOT FOUND')) {
    return 'সরকারি সার্ভারে কোনো তথ্য পাওয়া যায়নি';
  }
  return statusText;
}

/**
 * Automates official Indian Visa Bangladesh Status Enquiry portal
 * at https://indianvisa-bangladesh.nic.in/visa/StatusEnquiry
 */
export async function checkVisaStatus(
  webFileNumber: string,
  passportNumber: string,
  maxRetries = 3
): Promise<VisaStatusResult> {
  const cleanFileNo = (webFileNumber || '').trim().toUpperCase();
  const cleanPassport = (passportNumber || '').trim().toUpperCase();

  if (!cleanFileNo || !cleanPassport) {
    return {
      success: false,
      found: false,
      webFileNumber: cleanFileNo,
      passportNumber: cleanPassport,
      status: 'INVALID_INPUT',
      statusTextFull: 'Application Status :- Missing Required Credentials',
      statusBn: 'ফাইল নম্বর বা পাসপোর্ট নম্বর সঠিক নয়',
      rawText: 'Web File Number and Passport Number are required',
      checkedAt: new Date().toISOString(),
      error: 'Missing required credentials',
    };
  }

  let session: Awaited<ReturnType<typeof initStagehand>> | null = null;

  try {
    session = await initStagehand();
    const { page } = session;

    console.log(`\n🔍 Checking official visa status for ${cleanFileNo} / ${cleanPassport}...`);

    // 1. Visit landing page first to establish valid session cookies
    await page.goto('https://indianvisa-bangladesh.nic.in/visa/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // 2. Navigate to Status Enquiry
    await page.goto('https://indianvisa-bangladesh.nic.in/visa/StatusEnquiry', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // 3. If redirected to index.html, click the Visa Status Enquiry link
    const curUrl = await page.url();
    if (!curUrl.includes('StatusEnquiry')) {
      const link = page.locator('a[href*="StatusEnquiry"], a:has-text("Visa Status Enquiry")').first();
      await link.click().catch(() => {});
    }

    let attempt = 0;
    let statusText = '';
    let statusTextFull = '';
    let isFound = false;

    while (attempt < maxRetries) {
      attempt++;
      console.log(`🔄 Status Enquiry submission attempt ${attempt}/${maxRetries}...`);

      // Wait for application_id input and captcha image
      await page.waitForSelector('#application_id', { timeout: 15000 });
      await page.waitForSelector('#capt', { timeout: 15000 });

      // Extract and solve captcha
      const captchaBuf = await getCaptchaBuffer(page);
      if (!captchaBuf || captchaBuf.length === 0) {
        throw new Error('Failed to capture captcha image from portal');
      }

      const captchaText = await solveCaptcha(captchaBuf);
      console.log(`🤖 Solved Status Enquiry captcha: "${captchaText}"`);

      // Fill in fields
      await page.evaluate(
        ({ fileNo, passNo, cap }: { fileNo: string; passNo: string; cap: string }) => {
          const appInput = document.getElementById('application_id') as HTMLInputElement;
          const passInput = document.getElementById('passport_no') as HTMLInputElement;
          const capInput = document.getElementById('captcha') as HTMLInputElement;
          if (appInput) appInput.value = fileNo;
          if (passInput) passInput.value = passNo;
          if (capInput) capInput.value = cap;
        },
        { fileNo: cleanFileNo, passNo: cleanPassport, cap: captchaText }
      );

      // Click "Check Status" submit button
      await page.evaluate(() => {
        const btn = document.querySelector('input[type="submit"][name="submit_btn"]') as HTMLInputElement;
        if (btn) btn.click();
      });
      await page.waitForLoadState('domcontentloaded', 20000).catch(() => {});

      // Give portal 1.5s to settle
      await page.waitForTimeout(1500);

      // Inspect page response
      const pageInfo = await page.evaluate(() => {
        const text = document.body ? document.body.innerText : '';
        const hasForm = Boolean(document.getElementById('application_id'));
        return { text, hasForm };
      });

      // Check if captcha was wrong and page refreshed back to form
      if (pageInfo.hasForm && pageInfo.text.toLowerCase().includes('enter above text')) {
        console.warn(`⚠️ Captcha mismatch on attempt ${attempt}. Retrying with fresh captcha...`);
        continue;
      }

      // Check for results from paragraph or body text
      const pText = await page.evaluate(() => {
        const p = document.querySelector('p.error_para, p') as HTMLElement | null;
        return p ? p.innerText.trim() : '';
      });

      const rawText = pText || pageInfo.text;

      if (rawText.toLowerCase().includes('could not be found')) {
        statusText = 'Details entered by you could not be found';
        statusTextFull = 'Application Status :- Details entered by you could not be found';
        isFound = false;
        break;
      }

      const statusMatch = rawText.match(/Application\s*Status\s*:-\s*([^\n\r<]+)/i);
      if (statusMatch) {
        statusText = statusMatch[1].trim();
        statusTextFull = `Application Status :- ${statusText}`;
        isFound = true;
        break;
      }

      // If text contains Under Process
      if (rawText.toLowerCase().includes('under process')) {
        statusText = 'Under Process';
        statusTextFull = 'Application Status :- Under Process';
        isFound = true;
        break;
      }

      // Generic fallback
      statusText = rawText.trim().slice(0, 150);
      statusTextFull = `Application Status :- ${statusText}`;
      isFound = false;
      break;
    }

    const checkedAt = new Date().toISOString();
    const statusBn = translateStatusToBn(statusText);

    console.log(`✅ Status Enquiry Result: "${statusText}" (found: ${isFound})`);

    return {
      success: true,
      found: isFound,
      webFileNumber: cleanFileNo,
      passportNumber: cleanPassport,
      status: statusText || 'NOT_FOUND',
      statusTextFull: statusTextFull || `Application Status :- ${statusText || 'NOT_FOUND'}`,
      statusBn,
      rawText: statusText,
      checkedAt,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('❌ Status Enquiry automation error:', errorMsg);
    return {
      success: false,
      found: false,
      webFileNumber: cleanFileNo,
      passportNumber: cleanPassport,
      status: 'ERROR',
      statusTextFull: 'Application Status :- System Error',
      statusBn: 'স্ট্যাটাস যাচাই করতে সমস্যা হয়েছে, কিছুক্ষণ পর পুনরায় চেষ্টা করুন',
      rawText: errorMsg,
      checkedAt: new Date().toISOString(),
      error: errorMsg,
    };
  } finally {
    if (session) {
      await session.close().catch(() => {});
    }
  }
}
