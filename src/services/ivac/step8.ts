import { type Page, type Response } from '@browserbasehq/stagehand';
import { Step8Result } from './types';
import { waitForResponse } from './httpHelpers';
import { clickButtonSafe, handleCloudflareTurnstile, waitForEnabled } from './domHelpers';

/**
 * Step 8: Automates Payment Invoice on /appointment/continue-payment
 * Clicks "Continue Payment" and intercepts the payment initiation call to extract checkoutUrl.
 */
export async function executeStep8(page: Page): Promise<Step8Result> {
  const currentUrl = await page.url();

  // 1. Ensure on /appointment/continue-payment
  if (!currentUrl.includes('/appointment/continue-payment')) {
    console.log('🌐 [Step 8] Navigating to https://appointment.ivacbd.com/appointment/continue-payment...');
    await page.goto('https://appointment.ivacbd.com/appointment/continue-payment');
    await page.waitForTimeout(1000);
  }

  // 2. Wait for invoice details and total amount to load
  console.log('⏳ [Step 8] Hydrating payment invoice data...');
  await page.waitForTimeout(1500);

  // 3. Solve Turnstile if present
  console.log('⏳ [Step 8] Waiting for payment button unlock (Turnstile resolution)...');
  await handleCloudflareTurnstile(page, 15000);
  await waitForEnabled(page, 'button, a', 15000);

  // 4. Set up interception for payment initiate call (DGePay endpoint)
  console.log('🚀 [Step 8] Intercepting payment initiation call...');
  const paymentPromise = waitForResponse(
    page,
    (res: Response) =>
      res.url().includes('/payment/') &&
      res.url().includes('/initiate') &&
      res.status() !== 0,
    30000
  ).catch(() => null);

  // 5. Click "Continue Payment"
  await clickButtonSafe(page, {
    selector: 'button, a',
    textPattern: /continue payment|continue to payment|proceed to payment/i,
    timeoutMs: 15000,
    waitForEnabled: true,
  });

  // 7. Check intercepted HTTP response
  const response = await paymentPromise;
  let checkoutUrl: string | undefined;

  if (response) {
    const status = response.status();
    console.log(`📡 [Step 8] Payment initiate responded with HTTP ${status}`);
    try {
      const resJson: any = await response.json();
      checkoutUrl = resJson.data?.paymentUrl || resJson.data?.GatewayPageURL || resJson.paymentUrl;
    } catch {
      // Non-JSON
    }
  }

  // Check if active page navigated to gateway
  const activeUrl = await page.url();
  if (!checkoutUrl && (activeUrl.includes('dgepay') || activeUrl.includes('payment') || activeUrl.includes('qr-code'))) {
    checkoutUrl = activeUrl;
  }

  if (checkoutUrl) {
    console.log(`\n🎉 [Step 8] DGePay Checkout URL captured: ${checkoutUrl}`);
    return {
      success: true,
      checkoutUrl,
      currentUrl: await page.url(),
    };
  }

  return {
    success: false,
    currentUrl: await page.url(),
    error: 'Failed to capture checkout URL from payment response or active window.',
  };
}
