import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';

const DB_PATH = path.join(process.cwd(), 'data', 'pothikvisa.db');

// Ensure data folder exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_PATH);
    initSchema(dbInstance);
  }
  return dbInstance;
}

function initSchema(db: DatabaseSync) {
  // 1. Users table (Clerk synced)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT DEFAULT '',
      salt TEXT DEFAULT '',
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL
    );
  `);

  // 2. Sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 3. Subscriptions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      plan TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      quota_total INTEGER NOT NULL,
      quota_used INTEGER NOT NULL DEFAULT 0,
      starts_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 4. MFS Transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      plan TEXT NOT NULL,
      amount INTEGER NOT NULL,
      mfs_method TEXT NOT NULL,
      sender_phone TEXT NOT NULL,
      trx_id TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      note TEXT,
      created_at TEXT NOT NULL,
      reviewed_at TEXT,
      reviewed_by TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 5. Applications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      applicant_name TEXT NOT NULL,
      passport_number TEXT NOT NULL,
      visa_type TEXT NOT NULL DEFAULT '544',
      temp_id TEXT,
      web_file_number TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      current_step INTEGER NOT NULL DEFAULT 1,
      failed_step INTEGER,
      failure_reason TEXT,
      pdf_path TEXT,
      photo_url TEXT,
      passport_pdf_url TEXT,
      final_pdf_url TEXT,
      form_data_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Migrations for existing databases
  try { db.exec(`ALTER TABLE applications ADD COLUMN photo_url TEXT;`); } catch {}
  try { db.exec(`ALTER TABLE applications ADD COLUMN passport_pdf_url TEXT;`); } catch {}
  try { db.exec(`ALTER TABLE applications ADD COLUMN final_pdf_url TEXT;`); } catch {}
  try { db.exec(`ALTER TABLE applications ADD COLUMN status_message TEXT;`); } catch {}
  try { db.exec(`ALTER TABLE applications ADD COLUMN live_logs TEXT;`); } catch {}
  try { db.exec(`ALTER TABLE applications ADD COLUMN priority_rank INTEGER DEFAULT 4;`); } catch {}
  try { db.exec(`ALTER TABLE applications ADD COLUMN queued_at TEXT;`); } catch {}
  try { db.exec(`ALTER TABLE applications ADD COLUMN started_at TEXT;`); } catch {}
  try { db.exec(`ALTER TABLE applications ADD COLUMN completed_at TEXT;`); } catch {}
  try { db.exec(`CREATE INDEX IF NOT EXISTS idx_apps_queue ON applications(status, priority_rank, queued_at);`); } catch {}
  try { db.exec(`ALTER TABLE users ADD COLUMN canonical_email TEXT;`); } catch {}
  try { db.exec(`CREATE INDEX IF NOT EXISTS idx_users_canonical_email ON users(canonical_email);`); } catch {}

  // 6. Applicant Profiles table (for saving & reusing profiles)
  db.exec(`
    CREATE TABLE IF NOT EXISTS applicant_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      profile_name TEXT NOT NULL,
      passport_number TEXT NOT NULL,
      data_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 7. Free Trial Abuse Tracking Table (Device fingerprint + IP + multiple Gmail tracking)
  db.exec(`
    CREATE TABLE IF NOT EXISTS free_trial_fingerprints (
      id TEXT PRIMARY KEY,
      fingerprint_hash TEXT NOT NULL,
      user_id TEXT NOT NULL,
      email TEXT NOT NULL,
      ip_address TEXT,
      files_created INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      last_used_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_trial_fp ON free_trial_fingerprints(fingerprint_hash);
    CREATE INDEX IF NOT EXISTS idx_trial_ip ON free_trial_fingerprints(ip_address);
  `);

  // Ensure demo_profile_seeded column exists in users
  try {
    db.exec(`ALTER TABLE users ADD COLUMN demo_profile_seeded INTEGER DEFAULT 0;`);
  } catch {}

  // Seed default admin and demo user if not present
  seedDefaults(db);
}

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

