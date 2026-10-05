import { currentUser } from '@clerk/nextjs/server';
import { Permission, hasTierPermission, AccountStatus, AccessTier } from './access-policy';
import {
  getDb,
  User,
  Subscription,
  getUserSubscription,
  getApplicationById,
  ApplicationRecord,
  toCanonicalGmail,
} from './db';

export interface AuthenticatedProfile {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isAdmin: boolean;
  accountStatus: AccountStatus;
  tier: AccessTier | null;
  subscription: Subscription | null;
  authProvider: 'clerk';
}

interface AuthOptions {
  allowUnapproved?: boolean;
}

/** Maps the current Clerk identity to one local authorization record. */
export async function getAuthenticatedUser(
  options: AuthOptions = {}
): Promise<AuthenticatedProfile | null> {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email =
    clerkUser.primaryEmailAddress?.emailAddress ||
    clerkUser.emailAddresses[0]?.emailAddress ||
    '';
  const cleanEmail = email.toLowerCase().trim();
  const name =
    `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
    email.split('@')[0] ||
    'User';
  const metadataAdmin = clerkUser.publicMetadata?.role === 'admin';
  const canonicalEmail = toCanonicalGmail(cleanEmail);
  const db = getDb();
  let existing = db
    .prepare('SELECT * FROM users WHERE id = ? OR email = ? OR canonical_email = ?')
    .get(clerkUser.id, cleanEmail, canonicalEmail) as unknown as User | undefined;
  const now = new Date().toISOString();

  if (!existing) {
    const initialStatus: AccountStatus = metadataAdmin ? 'approved' : 'pending';
    const initialRole: 'user' | 'admin' = metadataAdmin ? 'admin' : 'user';
    db.prepare(`
      INSERT INTO users (
        id, name, email, canonical_email, password_hash, salt, role,
        account_status, approved_at, approved_by, updated_at, created_at
      ) VALUES (?, ?, ?, ?, '', '', ?, ?, ?, ?, ?, ?)
    `).run(
      clerkUser.id,
      name,
      cleanEmail,
      canonicalEmail,
      initialRole,
      initialStatus,
      metadataAdmin ? now : null,
      metadataAdmin ? clerkUser.id : null,
      now,
      now
    );
  } else if (existing.id !== clerkUser.id) {
    // Compatibility path for records created before Clerk IDs became the primary key.
    db.exec('PRAGMA foreign_keys = OFF;');
    try {
      db.prepare(`
        UPDATE users
        SET id = ?, name = ?, email = ?, canonical_email = ?, updated_at = ?
        WHERE id = ?
      `).run(clerkUser.id, name, cleanEmail, canonicalEmail, now, existing.id);
      for (const table of ['sessions', 'memberships', 'transactions', 'applications', 'applicant_profiles']) {
        try {
          db.prepare(`UPDATE ${table} SET user_id = ? WHERE user_id = ?`).run(clerkUser.id, existing.id);
        } catch {
          // Some optional tables may not exist in every deployment.
        }
      }
    } finally {
      db.exec('PRAGMA foreign_keys = ON;');
    }
  } else {
    const localAdmin = existing.role === 'admin';
    db.prepare(`
      UPDATE users
      SET name = ?, email = ?, canonical_email = ?,
          account_status = CASE WHEN ? = 1 THEN 'approved' ELSE account_status END,
          approved_at = CASE WHEN ? = 1 THEN COALESCE(approved_at, ?) ELSE approved_at END,
          approved_by = CASE WHEN ? = 1 THEN COALESCE(approved_by, ?) ELSE approved_by END,
          updated_at = ?
      WHERE id = ?
    `).run(
      name,
      cleanEmail,
      canonicalEmail,
      localAdmin ? 1 : 0,
      localAdmin ? 1 : 0,
      now,
      localAdmin ? 1 : 0,
      clerkUser.id,
      now,
      clerkUser.id
    );
  }

  existing = db.prepare('SELECT * FROM users WHERE id = ?').get(clerkUser.id) as unknown as User;
  const role = existing.role;
  const isAdmin = role === 'admin';
  const subscription = existing.account_status === 'approved'
    ? getUserSubscription(clerkUser.id)
    : null;
  const profile: AuthenticatedProfile = {
    id: clerkUser.id,
    name,
    email: cleanEmail,
    role,
    isAdmin,
    accountStatus: existing.account_status,
    tier: subscription?.plan || null,
    subscription,
    authProvider: 'clerk',
  };

  if (!options.allowUnapproved && profile.accountStatus !== 'approved') {
    return null;
  }

  return profile;
}

export async function requireAuthenticatedUser(): Promise<AuthenticatedProfile> {
  const profile = await getAuthenticatedUser({ allowUnapproved: true });
  if (!profile) throw new Error('UNAUTHORIZED');
  if (profile.accountStatus === 'pending') throw new Error('ACCOUNT_PENDING');
  if (profile.accountStatus === 'suspended') throw new Error('ACCOUNT_SUSPENDED');
  return profile;
}

export async function requirePermission(permission: Permission): Promise<AuthenticatedProfile> {
  const profile = await requireAuthenticatedUser();
  if (!profile.isAdmin) {
    if (!profile.tier || !hasTierPermission(profile.tier, permission)) {
      throw new Error('FORBIDDEN');
    }
  }
  return profile;
}

export async function requireAdminUser(): Promise<AuthenticatedProfile> {
  const profile = await requireAuthenticatedUser();
  if (!profile.isAdmin) throw new Error('FORBIDDEN');
  return profile;
}

export async function requireApplicationAccess(
  applicationId: string,
  permission: Permission
): Promise<{ user: AuthenticatedProfile; application: ApplicationRecord }> {
  const user = await requirePermission(permission);
  const application = getApplicationById(applicationId);
  if (!application) throw new Error('NOT_FOUND');
  if (!user.isAdmin && application.user_id !== user.id) throw new Error('FORBIDDEN');
  return { user, application };
}
