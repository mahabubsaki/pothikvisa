import { type Page, type Response } from '@browserbasehq/stagehand';
import { IvacAccount, Step1Result } from './types';
import { waitForResponse } from './httpHelpers';
import { clickButtonSafe, waitForEnabled, handleCloudflareTurnstile } from './domHelpers';

/**
 * Step 1: Automates Sign In on appointment.ivacbd.com/signin
 * Intercepts POST /auth/v4-sign_in to verify authentication response status.
 */
export async function executeStep1(page: Page, account: IvacAccount): Promise<Step1Result> {
  const currentUrl = await page.url();

  // 1. Check if already past sign-in (e.g. valid session restored)
  if (!currentUrl.includes('/signin') && (currentUrl.includes('/appointment') || currentUrl.endsWith('.com/'))) {
    console.log('⚡ [Step 1] Already authenticated, skipping sign-in.');
    return {
      success: true,
      alreadyAuthenticated: true,
      currentUrl: await page.url(),
    };
  }

  // 2. Navigate to /signin if not already there
  if (!currentUrl.includes('/signin')) {
    console.log('🌐 [Step 1] Navigating to https://appointment.ivacbd.com/signin...');
    await page.goto('https://appointment.ivacbd.com/signin');
    await page.waitForTimeout(1000);
  }

  // 3. Fill Phone Number
  console.log(`📱 [Step 1] Entering phone number: ${account.phone}`);
  await page.waitForSelector('input[name="phone"]', { timeout: 15000 });
  const phoneLocator = page.locator('input[name="phone"]').first();
  await phoneLocator.fill(account.phone);

  if (!account.password) {
    throw new Error('Password is required for Step 1 sign-in.');
  }

  const passwordLocator = page.locator('input[name="password"]').first();
  const submitButton = page.locator('button[type="submit"]').first();

  // 4. PRE-FLIGHT LATENCY PROBE LOOP (PROTECT 3 DAILY OTP QUOTA)
  // Threshold: 15 seconds (Balances peak traffic vs. SMS delivery drop-off)
  const LATENCY_THRESHOLD_MS = 15000;
  const MAX_PROBE_RETRIES = 2500; // Continuous monitoring (up to ~5-6 hours) until server latency is healthy
  let probeSuccess = false;
  let probeAttempt = 0;

  console.log('\n🛡️ [Step 1] PRE-FLIGHT CHECK: Probing server latency with dummy credentials...');
  console.log(`   Rule: Must respond under ${LATENCY_THRESHOLD_MS / 1000}s before sending real password (Max 3 OTP/day limit).`);

  while (!probeSuccess && probeAttempt < MAX_PROBE_RETRIES) {
    probeAttempt++;
    const dummyPassword = `ProbeTest@${Date.now()}#`;

    console.log(`\n⏱️ [Step 1] [Probe ${probeAttempt}/${MAX_PROBE_RETRIES}] Testing server latency...`);
    await passwordLocator.fill(dummyPassword);

    // Wait until Turnstile unlocks button
    await handleCloudflareTurnstile(page, 4000);
    await waitForEnabled(page, 'button[type="submit"]', 6000);

    const probeStartTime = Date.now();
    const probeResponsePromise = waitForResponse(
      page,
      (res: Response) => res.url().includes('/auth/v4-sign_in') && res.status() !== 0,
      LATENCY_THRESHOLD_MS + 2000
    ).catch(() => null);

    const clicked = await submitButton.click().then(() => true).catch(async () => {
      return await clickButtonSafe(page, { selector: 'button[type="submit"]' });
    });

    if (!clicked) {
      console.warn('⚠️ [Step 1] Could not click submit button, retrying probe...');
      await page.waitForTimeout(2000);
      continue;
    }

    const probeResponse = await probeResponsePromise;
    const probeDuration = Date.now() - probeStartTime;

    if (!probeResponse) {
      console.warn(`⚠️ [Step 1] Probe ${probeAttempt} TIMED OUT (> ${LATENCY_THRESHOLD_MS / 1000}s). Server is congested.`);
      console.log('   Cooling down 4s for Cloudflare Turnstile reset before re-probing...');
      await page.waitForTimeout(4000);
      continue;
    }

    console.log(`📡 [Step 1] Probe ${probeAttempt} returned in ${probeDuration}ms (HTTP ${probeResponse.status()})`);

    if (probeDuration > LATENCY_THRESHOLD_MS) {
      console.warn(
        `⚠️ [Step 1] Server latency (${probeDuration}ms) exceeded ${LATENCY_THRESHOLD_MS / 1000}s threshold!`
      );
      console.log('   Waiting 4s for server load to ease before re-probing...');
      await page.waitForTimeout(4000);
      continue;
    }

    // Healthy response under threshold
    console.log(`⚡ [Step 1] Server latency is HEALTHY (${probeDuration}ms < ${LATENCY_THRESHOLD_MS / 1000}s)!`);
    probeSuccess = true;
  }

  if (!probeSuccess) {
    throw new Error(
      `⛔ [Step 1] Server remained unresponsive (> ${LATENCY_THRESHOLD_MS / 1000}s) after ${MAX_PROBE_RETRIES} probe attempts. Aborting to preserve your daily OTP quota!`
    );
  }

  // Allow 2s for page to settle and Turnstile to produce fresh token for real login
  console.log('⏳ [Step 1] Waiting 2s for fresh Cloudflare Turnstile token for real login...');
  await page.waitForTimeout(2000);

  // 5. Submit REAL Password for actual OTP generation
  console.log('🔒 [Step 1] Entering REAL password...');
  await passwordLocator.fill(account.password);

  console.log('⏳ [Step 1] Waiting for Turnstile ready state before real submit...');
  await handleCloudflareTurnstile(page, 4000);
  await waitForEnabled(page, 'button[type="submit"]', 8000);

  console.log('🚀 [Step 1] Submitting REAL credentials and intercepting POST /auth/v4-sign_in...');
  const realResponsePromise = waitForResponse(
    page,
    (res: Response) => res.url().includes('/auth/v4-sign_in') && res.status() !== 0,
    30000
  );

  await submitButton.click().catch(async () => {
    await clickButtonSafe(page, { selector: 'button[type="submit"]' });
  });

  // 6. Evaluate HTTP Response
  const response = await realResponsePromise;
  const status = response.status();
  let responseBody: any = {};
  try {
    responseBody = await response.json();
  } catch {
    // Non-JSON response
  }

  console.log(`📡 [Step 1] Real /auth/v4-sign_in responded with HTTP ${status}`);

  if (status === 200 && (responseBody.status === 'SUCCESS' || responseBody.statusCode === 200 || responseBody.data?.requestId)) {
    const requestId = responseBody.data?.requestId || responseBody.requestId;
    console.log(`✅ [Step 1] Sign-in successful! Request ID: ${requestId || 'N/A'}`);
    return {
      success: true,
      requestId,
      currentUrl: await page.url(),
    };
  }

  const errorMessage = responseBody.message || `Sign in failed with HTTP ${status}`;
  console.error(`❌ [Step 1] Error: ${errorMessage}`);
  return {
    success: false,
    currentUrl: await page.url(),
    error: errorMessage,
  };
}