export function seedAdminUser(db?: DatabaseSync) {
  const database = db || getDb();
  const email = 'saki.admin@pothikvisa.com';
  const name = 'Saki Admin';
  const password = 'Iloveumonia1';
  const { hash, salt } = hashPassword(password);
  const now = new Date().toISOString();

  const existing = database.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: string } | undefined;
  const adminId: string = existing?.id || 'usr_saki_admin';

  if (existing) {
    database.prepare(`
      UPDATE users 
      SET name = ?, password_hash = ?, salt = ?, role = 'admin'
      WHERE id = ?
    `).run(name, hash, salt, adminId);
  } else {
    database.prepare(`
      INSERT INTO users (id, name, email, password_hash, salt, role, created_at)
      VALUES (?, ?, ?, ?, ?, 'admin', ?)
    `).run(adminId, name, email, hash, salt, now);
  }

  // Ensure admin has an active unlimited agency subscription
  const sub = database.prepare("SELECT id FROM subscriptions WHERE user_id = ? AND status = 'active'").get(adminId);
  if (!sub) {
    database.prepare(`
      INSERT INTO subscriptions (id, user_id, plan, status, quota_total, quota_used, starts_at, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `sub_${crypto.randomBytes(8).toString('hex')}`,
      adminId,
      'agency',
      'active',
      999999,
      0,
      now,
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      now
    );
  }
}

export function clearAllDatabaseData(db?: DatabaseSync) {
  const database = db || getDb();
  database.exec(`
    DELETE FROM sessions;
    DELETE FROM transactions;
    DELETE FROM applications;
    DELETE FROM applicant_profiles;
    DELETE FROM free_trial_fingerprints;
    DELETE FROM subscriptions;
    DELETE FROM users;
  `);
}

export function resetAndSeedDatabase(db?: DatabaseSync) {
  const database = db || getDb();
  clearAllDatabaseData(database);
  seedAdminUser(database);
}

function seedDefaults(db: DatabaseSync) {
  seedAdminUser(db);
}

// -------------------------------------------------------------
// Database Query Helpers
// -------------------------------------------------------------

export interface User {
  id: string;
  name: string;
  email: string;
  canonical_email?: string;
  role: 'user' | 'admin';
  created_at: string;
}

/**
 * Normalizes Gmail address to canonical representation (strips dots and subaddresses).
 * E.g., "s.a.k.i+test@gmail.com" -> "saki@gmail.com"
 */
export function toCanonicalGmail(email: string): string {
  const clean = email.toLowerCase().trim();
  const [localPart, domain] = clean.split('@');
  if (!domain) return clean;
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    const rootLocal = localPart.split('+')[0].replace(/\./g, '');
    return `${rootLocal}@gmail.com`;
  }
  return clean;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: 'free' | 'starter' | 'standard' | 'agency';
  status: 'active' | 'expired' | 'canceled';
  quota_total: number;
  quota_used: number;
  starts_at: string;
  expires_at: string;
  created_at: string;
}

export interface MfsTransaction {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  plan: 'starter' | 'standard' | 'agency';
  amount: number;
  mfs_method: 'bkash' | 'nagad' | 'rocket';
  sender_phone: string;
  trx_id: string;
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export function getUserByEmail(email: string): User | null {
  const db = getDb();
  const row = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE email = ?').get(email.toLowerCase().trim());
  return (row as unknown as User) || null;
}

export function getUserById(id: string): User | null {
  const db = getDb();
  const row = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(id);
  return (row as unknown as User) || null;
}

export function getUserSubscription(userId: string): Subscription | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT * FROM subscriptions 
    WHERE user_id = ? AND status = 'active'
    ORDER BY created_at DESC 
    LIMIT 1
  `).get(userId);

  if (row) {
    const sub = row as unknown as Subscription;
    // Check if subscription has expired by date
    if (new Date(sub.expires_at).getTime() < Date.now()) {
      db.prepare("UPDATE subscriptions SET status = 'expired' WHERE id = ?").run(sub.id);
      return null;
    }
    return sub;
  }

  // If user has no active subscription, check if they have ever had one
  const anySub = db.prepare('SELECT id FROM subscriptions WHERE user_id = ?').get(userId);
  if (!anySub) {
    // If the user exists in users table, automatically grant them 3 Free Web Files on signup!
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (user) {
      return createOrRenewSubscription(userId, 'free');
    }
  }

  return null;
}

