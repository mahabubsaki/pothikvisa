import fs from 'node:fs';
import path from 'node:path';
import { type Page, type Response } from '@browserbasehq/stagehand';
import { IvacAccount, Step2Result } from './types';
import { waitForResponse, saveSessionState } from './httpHelpers';
import { clickButtonSafe } from './domHelpers';

/**
 * Normalizes phone numbers into standard Bangladeshi 11-digit format (01XXXXXXXXX).
 */
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('8801') && digits.length === 13) {
    return digits.slice(2);
  }
  if (digits.startsWith('01') && digits.length === 11) {
    return digits;
  }
  if (digits.startsWith('1') && digits.length === 10) {
    return '0' + digits;
  }
  return digits;
}

/**
 * Polls the Cloudflare OTP Relay server until the SMS OTP matching the phone number is captured.
 * Matches the proven implementation from D:\goethe-browser-automation.
 */
async function pollRelayForOtp(phone: string, timeoutMs = 300000): Promise<string> {
  const targetPhone = normalizePhone(phone);
  const relayUrl = (process.env.OTP_RELAY_URL || 'https://ivac-otp-relay.mcr21191999.workers.dev').replace(/\/$/, '');
  const startTime = Date.now();

  console.log(`\n☁️ [Step 2] Polling Cloudflare Relay for OTP (Target Phone: ${targetPhone})...`);
  console.log(`   Endpoint: ${relayUrl}/get?phone=${targetPhone}`);

  while (Date.now() - startTime < timeoutMs) {
    try {
      const res = await fetch(`${relayUrl}/get?phone=${encodeURIComponent(targetPhone)}`);
      if (res.ok) {
        const data: any = await res.json();
        if (data.ok && data.otp) {
          const returnedPhone = data.phone ? normalizePhone(data.phone) : null;

          // Strict phone isolation matching
          if (!returnedPhone || returnedPhone === targetPhone || targetPhone.endsWith(returnedPhone) || returnedPhone.endsWith(targetPhone)) {
            console.log(`⚡ [Step 2] Fresh OTP resolved from Cloud Relay: ${data.otp} (Phone: ${returnedPhone || targetPhone})`);

            // Clear the consumed OTP from relay
            fetch(`${relayUrl}/clear?phone=${encodeURIComponent(targetPhone)}`).catch(() => {});
            return String(data.otp).trim();
          } else {
            console.warn(`⚠️ [Step 2] Ignored OTP for phone ${returnedPhone} (waiting for ${targetPhone})`);
          }
        }
      }
    } catch {
      // Network hiccup, retry
    }

    const elapsedSecs = Math.round((Date.now() - startTime) / 1000);
    process.stdout.write(`⏳ [Step 2] Awaiting SMS OTP on relay... (${elapsedSecs}s elapsed)\r`);
    await new Promise((r) => setTimeout(r, 1000));
  }

  throw new Error(`Timed out waiting for OTP from Cloud Relay for ${targetPhone} after ${Math.round(timeoutMs / 1000)}s`);
}

/**
 * Step 2: Automates Phone OTP Verification on /verify-login-phone-otp
 * Polls the Cloud Relay automatically, enters OTP, and saves storageState for Zero-OTP future runs.
 */
export async function executeStep2(page: Page, account: IvacAccount): Promise<Step2Result> {
  const currentUrl = await page.url();

  // 1. Ensure we are on the OTP page or already past it
  if (!currentUrl.includes('/verify-login-phone-otp')) {
    if (currentUrl.includes('/appointment') || currentUrl.endsWith('.com/')) {
      console.log('⚡ [Step 2] Already past OTP verification.');
      return {
        success: true,
        currentUrl: await page.url(),
      };
    }
  }

  // 2. Obtain OTP from account config or poll Cloud Relay automatically (no human prompt!)
  let otpCode = account.otp;
  if (!otpCode || otpCode.length < 4) {
    otpCode = await pollRelayForOtp(account.phone, 120000);
  }

  console.log(`\n🔢 [Step 2] Entering OTP code into form: ${otpCode}`);

  // 3. Enter OTP into input slots
  await page.evaluate((code: string) => {
    const slots = Array.from(
      document.querySelectorAll<HTMLInputElement>(
        'input[data-input-otp-slot], input[autocomplete="one-time-code"], input[type="text"]'
      )
    );
    if (slots.length >= 4) {
      slots.forEach((slot, idx) => {
        if (code[idx]) {
          slot.focus();
          slot.value = code[idx];
          slot.dispatchEvent(new Event('input', { bubbles: true }));
          slot.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      return;
    }
    const single = document.querySelector<HTMLInputElement>('input');
    if (single) {
      single.focus();
      single.value = code;
      single.dispatchEvent(new Event('input', { bubbles: true }));
      single.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, otpCode);

  // 4. Set up HTTP interception for POST /otp/verify-Signin_Otp
  console.log('🚀 [Step 2] Submitting OTP and intercepting POST /otp/verify-Signin_Otp...');
  const responsePromise = waitForResponse(
    page,
    (res: Response) => res.url().includes('/otp/verify-Signin_Otp') && res.status() !== 0,
    30000
  );

  // 5. Click "Verify OTP" button if not auto-submitted
  await clickButtonSafe(page, {
    selector: 'button[type="submit"]',
    textPattern: /verify otp|verify|submit/i,
    timeoutMs: 3000,
  });

  // 6. Evaluate HTTP Response
  const response = await responsePromise;
  const status = response.status();
  let responseBody: any = {};
  try {
    responseBody = await response.json();
  } catch {
    // Non-JSON
  }

  console.log(`📡 [Step 2] /otp/verify-Signin_Otp responded with HTTP ${status}`);

  if (status === 200 && (responseBody.data?.verified || responseBody.statusCode === 200 || responseBody.status === 'SUCCESS')) {
    console.log('✅ [Step 2] OTP Verified successfully!');

    // 7. Persist session storageState for Zero-OTP reuse
    const sessionsDir = path.resolve(process.cwd(), 'sessions');
    if (!fs.existsSync(sessionsDir)) {
      fs.mkdirSync(sessionsDir, { recursive: true });
    }
    const sessionFile = path.join(sessionsDir, `${account.phone}.json`);

    await saveSessionState(page, sessionFile);
    console.log(`💾 [Step 2] Persistent session saved to: ${sessionFile}`);

    return {
      success: true,
      token: responseBody.data?.token || responseBody.token,
      sessionSavedPath: sessionFile,
      currentUrl: await page.url(),
    };
  }

  const errorMessage = responseBody.message || `OTP verification failed with HTTP ${status}`;
  console.error(`❌ [Step 2] Error: ${errorMessage}`);
  return {
    success: false,
    currentUrl: await page.url(),
    error: errorMessage,
  };
}
