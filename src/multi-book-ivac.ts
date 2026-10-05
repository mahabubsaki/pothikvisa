import path from 'node:path';
import dotenv from 'dotenv';
import {
  loadCandidateAccounts,
  claimNextAvailableAccount,
  markAccountCompleted,
  markAccountFailed,
  printPoolStatus,
  getCandidatePool,
  IvacCandidateAccount,
} from './services/ivac/accountPool';
import { resolveFastestWorkers, WorkerTarget } from './services/ivac/workerResolver';
import { createWorkerBrowser } from './services/ivac/multiBrowser';
import { executeStep1 } from './services/ivac/step1';
import { executeStep2 } from './services/ivac/step2';
import { executeStep3 } from './services/ivac/step3';
import { executeStep4 } from './services/ivac/step4';
import { executeStep5 } from './services/ivac/step5';
import { executeStep6 } from './services/ivac/step6';
import { executeStep7 } from './services/ivac/step7';
import { executeStep8 } from './services/ivac/step8';
import { executeStep9 } from './services/ivac/step9';

dotenv.config();

const args = process.argv.slice(2);

// Parse CLI worker count (e.g., --workers=10, -n=10, or 10)
let workerCount = 10;
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (/^\d+$/.test(a)) {
    workerCount = parseInt(a, 10);
    break;
  } else if (a.startsWith('--workers=') || a.startsWith('--count=') || a.startsWith('-n=')) {
    workerCount = parseInt(a.split('=')[1], 10);
    break;
  } else if ((a === '--workers' || a === '--count' || a === '-n') && args[i + 1] && /^\d+$/.test(args[i + 1])) {
    workerCount = parseInt(args[i + 1], 10);
    break;
  }
}

// Parse custom accounts file
const accountsFlag = args.find((a) => a.startsWith('--accounts=') || a.startsWith('--file='))?.split('=')[1];

async function runWorkerTask(worker: WorkerTarget): Promise<void> {
  // 1. Atomically claim next available candidate account
  const account = claimNextAvailableAccount(worker.name);

  if (!account) {
    console.log(`[${worker.name}] ⚪ All accounts already claimed by faster workers. Standing down cleanly.`);
    return;
  }

  console.log(`\n======================================================`);
  console.log(`🎯 [${worker.name}] ATOMICALLY CLAIMED CANDIDATE:`);
  console.log(`   Account:   ${account.name} (${account.phone})`);
  console.log(`   PDF:       ${path.basename(account.pdfPath)}`);
  console.log(`   Proxy/IP:  ${worker.outboundIp || 'Direct'} (${worker.latencyMs}ms)`);
  console.log(`   Mode:      HEADED BROWSER (headless: false)`);
  console.log(`======================================================\n`);

  let session: Awaited<ReturnType<typeof createWorkerBrowser>> | null = null;

  try {
    session = await createWorkerBrowser(worker, account.phone, true);
    const { page, sessionRestored } = session;

    // STEP 1: Sign-In
    if (!sessionRestored) {
      console.log(`\n[${worker.name}] ▶️ EXECUTING STEP 1: Sign-In Probe`);
      const step1Result = await executeStep1(page, {
        phone: account.phone,
        password: account.password,
      });

      if (!step1Result.success && !step1Result.alreadyAuthenticated) {
        throw new Error(`Step 1 (Sign-In) failed: ${step1Result.error}`);
      }

      // STEP 2: Phone OTP Verification
      console.log(`\n[${worker.name}] ▶️ EXECUTING STEP 2: Phone OTP Verification`);
      const step2Result = await executeStep2(page, {
        phone: account.phone,
        password: account.password,
      });

      if (!step2Result.success) {
        throw new Error(`Step 2 (OTP Verification) failed: ${step2Result.error}`);
      }
    } else {
      console.log(`⚡ [${worker.name}] Session restored! Skipping Step 1 & 2.`);
    }

    // STEP 3: Advisory Notice Modal Dismissal
    console.log(`\n[${worker.name}] ▶️ EXECUTING STEP 3: Dismiss Advisory Notice`);
    const step3Result = await executeStep3(page);
    if (!step3Result.success) {
      throw new Error(`Step 3 (Advisory Dismissal) failed: ${step3Result.error}`);
    }

    // STEP 4: Notice Acceptance
    console.log(`\n[${worker.name}] ▶️ EXECUTING STEP 4: Notice Acceptance`);
    const step4Result = await executeStep4(page);
    if (!step4Result.success) {
      throw new Error(`Step 4 (Notice Acceptance) failed: ${step4Result.error}`);
    }

    // STEP 5: PDF Upload & Webfile Processing
    console.log(`\n[${worker.name}] ▶️ EXECUTING STEP 5: PDF Webfile Upload`);
    const step5Result = await executeStep5(page, account.pdfPath);
    if (!step5Result.success) {
      throw new Error(`Step 5 (PDF Upload) failed: ${step5Result.error}`);
    }

    // STEP 6: Center Auto-Selection
    console.log(`\n[${worker.name}] ▶️ EXECUTING STEP 6: Mission & Center Selection`);
    const step6Result = await executeStep6(page);
    if (!step6Result.success) {
      throw new Error(`Step 6 (Center Selection) failed: ${step6Result.error}`);
    }

    // STEP 7: High-Speed Slot Sniping Loop
    console.log(`\n[${worker.name}] ▶️ EXECUTING STEP 7: High-Speed Slot Sniping`);
    const step7Result = await executeStep7(page, {
      preferredDate: account.preferredDate,
      dateOrder: account.dateOrder,
      avoidDates: account.avoidDates,
    });
    if (!step7Result.success || !step7Result.slotBooked) {
      throw new Error(`Step 7 (Slot Sniping) failed: ${step7Result.error}`);
    }

    // STEP 8: Payment Initiation & DGePay Checkout Intercept
    console.log(`\n[${worker.name}] ▶️ EXECUTING STEP 8: Payment Initiation`);
    const step8Result = await executeStep8(page);
    if (!step8Result.success || !step8Result.checkoutUrl) {
      throw new Error(`Step 8 (Payment Initiation) failed: ${step8Result.error}`);
    }

    // Record success
    markAccountCompleted(account.phone, step8Result.checkoutUrl);

    // STEP 9: Handover & 15-Minute Bangla QR Hold
    console.log(`\n[${worker.name}] ▶️ EXECUTING STEP 9: Bangla QR Payment Window`);
    await executeStep9(page, step8Result.checkoutUrl, account.phone, 15);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`💥 [${worker.name}] Worker encountered error: ${errorMsg}`);
    markAccountFailed(account.phone, errorMsg);
  }
}