export function createOrRenewSubscription(
  userId: string,
  plan: 'free' | 'starter' | 'standard' | 'agency'
): Subscription {
  const db = getDb();
  const now = new Date();
  const durationDays = plan === 'free' ? 1 : 30; // Free trial is 1 day (24 hours), paid plans are 30 days
  const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();

  // Free trial gives 3 Web Files to verify speed and accuracy
  let quota = 3;
  if (plan === 'starter') quota = 75;
  if (plan === 'standard') quota = 200;
  if (plan === 'agency') quota = 999999;

  // Deactivate any existing active subscription
  db.prepare(`UPDATE subscriptions SET status = 'expired' WHERE user_id = ? AND status = 'active'`).run(userId);

  const subId = `sub_${crypto.randomBytes(8).toString('hex')}`;
  db.prepare(`
    INSERT INTO subscriptions (id, user_id, plan, status, quota_total, quota_used, starts_at, expires_at, created_at)
    VALUES (?, ?, ?, 'active', ?, 0, ?, ?, ?)
  `).run(subId, userId, plan, quota, now.toISOString(), expiresAt, now.toISOString());

  return {
    id: subId,
    user_id: userId,
    plan,
    status: 'active',
    quota_total: quota,
    quota_used: 0,
    starts_at: now.toISOString(),
    expires_at: expiresAt,
    created_at: now.toISOString(),
  };
}

export function createTransaction(params: {
  userId: string;
  plan: 'starter' | 'standard' | 'agency';
  amount: number;
  mfsMethod: 'bkash' | 'nagad' | 'rocket';
  senderPhone: string;
  trxId: string;
  note?: string;
}): MfsTransaction {
  const db = getDb();
  const id = `trx_${crypto.randomBytes(8).toString('hex')}`;
  const now = new Date().toISOString();
  const cleanTrx = params.trxId.trim().toUpperCase();

  db.prepare(`
    INSERT INTO transactions (id, user_id, plan, amount, mfs_method, sender_phone, trx_id, status, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
  `).run(id, params.userId, params.plan, params.amount, params.mfsMethod, params.senderPhone.trim(), cleanTrx, params.note || '', now);

  return {
    id,
    user_id: params.userId,
    plan: params.plan,
    amount: params.amount,
    mfs_method: params.mfsMethod,
    sender_phone: params.senderPhone.trim(),
    trx_id: cleanTrx,
    status: 'pending',
    note: params.note || '',
    created_at: now,
  };
}

export function getAllTransactions(statusFilter?: 'pending' | 'approved' | 'rejected'): MfsTransaction[] {
  const db = getDb();
  let query = `
    SELECT t.*, u.name as user_name, u.email as user_email
    FROM transactions t
    JOIN users u ON t.user_id = u.id
  `;
  const params: string[] = [];

  if (statusFilter) {
    query += ' WHERE t.status = ?';
    params.push(statusFilter);
  }

  query += ' ORDER BY t.created_at DESC';

  const rows = db.prepare(query).all(...params);
  return (rows as unknown as MfsTransaction[]) || [];
}

export function getUserTransactions(userId: string): MfsTransaction[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM transactions 
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(userId);

  return (rows as unknown as MfsTransaction[]) || [];
}

