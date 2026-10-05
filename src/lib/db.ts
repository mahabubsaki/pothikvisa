import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { ACCESS_POLICY, AccessTier, AccountStatus } from './access-policy';

function getDhakaDateKey(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

const configuredDbPath = process.env.POTHIKVISA_DB_PATH?.trim();
const DB_PATH = configuredDbPath
  ? path.resolve(configuredDbPath)
  : path.join(process.cwd(), 'data', 'pothikvisa.db');

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
      account_status TEXT NOT NULL DEFAULT 'pending',
      approved_at TEXT,
      approved_by TEXT,
      updated_at TEXT,
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

  // Current authorization state. Historical payment records remain in transactions.
  db.exec(`
    CREATE TABLE IF NOT EXISTS memberships (
      user_id TEXT PRIMARY KEY,
      tier TEXT NOT NULL CHECK (tier IN ('free', 'paid')),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
      quota_limit INTEGER,
      quota_used INTEGER NOT NULL DEFAULT 0,
      free_quota_used INTEGER NOT NULL DEFAULT 0,
      free_quota_date TEXT,
      starts_at TEXT NOT NULL,
      expires_at TEXT,
      updated_at TEXT NOT NULL,
      updated_by TEXT,
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
  try { db.exec(`ALTER TABLE applications ADD COLUMN processing_owner TEXT;`); } catch {}
  try { db.exec(`ALTER TABLE applications ADD COLUMN heartbeat_at TEXT;`); } catch {}
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

  migrateAccessModel(db);
}

function hasColumn(db: DatabaseSync, table: string, column: string): boolean {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  return rows.some((row) => row.name === column);
}

function migrateAccessModel(db: DatabaseSync): void {
  const hadAccountStatus = hasColumn(db, 'users', 'account_status');

  if (!hadAccountStatus) {
    db.exec(`ALTER TABLE users ADD COLUMN account_status TEXT NOT NULL DEFAULT 'pending';`);
    // Existing accounts predate approval workflow and must not be locked out.
    db.exec(`UPDATE users SET account_status = 'approved';`);
  }
  if (!hasColumn(db, 'users', 'approved_at')) {
    db.exec(`ALTER TABLE users ADD COLUMN approved_at TEXT;`);
  }
  if (!hasColumn(db, 'users', 'approved_by')) {
    db.exec(`ALTER TABLE users ADD COLUMN approved_by TEXT;`);
  }
  if (!hasColumn(db, 'users', 'updated_at')) {
    db.exec(`ALTER TABLE users ADD COLUMN updated_at TEXT;`);
  }
  if (!hasColumn(db, 'memberships', 'free_quota_used')) {
    db.exec(`ALTER TABLE memberships ADD COLUMN free_quota_used INTEGER NOT NULL DEFAULT 0;`);
    db.exec(`UPDATE memberships SET free_quota_used = quota_used WHERE tier = 'free';`);
  }
  if (!hasColumn(db, 'memberships', 'free_quota_date')) {
    db.exec(`ALTER TABLE memberships ADD COLUMN free_quota_date TEXT;`);
  }

  const now = new Date().toISOString();
  db.prepare(`UPDATE users SET updated_at = COALESCE(updated_at, created_at, ?)`).run(now);
  db.prepare(`UPDATE users SET approved_at = COALESCE(approved_at, created_at, ?) WHERE account_status = 'approved'`).run(now);

  ensureCurrentMemberships(db, now);
  db.exec('DROP TABLE IF EXISTS subscriptions;');
  db.exec('DROP TABLE IF EXISTS schema_migrations;');
  db.exec('DROP TABLE IF EXISTS free_trial_fingerprints;');

  db.exec(`CREATE INDEX IF NOT EXISTS idx_memberships_tier_status ON memberships(tier, status);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_transactions_user_status ON transactions(user_id, status);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_applications_user_created ON applications(user_id, created_at DESC);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_profiles_user_updated ON applicant_profiles(user_id, updated_at DESC);`);
  db.exec(`PRAGMA journal_mode = WAL;`);
  db.exec(`PRAGMA busy_timeout = 5000;`);
}

function ensureCurrentMemberships(db: DatabaseSync, now: string): void {
  const users = db.prepare(`
    SELECT id, role FROM users
    WHERE account_status = 'approved'
  `).all() as Array<{ id: string; role: string }>;
  for (const user of users) {
    const tier: AccessTier = user.role === 'admin' ? 'paid' : 'free';
    db.prepare(`
      INSERT OR IGNORE INTO memberships (
        user_id, tier, status, quota_limit, quota_used, free_quota_used,
        starts_at, expires_at, updated_at, updated_by
      ) VALUES (?, ?, 'active', ?, 0, 0, ?, NULL, ?, 'bootstrap')
    `).run(user.id, tier, ACCESS_POLICY[tier].quotaLimit, now, now);
  }
}

export function seedAdminUser(db?: DatabaseSync) {
  const database = db || getDb();
  const adminId = process.env.ADMIN_CLERK_USER_ID?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const name = process.env.ADMIN_NAME?.trim() || 'Administrator';
  if (!adminId || !email) {
    throw new Error('ADMIN_CLERK_USER_ID and ADMIN_EMAIL are required to seed an administrator.');
  }

  const now = new Date().toISOString();
  database.prepare(`
    INSERT INTO users (
      id, name, email, canonical_email, password_hash, salt, role,
      account_status, approved_at, approved_by, updated_at, created_at
    ) VALUES (?, ?, ?, ?, '', '', 'admin', 'approved', ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      email = excluded.email,
      canonical_email = excluded.canonical_email,
      role = 'admin',
      account_status = 'approved',
      approved_at = COALESCE(users.approved_at, excluded.approved_at),
      approved_by = excluded.approved_by,
      updated_at = excluded.updated_at
  `).run(adminId, name, email, toCanonicalGmail(email), now, adminId, now, now);

  database.prepare(`
    INSERT INTO memberships (
      user_id, tier, status, quota_limit, quota_used, starts_at, expires_at, updated_at, updated_by
    ) VALUES (?, 'paid', 'active', NULL, 0, ?, NULL, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      tier = 'paid',
      status = 'active',
      quota_limit = NULL,
      expires_at = NULL,
      updated_at = excluded.updated_at,
      updated_by = excluded.updated_by
  `).run(adminId, now, now, adminId);
}

export function clearAllDatabaseData(db?: DatabaseSync) {
  const database = db || getDb();
  database.exec(`
    DELETE FROM sessions;
    DELETE FROM transactions;
    DELETE FROM applications;
    DELETE FROM applicant_profiles;
    DELETE FROM memberships;
    DELETE FROM users;
  `);
}

export function resetAndSeedDatabase(db?: DatabaseSync) {
  const database = db || getDb();
  clearAllDatabaseData(database);
  seedAdminUser(database);
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
  account_status: AccountStatus;
  approved_at?: string | null;
  approved_by?: string | null;
  updated_at?: string | null;
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
  plan: AccessTier;
  status: 'active' | 'expired' | 'revoked';
  quota_total: number | null;
  quota_used: number;
  starts_at: string;
  expires_at: string | null;
  created_at: string;
}

export interface MfsTransaction {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  plan: 'paid';
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
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  return (row as unknown as User) || null;
}

export function getUserById(id: string): User | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  return (row as unknown as User) || null;
}

export function getUserSubscription(userId: string): Subscription | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM memberships WHERE user_id = ?`).get(userId) as {
    user_id: string;
    tier: AccessTier;
    status: 'active' | 'revoked';
    quota_limit: number | null;
    quota_used: number;
    free_quota_used: number;
    free_quota_date: string | null;
    starts_at: string;
    expires_at: string | null;
    updated_at: string;
  } | undefined;

  if (!row || row.status !== 'active') return null;

  if (row.tier === 'paid' && row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
    const free = ACCESS_POLICY.free;
    return {
      id: row.user_id,
      user_id: row.user_id,
      plan: 'free',
      status: 'active',
      quota_total: free.quotaLimit,
      quota_used: row.free_quota_date === getDhakaDateKey() ? row.free_quota_used : 0,
      starts_at: row.expires_at,
      expires_at: null,
      created_at: row.updated_at,
    };
  }

  return {
    id: row.user_id,
    user_id: row.user_id,
    plan: row.tier,
    status: row.status,
    quota_total: row.quota_limit,
    quota_used: row.tier === 'free' ? (row.free_quota_date === getDhakaDateKey() ? row.free_quota_used : 0) : row.quota_used,
    starts_at: row.starts_at,
    expires_at: row.expires_at,
    created_at: row.updated_at,
  };
}

export interface AdminUserAccessRecord {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  account_status: AccountStatus;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  tier: AccessTier | null;
  membership_status: 'active' | 'revoked' | null;
  quota_limit: number | null;
  quota_used: number | null;
  expires_at: string | null;
}

export function getUsersForAdmin(): AdminUserAccessRecord[] {
  const db = getDb();
  const now = new Date().toISOString();
  const today = getDhakaDateKey();
  const rows = db.prepare(`
    SELECT
      u.id,
      u.name,
      u.email,
      u.role,
      u.account_status,
      u.approved_at,
      u.approved_by,
      u.created_at,
      CASE WHEN m.tier = 'paid' AND m.expires_at IS NOT NULL AND m.expires_at < ? THEN 'free' ELSE m.tier END AS tier,
      m.status AS membership_status,
      CASE WHEN m.tier = 'paid' AND m.expires_at IS NOT NULL AND m.expires_at < ? THEN ? ELSE m.quota_limit END AS quota_limit,
      CASE WHEN ((m.tier = 'paid' AND m.expires_at IS NOT NULL AND m.expires_at < ?) OR m.tier = 'free')
        THEN CASE WHEN m.free_quota_date = ? THEN m.free_quota_used ELSE 0 END
        ELSE m.quota_used END AS quota_used,
      m.expires_at
    FROM users u
    LEFT JOIN memberships m ON m.user_id = u.id
    ORDER BY
      CASE u.account_status WHEN 'pending' THEN 0 WHEN 'suspended' THEN 1 ELSE 2 END,
      u.created_at DESC
  `).all(now, now, ACCESS_POLICY.free.quotaLimit, now, today);
  return rows as unknown as AdminUserAccessRecord[];
}

export function createOrRenewSubscription(
  userId: string,
  plan: AccessTier,
  updatedBy = 'system'
): Subscription {
  return setUserTier(userId, plan, updatedBy);
}

export function setUserTier(
  userId: string,
  tier: AccessTier,
  updatedBy: string,
  expiresAtOverride?: string | null
): Subscription {
  const db = getDb();
  const now = new Date();
  const policy = ACCESS_POLICY[tier];
  const current = db.prepare(`
    SELECT tier, status, expires_at, free_quota_used, free_quota_date FROM memberships WHERE user_id = ?
  `).get(userId) as { tier: AccessTier; status: string; expires_at: string | null; free_quota_used: number; free_quota_date: string | null } | undefined;
  const freeQuotaUsed = current?.free_quota_date === getDhakaDateKey() ? current.free_quota_used : 0;
  const paidRenewalBase = tier === 'paid'
    && current?.tier === 'paid'
    && current.status === 'active'
    && current.expires_at
    && new Date(current.expires_at).getTime() > now.getTime()
      ? new Date(current.expires_at)
      : now;
  const expiresAt = expiresAtOverride !== undefined
    ? expiresAtOverride
    : policy.durationDays === null
      ? null
      : new Date(paidRenewalBase.getTime() + policy.durationDays * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO memberships (
      user_id, tier, status, quota_limit, quota_used, free_quota_used, free_quota_date,
      starts_at, expires_at, updated_at, updated_by
    ) VALUES (?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      tier = excluded.tier,
      status = 'active',
      quota_limit = excluded.quota_limit,
      quota_used = excluded.quota_used,
      free_quota_used = memberships.free_quota_used,
      free_quota_date = memberships.free_quota_date,
      starts_at = excluded.starts_at,
      expires_at = excluded.expires_at,
      updated_at = excluded.updated_at,
      updated_by = excluded.updated_by
  `).run(userId, tier, policy.quotaLimit, tier === 'free' ? freeQuotaUsed : 0, current?.free_quota_used || 0, current?.free_quota_date ?? null, now.toISOString(), expiresAt, now.toISOString(), updatedBy);

  return {
    id: userId,
    user_id: userId,
    plan: tier,
    status: 'active',
    quota_total: policy.quotaLimit,
    quota_used: tier === 'free' ? freeQuotaUsed : 0,
    starts_at: now.toISOString(),
    expires_at: expiresAt,
    created_at: now.toISOString(),
  };
}

export function approveAccount(userId: string, adminId: string): Subscription {
  const db = getDb();
  const now = new Date().toISOString();
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = db.prepare(`
      UPDATE users
      SET account_status = 'approved', approved_at = ?, approved_by = ?, updated_at = ?
      WHERE id = ?
    `).run(now, adminId, now, userId);
    if (result.changes === 0) throw new Error('USER_NOT_FOUND');
    const membership = getUserSubscription(userId) || setUserTier(userId, 'free', adminId);
    db.exec('COMMIT');
    return membership;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function suspendAccount(userId: string, adminId: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = db.prepare(`
      UPDATE users SET account_status = 'suspended', updated_at = ? WHERE id = ?
    `).run(now, userId);
    if (result.changes === 0) throw new Error('USER_NOT_FOUND');
    db.prepare(`
      UPDATE memberships SET status = 'revoked', updated_at = ?, updated_by = ? WHERE user_id = ?
    `).run(now, adminId, userId);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function createTransaction(params: {
  userId: string;
  mfsMethod: 'bkash' | 'nagad' | 'rocket';
  senderPhone: string;
  trxId: string;
  note?: string;
}): MfsTransaction {
  const db = getDb();
  const id = `trx_${crypto.randomBytes(8).toString('hex')}`;
  const now = new Date().toISOString();
  const cleanTrx = params.trxId.trim().toUpperCase();
  const plan = 'paid' as const;
  const amount = ACCESS_POLICY.paid.priceBdt;

  db.prepare(`
    INSERT INTO transactions (id, user_id, plan, amount, mfs_method, sender_phone, trx_id, status, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
  `).run(id, params.userId, plan, amount, params.mfsMethod, params.senderPhone.trim(), cleanTrx, params.note || '', now);

  return {
    id,
    user_id: params.userId,
    plan,
    amount,
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
  db.exec('BEGIN IMMEDIATE');
  try {
    const trx = db.prepare(`
      SELECT * FROM transactions WHERE (id = ? OR trx_id = ?) AND status = 'pending'
    `).get(trxIdOrId, trxIdOrId) as unknown as MfsTransaction | undefined;
    if (!trx) {
      db.exec('ROLLBACK');
      return false;
    }

    db.prepare(`
      UPDATE transactions
      SET status = 'approved', reviewed_at = ?, reviewed_by = ?
      WHERE id = ? AND status = 'pending'
    `).run(now, adminEmail, trx.id);
    setUserTier(trx.user_id, 'paid', adminEmail);
    db.exec('COMMIT');
    return true;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function rejectTransaction(trxIdOrId: string, reason: string, adminEmail: string): boolean {
  const db = getDb();
  const now = new Date().toISOString();

  const trx = db.prepare(`
    SELECT * FROM transactions WHERE (id = ? OR trx_id = ?) AND status = 'pending'
  `).get(trxIdOrId, trxIdOrId) as unknown as MfsTransaction | undefined;
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
  processing_owner?: string | null;
  heartbeat_at?: string | null;
  created_at: string;
  updated_at: string;
}

export function deductUserQuota(userId: string): boolean {
  const db = getDb();
  let sub = getUserSubscription(userId);
  if (!sub) return false;
  const raw = db.prepare('SELECT tier, expires_at FROM memberships WHERE user_id = ?').get(userId) as {
    tier: AccessTier;
    expires_at: string | null;
  } | undefined;
  if (sub.plan === 'free' && raw?.tier === 'paid') {
    sub = setUserTier(userId, 'free', 'system:paid-expired');
  }

  const today = getDhakaDateKey();
  const result = db.prepare(`
    UPDATE memberships
    SET free_quota_used = CASE WHEN tier = 'free' AND free_quota_date = ? THEN free_quota_used + 1 WHEN tier = 'free' THEN 1 ELSE free_quota_used END,
    quota_used = CASE WHEN tier = 'free' AND free_quota_date = ? THEN free_quota_used + 1 WHEN tier = 'free' THEN 1 ELSE quota_used END,
    free_quota_date = CASE WHEN tier = 'free' THEN ? ELSE free_quota_date END,
    updated_at = ?
    WHERE user_id = ?
      AND status = 'active'
      AND (tier = 'paid' OR free_quota_date IS NULL OR free_quota_date <> ? OR free_quota_used < quota_limit)
  `).run(today, today, today, new Date().toISOString(), userId, today);
  return result.changes === 1;
}

export function hasRemainingQuota(subscription: Subscription | null): boolean {
  if (!subscription) return false;
  return subscription.quota_total === null || subscription.quota_used < subscription.quota_total;
}

export function getPlanPriorityRank(plan?: string | null): number {
  return plan === 'paid' ? 1 : 2;
}

export function enqueueApplication(appId: string, priorityRank: number): boolean {
  const db = getDb();
  const now = new Date().toISOString();
  const result = db.prepare(`
    UPDATE applications
    SET status = 'queued',
        priority_rank = ?,
        queued_at = ?,
        started_at = NULL,
        completed_at = NULL,
        processing_owner = NULL,
        heartbeat_at = NULL,
        failed_step = NULL,
        failure_reason = NULL,
        status_message = 'সারিবদ্ধ রয়েছে (অটোমেশন শুরুর অপেক্ষায়)...',
        updated_at = ?
    WHERE id = ? AND status IN ('draft', 'failed')
  `).run(priorityRank, now, now, appId);
  return result.changes === 1;
}

export function claimNextQueuedApplication(workerId: string): ApplicationRecord | null {
  const db = getDb();
  db.exec('BEGIN IMMEDIATE');
  try {
    const active = db.prepare("SELECT id FROM applications WHERE status = 'processing' LIMIT 1").get();
    if (active) {
      db.exec('COMMIT');
      return null;
    }
    const row = db.prepare(`
      SELECT id FROM applications
      WHERE status = 'queued'
      ORDER BY priority_rank ASC, queued_at ASC
      LIMIT 1
    `).get() as { id: string } | undefined;
    if (!row) {
      db.exec('COMMIT');
      return null;
    }
    const now = new Date().toISOString();
    const result = db.prepare(`
      UPDATE applications
      SET status = 'processing', started_at = ?, heartbeat_at = ?, processing_owner = ?, updated_at = ?
      WHERE id = ? AND status = 'queued'
    `).run(now, now, workerId, now, row.id);
    if (result.changes !== 1) {
      db.exec('COMMIT');
      return null;
    }
    const claimed = db.prepare('SELECT * FROM applications WHERE id = ?').get(row.id) as ApplicationRecord | undefined;
    db.exec('COMMIT');
    return claimed || null;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function refreshApplicationHeartbeat(appId: string, workerId: string): boolean {
  const now = new Date().toISOString();
  const result = getDb().prepare(`
    UPDATE applications SET heartbeat_at = ?, updated_at = ?
    WHERE id = ? AND status = 'processing' AND processing_owner = ?
  `).run(now, now, appId, workerId);
  return result.changes === 1;
}

export function releaseApplicationClaim(appId: string, workerId: string): void {
  getDb().prepare(`
    UPDATE applications SET processing_owner = NULL, heartbeat_at = NULL
    WHERE id = ? AND processing_owner = ?
  `).run(appId, workerId);
}

export function recoverStaleProcessingApplications(staleAfterMs = 120_000): number {
  const now = new Date().toISOString();
  const staleBefore = new Date(Date.now() - staleAfterMs).toISOString();
  const result = getDb().prepare(`
    UPDATE applications
    SET status = 'failed',
        failure_reason = 'Automation stopped unexpectedly. Review the application before resuming to avoid duplicate submission.',
        status_message = 'Automation stopped unexpectedly. Please review before resuming.',
        completed_at = ?, processing_owner = NULL, heartbeat_at = NULL, updated_at = ?
    WHERE status = 'processing' AND (heartbeat_at IS NULL OR heartbeat_at < ?)
  `).run(now, now, staleBefore);
  return Number(result.changes);
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
  if (isAdmin) return Number.MAX_SAFE_INTEGER;
  return ACCESS_POLICY[plan === 'paid' ? 'paid' : 'free'].maxProfiles;
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

