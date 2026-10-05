import fs from 'node:fs';
import path from 'node:path';
import { type StagehandBrowser, type Stagehand, type Page } from '@browserbasehq/stagehand';

import { IvacBookingConfig, IvacRunnerResult } from './types';
import { restoreSessionState } from './httpHelpers';
import { executeStep1 } from './step1';
import { executeStep2 } from './step2';
import { executeStep3 } from './step3';
import { executeStep4 } from './step4';
import { executeStep5 } from './step5';
import { executeStep6 } from './step6';
import { executeStep7 } from './step7';
import { executeStep8 } from './step8';
import { executeStep9 } from './step9';

import { initStagehand } from '../../stagehand';

/**
 * Initializes Stagehand browser session with optional storageState session reuse.
 */
async function createIvacBrowser(phone: string, skipOtpIfSessionValid = true): Promise<{
  browser: StagehandBrowser;
  stagehand: Stagehand;
  page: Page;
  sessionRestored: boolean;
}> {
  const sessionPath = path.resolve(process.cwd(), 'sessions', `${phone}.json`);
  const hasSavedSession = fs.existsSync(sessionPath) && skipOtpIfSessionValid;

  console.log(`🤖 [IVAC Orchestrator] Initializing Stagehand Browser...`);
  if (hasSavedSession) {
    console.log(`🔑 [IVAC Orchestrator] Found saved session: ${sessionPath}. Enabling Zero-OTP mode!`);
  }

  const { browser, stagehand, page } = await initStagehand();
  let sessionRestored = false;

  // Verify whether the restored session is active
  if (hasSavedSession) {
    console.log(`🔍 [IVAC Orchestrator] Testing restored session on appointment portal...`);
    try {
      await page.goto('https://appointment.ivacbd.com/signin');
      await restoreSessionState(page, sessionPath);
      await page.goto('https://appointment.ivacbd.com/appointment/file-upload');
      await page.waitForTimeout(2000);

      const url = await page.url();

      if (!url.includes('/signin')) {
        console.log(`✨ [IVAC Orchestrator] Restored session is 100% VALID! Skipping Step 1 and Step 2.`);
        sessionRestored = true;
      } else {
        console.warn(`⚠️ [IVAC Orchestrator] Restored session expired. Falling back to clean Sign-In.`);
      }
    } catch {
      console.warn(`⚠️ [IVAC Orchestrator] Session probe encountered error. Proceeding to standard flow.`);
    }
  }

  return { browser, stagehand, page, sessionRestored };
}

/**
 * Main IVAC Orchestrator (Analogous to formRunner.ts)
 * Coordinates Step 1 through Step 9 with event-driven HTTP network decisions.
 */
export async function runIvacSlotBooking(config: IvacBookingConfig): Promise<IvacRunnerResult> {
  const { account, pdfPath } = config;
  console.log(`\n======================================================`);
  console.log(`🚀 [IVAC Slot Booker] Starting Automation Pipeline`);
  console.log(`   Account: ${account.phone}`);
  console.log(`   Webfile: ${path.basename(pdfPath)}`);
  console.log(`   Center:    ${config.centerName || 'Auto-Select First Available Center'}`);
  if (config.preferredDate) {
    console.log(`   Preferred: ${config.preferredDate}`);
  }
  console.log(`   Order:     ${(config.dateOrder || 'latest').toUpperCase()}`);
  if (config.avoidDates?.length) {
    console.log(`   Avoid:     [${config.avoidDates.join(', ')}]`);
  }
  console.log(`======================================================\n`);

  let session: Awaited<ReturnType<typeof createIvacBrowser>> | null = null;

  try {
    session = await createIvacBrowser(account.phone, config.skipOtpIfSessionValid ?? true);
    const { page, sessionRestored } = session;

    // STEP 1: Sign In (Skip if session valid)
    if (!sessionRestored) {
      console.log(`\n--- ▶️ EXECUTING STEP 1: Sign In ---`);
      const step1Result = await executeStep1(page, account);
      if (!step1Result.success && !step1Result.alreadyAuthenticated) {
        throw new Error(`Step 1 (Sign In) failed: ${step1Result.error}`);
      }

      // STEP 2: Phone OTP (Skip if session valid)
      console.log(`\n--- ▶️ EXECUTING STEP 2: Phone OTP ---`);
      const step2Result = await executeStep2(page, account);
      if (!step2Result.success) {
        throw new Error(`Step 2 (OTP Verification) failed: ${step2Result.error}`);
      }

      // STEP 3: Home Dashboard & Dismiss Advisory Popup
      console.log(`\n--- ▶️ EXECUTING STEP 3: Home Dashboard & Notice Dismissal ---`);
      const step3Result = await executeStep3(page);
      if (!step3Result.success) {
        throw new Error(`Step 3 (Dashboard CTA) failed: ${step3Result.error}`);
      }

      // STEP 4: Appointment Notice & Terms Acceptance
      console.log(`\n--- ▶️ EXECUTING STEP 4: Notice Acceptance ---`);
      const step4Result = await executeStep4(page);
      if (!step4Result.success) {
        throw new Error(`Step 4 (Notice Acceptance) failed: ${step4Result.error}`);
      }
    } else {
      console.log(`⚡ [IVAC Orchestrator] Steps 1-4 bypassed due to active restored session.`);
    }

    // STEP 5: Webfile Upload & Parsing Verification
    console.log(`\n--- ▶️ EXECUTING STEP 5: Webfile Upload ---`);
    const step5Result = await executeStep5(page, pdfPath);
    if (!step5Result.success) {
      throw new Error(`Step 5 (Webfile Upload) failed: ${step5Result.error}`);
    }

    // STEP 6: Mission & Center Selection
    console.log(`\n--- ▶️ EXECUTING STEP 6: Mission & Center Selection ---`);
    const step6Result = await executeStep6(page, {
      centerName: config.centerName,
    });
    if (!step6Result.success) {
      throw new Error(`Step 6 (Center Selection) failed: ${step6Result.error}`);
    }

    // STEP 7: High-Speed Slot Sniping Loop
    console.log(`\n--- ▶️ EXECUTING STEP 7: High-Speed Slot Sniping ---`);
    const step7Result = await executeStep7(page, {
      targetDates: config.targetDates,
      preferredDate: config.preferredDate,
      dateOrder: config.dateOrder,
      avoidDates: config.avoidDates,
    });
    if (!step7Result.success || !step7Result.slotBooked) {
      throw new Error(`Step 7 (Slot Sniping) failed: ${step7Result.error}`);
    }

    // STEP 8: Payment Initiation & DGePay URL Capture
    console.log(`\n--- ▶️ EXECUTING STEP 8: Payment Initiation ---`);
    const step8Result = await executeStep8(page);
    if (!step8Result.success || !step8Result.checkoutUrl) {
      throw new Error(`Step 8 (Payment Initiation) failed: ${step8Result.error}`);
    }

    // STEP 9: Handover & 15-Minute Payment Window
    console.log(`\n--- ▶️ EXECUTING STEP 9: Handover & Manual Payment Wait ---`);
    await executeStep9(page, step8Result.checkoutUrl, account.phone, 15);

    return {
      success: true,
      stepReached: 9,
      reservationId: step7Result.reservationId,
      bookedDate: step7Result.bookedDate,
      checkoutUrl: step8Result.checkoutUrl,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`\n💥 [IVAC Slot Booker] Automation encountered an error: ${errorMsg}`);
    return {
      success: false,
      stepReached: 0,
      error: errorMsg,
    };
  }
}