export function approveTransaction(trxIdOrId: string, adminEmail: string): boolean {
  const db = getDb();
  const now = new Date().toISOString();

  // Find transaction
  const trx = db.prepare('SELECT * FROM transactions WHERE id = ? OR trx_id = ?').get(trxIdOrId, trxIdOrId) as unknown as MfsTransaction | undefined;
  if (!trx || trx.status === 'approved') return false;

  // Mark approved
  db.prepare(`
    UPDATE transactions 
    SET status = 'approved', reviewed_at = ?, reviewed_by = ?
    WHERE id = ?
  `).run(now, adminEmail, trx.id);

  // Activate / renew user subscription with the plan quota!
  createOrRenewSubscription(trx.user_id, trx.plan);

  return true;
}

export function rejectTransaction(trxIdOrId: string, reason: string, adminEmail: string): boolean {
  const db = getDb();
  const now = new Date().toISOString();

  const trx = db.prepare('SELECT * FROM transactions WHERE id = ? OR trx_id = ?').get(trxIdOrId, trxIdOrId) as unknown as MfsTransaction | undefined;
  if (!trx) return false;

  db.prepare(`
    UPDATE transactions 
    SET status = 'rejected', note = ?, reviewed_at = ?, reviewed_by = ?
    WHERE id = ?
  `).run(reason, now, adminEmail, trx.id);

  return true;
}

export interface ApplicationRecord {
  id: string;
  user_id: string;
  applicant_name: string;
  passport_number: string;
  visa_type: string;
  temp_id?: string | null;
  web_file_number?: string | null;
  status: 'draft' | 'queued' | 'processing' | 'completed' | 'failed';
  current_step: number;
  failed_step?: number | null;
  failure_reason?: string | null;
  pdf_path?: string | null;
  photo_url?: string | null;
  passport_pdf_url?: string | null;
  final_pdf_url?: string | null;
  status_message?: string | null;
  live_logs?: string | null;
  form_data_json: string;
  priority_rank?: number;
  queued_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export function deductUserQuota(userId: string): boolean {
  const db = getDb();
  const sub = getUserSubscription(userId);
  if (!sub) return false;
  if (sub.plan === 'agency') return true; // unlimited
  if (sub.quota_used >= sub.quota_total) return false;

  db.prepare(`
    UPDATE subscriptions
    SET quota_used = quota_used + 1
    WHERE id = ?
  `).run(sub.id);

  return true;
}

export function getPlanPriorityRank(plan?: string | null): number {
  switch (plan) {
    case 'agency':
      return 1; // Agency Pro: Rank 1 (Top Priority)
    case 'standard':
      return 2; // Standard: Rank 2 (Second Priority)
    case 'starter':
      return 3; // Starter: Rank 3 (Third Priority)
    case 'free':
    default:
      return 4; // Free user: Rank 4 (Last)
  }
}

export function enqueueApplication(appId: string, priorityRank: number): boolean {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE applications
    SET status = 'queued',
        priority_rank = ?,
        queued_at = ?,
        status_message = 'সারিবদ্ধ রয়েছে (অটোমেশন শুরুর অপেক্ষায়)...',
        updated_at = ?
    WHERE id = ?
  `).run(priorityRank, now, now, appId);
  return true;
}

export function getNextQueuedApplication(): ApplicationRecord | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT * FROM applications
    WHERE status = 'queued'
    ORDER BY priority_rank ASC, queued_at ASC
    LIMIT 1
  `).get() as ApplicationRecord | undefined;
  return row || null;
}

export function isAnyApplicationProcessing(): boolean {
  const db = getDb();
  const row = db.prepare(`
    SELECT id FROM applications WHERE status = 'processing' LIMIT 1
  `).get();
  return !!row;
}

