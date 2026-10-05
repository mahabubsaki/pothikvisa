import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { runIvacSlotBooking } from './services/ivac/ivacRunner';
import { loadCandidateAccounts } from './services/ivac/accountPool';
import { runMultiFleet } from './multi-book-ivac';

dotenv.config();

interface IvacConfigFile {
  mode?: 'single' | 'multi';
  workers?: number;
  accountsFile?: string;
  preferredDate?: string;
  dateOrder?: 'latest' | 'earliest';
  avoidDates?: string[];
}

function loadConfigFile(): IvacConfigFile {
  const configPaths = [
    path.resolve(process.cwd(), 'config.json'),
    path.resolve(process.cwd(), 'ivac.config.json'),
  ];

  for (const cPath of configPaths) {
    if (fs.existsSync(cPath)) {
      try {
        const raw = fs.readFileSync(cPath, 'utf8');
        return JSON.parse(raw);
      } catch (err) {
        console.warn(`⚠️ Error reading ${cPath}:`, err instanceof Error ? err.message : err);
      }
    }
  }

  return { mode: 'single', workers: 10, accountsFile: 'accounts.json' };
}

async function main() {
  const configFile = loadConfigFile();
  const args = process.argv.slice(2);

  // 1. Resolve Execution Mode (CLI flags override config.json)
  let mode: 'single' | 'multi' = configFile.mode || 'single';

  if (args.includes('--multi') || args.some((a) => a.startsWith('--mode=multi'))) {
    mode = 'multi';
  } else if (args.includes('--single') || args.some((a) => a.startsWith('--mode=single'))) {
    mode = 'single';
  } else if (process.env.IVAC_MODE === 'multi' || process.env.IVAC_MODE === 'single') {
    mode = process.env.IVAC_MODE;
  }

  const accountsFile =
    args.find((a) => a.startsWith('--accounts=') || a.startsWith('--file='))?.split('=')[1] ||
    configFile.accountsFile ||
    'accounts.json';

  // 2. DISPATCH ACCORDING TO MODE:
  if (mode === 'multi') {
    let workerCount = configFile.workers || 10;
    for (const a of args) {
      if (/^\d+$/.test(a)) {
        workerCount = parseInt(a, 10);
        break;
      } else if (a.startsWith('--workers=') || a.startsWith('--count=') || a.startsWith('-n=')) {
        workerCount = parseInt(a.split('=')[1], 10);
        break;
      }
    }

    console.log('\n======================================================');
    console.log('⚡ IVAC Booking Engine: MULTI-WORKER FLEET MODE');
    console.log(`   Config Source : config.json (mode: "multi")`);
    console.log(`   Accounts File : ${accountsFile}`);
    console.log(`   Worker Count  : ${workerCount}`);
    console.log('======================================================\n');

    await runMultiFleet({
      workerCount,
      accountsFile,
    });
    return;
  }

  // ── SINGLE ACCOUNT MODE ──
  console.log('\n======================================================');
  console.log('⚡ IVAC Booking Engine: SINGLE ACCOUNT MODE');
  console.log(`   Config Source : config.json (mode: "single")`);
  console.log(`   Accounts File : ${accountsFile}`);
  console.log('======================================================');

  // Load candidate accounts and take the FIRST one
  const candidates = loadCandidateAccounts(accountsFile);
  if (candidates.length === 0) {
    console.error('❌ No candidate account found in accounts.json or .env.');
    process.exit(1);
  }

  const primaryCandidate = candidates[0];
  const phone = primaryCandidate.phone;
  const password = primaryCandidate.password;
  const pdfPath = primaryCandidate.pdfPath;
  const preferredDate = primaryCandidate.preferredDate || configFile.preferredDate;
  const dateOrder = primaryCandidate.dateOrder || configFile.dateOrder || 'latest';
  const avoidDates = primaryCandidate.avoidDates || configFile.avoidDates;

  console.log(`📱 Phone:       ${phone} (${primaryCandidate.name})`);
  console.log(`📄 Webfile:     ${path.basename(pdfPath)}`);
  if (preferredDate) {
    console.log(`🎯 Preferred:   ${preferredDate}`);
  }
  console.log(`🧭 Date Order:  ${dateOrder.toUpperCase()}`);
  if (avoidDates && avoidDates.length > 0) {
    console.log(`🚫 Avoid Dates: [${avoidDates.join(', ')}]`);
  }
  console.log('======================================================\n');

  const result = await runIvacSlotBooking({
    account: {
      phone,
      password,
    },
    pdfPath,
    preferredDate,
    dateOrder,
    avoidDates,
    skipOtpIfSessionValid: true,
  });

  if (result.success) {
    console.log('\n🎉 Automation Completed Successfully!');
    console.log(`   Slot Date:   ${result.bookedDate || 'Confirmed'}`);
    console.log(`   Reservation: ${result.reservationId || 'Confirmed'}`);
    console.log(`   Checkout:    ${result.checkoutUrl}`);
  } else {
    console.error('\n❌ Automation Stopped:');
    console.error(`   Error: ${result.error}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