export async function runMultiFleet(options?: { workerCount?: number; accountsFile?: string }): Promise<void> {
  console.log('======================================================');
  console.log('⚡ IVAC Multi-Worker Headed Booking Fleet Orchestrator');
  console.log('======================================================');

  const file = options?.accountsFile || accountsFlag;
  const count = options?.workerCount || workerCount;

  // 1. Load Candidate Accounts Pool
  const accounts = loadCandidateAccounts(file);
  if (accounts.length === 0) {
    console.error('❌ No candidate accounts found. Please configure accounts.json or .env.');
    process.exit(1);
  }

  // 2. Resolve Top Ranked Workers from proxy-health.json
  const requestedWorkers = Math.max(count, accounts.length);
  const workers = await resolveFastestWorkers(requestedWorkers);

  if (workers.length === 0) {
    console.error('❌ No workers could be resolved.');
    process.exit(1);
  }

  console.log(`👥 Fleet Configuration:`);
  console.log(`   Candidate Accounts : ${accounts.length}`);
  console.log(`   Fastest Workers    : ${workers.length}`);
  console.log(`   Display Mode       : 100% HEADED (headless: false)\n`);

  printPoolStatus();

  // 3. Launch Workers Concurrently
  const startTime = Date.now();
  const workerPromises = workers.map((w) => runWorkerTask(w));
  await Promise.allSettled(workerPromises);

  const durationSecs = Math.round((Date.now() - startTime) / 1000);
  console.log(`\n🏁 [IVAC Fleet] All workers finished in ${durationSecs}s.`);

  // 4. Print final pool report
  printPoolStatus();
}

// Run directly if invoked as main module
if (import.meta.url === `file://${process.argv[1]}`.replace(/\\/g, '/')) {
  runMultiFleet().catch((err) => {
    console.error('Fatal Fleet Error:', err);
    process.exit(1);
  });
}
