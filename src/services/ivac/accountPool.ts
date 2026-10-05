import fs from 'node:fs';
import path from 'node:path';

export interface IvacCandidateAccount {
  id: string;
  name: string;
  phone: string;
  password: string;
  pdfPath: string;
  preferredDate?: string;
  dateOrder?: 'latest' | 'earliest';
  avoidDates?: string[];
  status: 'available' | 'claimed' | 'completed' | 'failed';
  claimedByWorker?: string;
  claimedTime?: number;
  error?: string;
  checkoutUrl?: string;
}

let candidatePool: IvacCandidateAccount[] = [];

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
 * Loads candidate accounts from accounts.json, accounts-ivac.json, or custom path.
 */
export function loadCandidateAccounts(customPath?: string): IvacCandidateAccount[] {
  const candidatePaths = [
    customPath,
    path.resolve(process.cwd(), 'accounts.json'),
    path.resolve(process.cwd(), 'accounts-ivac.json'),
    path.resolve('D:\\goethe-browser-automation', 'accounts-ivac.json'),
  ].filter((p): p is string => Boolean(p && fs.existsSync(p)));

  candidatePool = [];

  for (const configPath of candidatePaths) {
    try {
      const content = fs.readFileSync(configPath, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        for (let i = 0; i < parsed.length; i++) {
          const item = parsed[i];
          const rawPhone = item.phone || (item.email && /^\+?\d{8,15}$/.test(item.email) ? item.email : '');
          const phone = normalizePhone(rawPhone);
          const password = item.password || process.env.IVAC_PASSWORD || '';
          const pdfPath = item.pdfPath || item.webfilePath || item.webfile || process.env.IVAC_PDF_PATH || '';

          if (!phone || !password) continue;

          // Avoid duplicate phone entries
          if (!candidatePool.some((c) => c.phone === phone)) {
            candidatePool.push({
              id: item.id || `candidate_${i + 1}`,
              name: item.name || `Candidate ${i + 1} (${phone})`,
              phone,
              password,
              pdfPath,
              preferredDate: item.preferredDate || item.date || process.env.IVAC_PREFERRED_DATE,
              dateOrder: item.dateOrder || item.order || (process.env.IVAC_DATE_ORDER as 'latest' | 'earliest') || 'latest',
              avoidDates: Array.isArray(item.avoidDates)
                ? item.avoidDates.map(String)
                : typeof item.avoidDates === 'string'
                ? item.avoidDates.split(',').map((s: string) => s.trim()).filter(Boolean)
                : undefined,
              status: 'available',
            });
          }
        }

        if (candidatePool.length > 0) {
          console.log(`📄 [Account Pool] Loaded ${candidatePool.length} candidate(s) from: ${path.basename(configPath)}`);
          return candidatePool;
        }
      }
    } catch (err) {
      console.warn(`⚠️ [Account Pool] Error reading ${configPath}:`, err instanceof Error ? err.message : err);
    }
  }

  // Fallback to primary account from .env
  const envPhone = process.env.IVAC_PHONE;
  const envPassword = process.env.IVAC_PASSWORD;
  const envPdfPath = process.env.IVAC_PDF_PATH || 'C:\\Users\\SAKI\\Downloads\\BGDDW1EF0826MD000915-2.pdf';

  if (envPhone && envPassword) {
    candidatePool.push({
      id: 'env_primary',
      name: `Primary Candidate (.env)`,
      phone: normalizePhone(envPhone),
      password: envPassword,
      pdfPath: envPdfPath,
      dateOrder: 'latest',
      status: 'available',
    });
    console.log(`📄 [Account Pool] Loaded 1 primary candidate from .env (${envPhone})`);
  }

  return candidatePool;
}

/**
 * Atomically claims the next available candidate account for a calling worker.
 * Guarantees:
 *  1. Exactly ONE unassigned account is given to the calling worker.
 *  2. No two workers can ever claim the same account (prevents duplicate logins & OTP burnout).
 *  3. If all accounts are already claimed, returns null (worker stands down cleanly).
 */
export function claimNextAvailableAccount(workerName: string): IvacCandidateAccount | null {
  // If this worker already holds an account, return it
  const existing = candidatePool.find((a) => a.claimedByWorker === workerName);
  if (existing) return existing;

  const available = candidatePool.find((a) => a.status === 'available' && !a.claimedByWorker);
  if (available) {
    available.status = 'claimed';
    available.claimedByWorker = workerName;
    available.claimedTime = Date.now();
    return available;
  }

  return null;
}

/**
 * Releases an account back to the pool if a worker aborts before initiating login.
 */
export function releaseAccount(workerName: string): void {
  const account = candidatePool.find((a) => a.claimedByWorker === workerName);
  if (account && account.status === 'claimed') {
    account.status = 'available';
    delete account.claimedByWorker;
    delete account.claimedTime;
  }
}

/**
 * Marks an account as completed with its secured payment checkout URL.
 */
export function markAccountCompleted(phone: string, checkoutUrl: string): void {
  const norm = normalizePhone(phone);
  const account = candidatePool.find((a) => a.phone === norm);
  if (account) {
    account.status = 'completed';
    account.checkoutUrl = checkoutUrl;
  }
}

/**
 * Marks an account as failed with an error explanation.
 */
export function markAccountFailed(phone: string, error: string): void {
  const norm = normalizePhone(phone);
  const account = candidatePool.find((a) => a.phone === norm);
  if (account) {
    account.status = 'failed';
    account.error = error;
  }
}

/**
 * Returns current snapshot of candidate pool.
 */
export function getCandidatePool(): IvacCandidateAccount[] {
  return [...candidatePool];
}

/**
 * Prints formatted pool status.
 */
export function printPoolStatus(): void {
  console.log('\n======================================================');
  console.log(`📋 Candidate Account Pool Status (${candidatePool.length} Accounts):`);
  console.log('======================================================');
  candidatePool.forEach((acc, i) => {
    const statusIcon =
      acc.status === 'completed'
        ? '🎉 COMPLETED'
        : acc.status === 'claimed'
        ? `⚡ CLAIMED by [${acc.claimedByWorker}]`
        : acc.status === 'failed'
        ? `❌ FAILED: ${acc.error || 'Unknown'}`
        : '🟢 AVAILABLE';
    console.log(`   ${i + 1}. [${acc.phone}] ${acc.name.padEnd(25)} ➔ ${statusIcon}`);
    if (acc.checkoutUrl) {
      console.log(`      💳 Payment URL: ${acc.checkoutUrl}`);
    }
  });
  console.log('======================================================\n');
}
