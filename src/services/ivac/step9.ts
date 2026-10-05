import fs from 'node:fs';
import path from 'node:path';
import { type Page } from '@browserbasehq/stagehand';
import { Step9Result } from './types';

/**
 * Step 9: Finalizes Handover and holds 15-minute manual payment window.
 * Saves checkout link to payment-links.json and keeps browser open.
 */
export async function executeStep9(
  page: Page,
  checkoutUrl: string,
  accountPhone: string,
  holdMinutes = 15
): Promise<Step9Result> {
  const paymentRecord = {
    timestamp: new Date().toISOString(),
    phone: accountPhone,
    amount: 1500,
    checkoutUrl,
  };

  // 1. Persist record to payment-links.json
  const linksFile = path.resolve(process.cwd(), 'payment-links.json');
  let records: any[] = [];
  try {
    if (fs.existsSync(linksFile)) {
      records = JSON.parse(fs.readFileSync(linksFile, 'utf-8'));
      if (!Array.isArray(records)) records = [];
    }
    records.push(paymentRecord);
    fs.writeFileSync(linksFile, JSON.stringify(records, null, 2), 'utf-8');
    console.log(`💾 [Step 9] Saved checkout record to: ${linksFile}`);
  } catch (err) {
    console.warn(`⚠️ [Step 9] Could not write payment-links.json: ${err}`);
  }

  // 2. High-visibility terminal alert banner
  console.log('\n================================================================');
  console.log('🎉🎉🎉  IVAC APPOINTMENT SLOT SECURED & CHECKOUT READY!  🎉🎉🎉');
  console.log('================================================================');
  console.log(`📱 Phone Account: ${accountPhone}`);
  console.log(`💰 Payable Fee:   BDT 1,500`);
  console.log(`🔗 Checkout URL:  \x1b[36m${checkoutUrl}\x1b[0m`);
  console.log('================================================================');
  console.log(`⏱️  Browser is now held open for ${holdMinutes} minutes.`);
  console.log('👉 Please scan the DGePay Bangla QR with your bKash / Nagad / Bank app!');
  console.log('================================================================\n');

  // Trigger terminal beep
  process.stdout.write('\x07');

  // 3. 15-minute holding countdown loop (in 30s increments)
  const totalSeconds = holdMinutes * 60;
  const intervalSeconds = 30;
  let elapsed = 0;

  while (elapsed < totalSeconds) {
    const remainingSeconds = totalSeconds - elapsed;
    const remMins = Math.floor(remainingSeconds / 60);
    const remSecs = remainingSeconds % 60;

    console.log(`⏳ [Step 9] [Manual Payment Active] Time remaining: ${remMins}m ${remSecs}s...`);
    await page.waitForTimeout(intervalSeconds * 1000);
    elapsed += intervalSeconds;
  }

  console.log('🏁 [Step 9] 15-minute payment window completed.');
  return {
    success: true,
    checkoutUrl,
    savedToPath: linksFile,
    idleCompleted: true,
  };
}