export function getApplicationQueuePosition(appId: string): {
  position: number;
  estimatedWaitMinutes: number;
  totalInQueue: number;
  isProcessing: boolean;
} {
  const db = getDb();
  const app = getApplicationById(appId);
  if (!app) {
    return { position: 0, estimatedWaitMinutes: 0, totalInQueue: 0, isProcessing: false };
  }

  if (app.status === 'processing') {
    return { position: 1, estimatedWaitMinutes: 1, totalInQueue: 1, isProcessing: true };
  }

  if (app.status !== 'queued') {
    return { position: 0, estimatedWaitMinutes: 0, totalInQueue: 0, isProcessing: false };
  }

  const appRank = app.priority_rank ?? 4;
  const appQueuedAt = app.queued_at || app.created_at;

  const aheadRow = db.prepare(`
    SELECT COUNT(*) as count FROM applications
    WHERE status = 'queued'
      AND id != ?
      AND (
        priority_rank < ?
        OR (priority_rank = ? AND queued_at < ?)
      )
  `).get(app.id, appRank, appRank, appQueuedAt) as { count: number };

  const isProcessing = isAnyApplicationProcessing();
  const position = aheadRow.count + (isProcessing ? 2 : 1);

  const totalRow = db.prepare(`
    SELECT COUNT(*) as count FROM applications WHERE status = 'queued'
  `).get() as { count: number };
  const totalInQueue = totalRow.count + (isProcessing ? 1 : 0);

  const estimatedWaitMinutes = Math.max(1, Math.round((position - 1) * 2.5));

  return {
    position,
    estimatedWaitMinutes,
    totalInQueue,
    isProcessing: false,
  };
}

export function createApplication(params: {
  userId: string;
  applicantName: string;
  passportNumber: string;
  visaType?: string;
  photoUrl?: string;
  passportPdfUrl?: string;
  formData: unknown;
}): ApplicationRecord {
  const db = getDb();
  const id = `app_${crypto.randomBytes(8).toString('hex')}`;
  const now = new Date().toISOString();
  const jsonStr = typeof params.formData === 'string' ? params.formData : JSON.stringify(params.formData);

  db.prepare(`
    INSERT INTO applications (
      id, user_id, applicant_name, passport_number, visa_type,
      status, current_step, photo_url, passport_pdf_url, form_data_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'draft', 1, ?, ?, ?, ?, ?)
  `).run(
    id,
    params.userId,
    params.applicantName.trim(),
    params.passportNumber.trim().toUpperCase(),
    params.visaType || '544',
    params.photoUrl || null,
    params.passportPdfUrl || null,
    jsonStr,
    now,
    now
  );

  return {
    id,
    user_id: params.userId,
    applicant_name: params.applicantName.trim(),
    passport_number: params.passportNumber.trim().toUpperCase(),
    visa_type: params.visaType || '544',
    status: 'draft',
    current_step: 1,
    photo_url: params.photoUrl || null,
    passport_pdf_url: params.passportPdfUrl || null,
    form_data_json: jsonStr,
    created_at: now,
    updated_at: now,
  };
}

export function getApplicationById(id: string): ApplicationRecord | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
  return (row as unknown as ApplicationRecord) || null;
}

export function getUserApplications(userId: string): (ApplicationRecord & { queue_position?: number; estimated_wait?: string })[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM applications WHERE user_id = ? ORDER BY created_at DESC').all(userId) as unknown as ApplicationRecord[];
  return rows.map((app) => {
    if (app.status === 'queued') {
      const qInfo = getApplicationQueuePosition(app.id);
      return {
        ...app,
        queue_position: qInfo.position,
        estimated_wait: `~${qInfo.estimatedWaitMinutes} মিনিট (${qInfo.estimatedWaitMinutes} mins)`,
      };
    }
    return app;
  });
}

export function updateApplication(
  id: string,
  updates: Partial<ApplicationRecord>
): ApplicationRecord | null {
  const db = getDb();
  const existing = getApplicationById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const merged = { ...existing, ...updates, updated_at: now };

  db.prepare(`
    UPDATE applications
    SET
      applicant_name = ?,
      passport_number = ?,
      visa_type = ?,
      temp_id = ?,
      web_file_number = ?,
      status = ?,
      current_step = ?,
      failed_step = ?,
      failure_reason = ?,
      pdf_path = ?,
      photo_url = ?,
      passport_pdf_url = ?,
      final_pdf_url = ?,
      status_message = ?,
      live_logs = ?,
      form_data_json = ?,
      priority_rank = ?,
      queued_at = ?,
      started_at = ?,
      completed_at = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    merged.applicant_name,
    merged.passport_number,
    merged.visa_type,
    merged.temp_id || null,
    merged.web_file_number || null,
    merged.status,
    merged.current_step,
    merged.failed_step || null,
    merged.failure_reason || null,
    merged.pdf_path || null,
    merged.photo_url || null,
    merged.passport_pdf_url || null,
    merged.final_pdf_url || null,
    merged.status_message || null,
    merged.live_logs || null,
    merged.form_data_json,
    merged.priority_rank ?? 4,
    merged.queued_at || null,
    merged.started_at || null,
    merged.completed_at || null,
    now,
    id
  );

  return merged;
}

export function deleteApplication(id: string, userId: string): boolean {
  const db = getDb();
  const res = db.prepare('DELETE FROM applications WHERE id = ? AND user_id = ?').run(id, userId);
  return res.changes > 0;
}

export interface SavedProfileRecord {
  id: string;
  user_id: string;
  profile_name: string;
  passport_number: string;
  data_json: string;
  created_at: string;
  updated_at: string;
}

export function saveOrUpdateProfile(params: {
  id?: string;
  userId: string;
  profileName: string;
  passportNumber: string;
  data: unknown;
}): SavedProfileRecord {
  const db = getDb();
  const now = new Date().toISOString();
  const dataJson = typeof params.data === 'string' ? params.data : JSON.stringify(params.data);

  const cleanPassport = params.passportNumber.trim().toUpperCase();
  let existing: SavedProfileRecord | undefined;

  if (params.id) {
    existing = db.prepare('SELECT * FROM applicant_profiles WHERE id = ? AND user_id = ?').get(params.id, params.userId) as unknown as SavedProfileRecord | undefined;
  }
  if (!existing && cleanPassport) {
    existing = db.prepare('SELECT * FROM applicant_profiles WHERE passport_number = ? AND user_id = ?').get(cleanPassport, params.userId) as unknown as SavedProfileRecord | undefined;
  }

  if (existing) {
    let finalDataJson = dataJson;
    try {
      const incoming = typeof params.data === 'string' ? JSON.parse(params.data) : params.data;
      const old = JSON.parse(existing.data_json || '{}');
      const merged = {
        ...old,
        ...incoming,
        passportPdfUrl: incoming.passportPdfUrl !== undefined ? incoming.passportPdfUrl : old.passportPdfUrl,
        passportPdfName: incoming.passportPdfName !== undefined ? incoming.passportPdfName : old.passportPdfName,
        passportPdfSizeKb: incoming.passportPdfSizeKb !== undefined ? incoming.passportPdfSizeKb : old.passportPdfSizeKb,
        photoUrl: incoming.photoUrl !== undefined ? incoming.photoUrl : old.photoUrl,
      };
      finalDataJson = JSON.stringify(merged);
    } catch {}

    db.prepare(`
      UPDATE applicant_profiles
      SET profile_name = ?, passport_number = ?, data_json = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(params.profileName.trim(), cleanPassport, finalDataJson, now, existing.id, params.userId);

    return {
      id: existing.id,
      user_id: params.userId,
      profile_name: params.profileName.trim(),
      passport_number: cleanPassport,
      data_json: finalDataJson,
      created_at: existing.created_at,
      updated_at: now,
    };
  }

  const newId = `prof_${crypto.randomBytes(8).toString('hex')}`;
  db.prepare(`
    INSERT INTO applicant_profiles (id, user_id, profile_name, passport_number, data_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(newId, params.userId, params.profileName.trim(), cleanPassport, dataJson, now, now);

  return {
    id: newId,
    user_id: params.userId,
    profile_name: params.profileName.trim(),
    passport_number: cleanPassport,
    data_json: dataJson,
    created_at: now,
    updated_at: now,
  };
}

export function getMaxProfilesForPlan(plan?: string | null, isAdmin = false): number {
  if (isAdmin) return 999;
  if (plan === 'agency') return 50;
  if (plan === 'standard') return 10;
  if (plan === 'starter') return 5;
  return 1; // Free trial gets 1 saved profile
}

export function getUserSavedProfiles(userId: string): SavedProfileRecord[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM applicant_profiles WHERE user_id = ? ORDER BY updated_at DESC').all(userId);
  return (rows as unknown as SavedProfileRecord[]) || [];
}

export function getSavedProfileById(id: string, userId: string): SavedProfileRecord | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM applicant_profiles WHERE id = ? AND user_id = ?').get(id, userId);
  return (row as unknown as SavedProfileRecord) || null;
}

export function deleteSavedProfile(id: string, userId: string): boolean {
  const db = getDb();
  const res = db.prepare('DELETE FROM applicant_profiles WHERE id = ? AND user_id = ?').run(id, userId);
  return res.changes > 0;
}

export function hasUserSeededDemoProfile(userId: string): boolean {
  const db = getDb();
  const row = db.prepare('SELECT demo_profile_seeded FROM users WHERE id = ?').get(userId) as { demo_profile_seeded?: number } | undefined;
  return Boolean(row?.demo_profile_seeded);
}

export function markUserDemoProfileSeeded(userId: string): void {
  const db = getDb();
  db.prepare('UPDATE users SET demo_profile_seeded = 1 WHERE id = ?').run(userId);
}

// -------------------------------------------------------------
// Free Trial Device Fingerprint & Abuse Protection Helpers
// -------------------------------------------------------------

export interface FreeTrialCheckResult {
  allowed: boolean;
  totalDeviceFilesUsed: number;
  remainingFiles: number;
  reason?: string;
}

export function checkAndRecordFreeTrialUsage(params: {
  fingerprint: string;
  userId: string;
  email: string;
  ipAddress?: string;
  increment?: boolean;
}): FreeTrialCheckResult {
  const db = getDb();
  const cleanFp = (params.fingerprint || 'unknown_fp').trim();
  const now = new Date().toISOString();

  // 1. Calculate how many total free files have been created by this physical device fingerprint across ANY user/account!
  const rows = db.prepare(`
    SELECT SUM(files_created) as total 
    FROM free_trial_fingerprints 
    WHERE fingerprint_hash = ?
  `).get(cleanFp) as { total: number | null } | undefined;

  const totalDeviceFilesUsed = (rows && rows.total) ? Number(rows.total) : 0;
  const remainingFiles = Math.max(0, 3 - totalDeviceFilesUsed);

  if (totalDeviceFilesUsed >= 3) {
    return {
      allowed: false,
      totalDeviceFilesUsed,
      remainingFiles: 0,
      reason: 'DEVICE_LIMIT_REACHED',
    };
  }

  // If increment is requested (when an application is created)
  if (params.increment) {
    const existing = db.prepare(`
      SELECT id, files_created 
      FROM free_trial_fingerprints 
      WHERE fingerprint_hash = ? AND user_id = ?
    `).get(cleanFp, params.userId) as { id: string; files_created: number } | undefined;

    if (existing) {
      db.prepare(`
        UPDATE free_trial_fingerprints
        SET files_created = files_created + 1, last_used_at = ?, ip_address = ?
        WHERE id = ?
      `).run(now, params.ipAddress || null, existing.id);
    } else {
      const id = `ftp_${crypto.randomBytes(8).toString('hex')}`;
      db.prepare(`
        INSERT INTO free_trial_fingerprints (id, fingerprint_hash, user_id, email, ip_address, files_created, created_at, last_used_at)
        VALUES (?, ?, ?, ?, ?, 1, ?, ?)
      `).run(id, cleanFp, params.userId, params.email.toLowerCase(), params.ipAddress || null, now, now);
    }
  }

  return {
    allowed: true,
    totalDeviceFilesUsed: params.increment ? totalDeviceFilesUsed + 1 : totalDeviceFilesUsed,
    remainingFiles: params.increment ? Math.max(0, remainingFiles - 1) : remainingFiles,
  };
}



