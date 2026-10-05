import { currentUser } from '@clerk/nextjs/server';
import {
  getDb,
  User,
  Subscription,
  getUserSubscription,
  createOrRenewSubscription,
  toCanonicalGmail,
} from './db';

export interface AuthenticatedProfile {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isAdmin: boolean;
  subscription: Subscription | null;
  authProvider: 'clerk';
}

/** Maps the current Clerk user to the application's local profile. */
export async function getAuthenticatedUser(): Promise<AuthenticatedProfile | null> {
  try {
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
    const isAdmin = clerkUser.publicMetadata?.role === 'admin';
    const role: 'user' | 'admin' = isAdmin ? 'admin' : 'user';
    const canonicalEmail = toCanonicalGmail(cleanEmail);
    const db = getDb();
    const existing = db
      .prepare('SELECT * FROM users WHERE id = ? OR email = ? OR canonical_email = ?')
      .get(clerkUser.id, cleanEmail, canonicalEmail) as unknown as User | undefined;

    if (!existing) {
      db.prepare(`
        INSERT INTO users (id, name, email, canonical_email, password_hash, salt, role, created_at)
        VALUES (?, ?, ?, ?, '', '', ?, ?)
      `).run(clerkUser.id, name, email, canonicalEmail, role, new Date().toISOString());
      createOrRenewSubscription(clerkUser.id, isAdmin ? 'agency' : 'free');
    } else if (existing.id !== clerkUser.id) {
      db.exec('PRAGMA foreign_keys = OFF;');
      try {
        db.prepare(
          'UPDATE users SET id = ?, role = ?, email = ?, canonical_email = ? WHERE id = ?'
        ).run(clerkUser.id, role, email, canonicalEmail, existing.id);
        db.prepare('UPDATE subscriptions SET user_id = ? WHERE user_id = ?').run(clerkUser.id, existing.id);
        db.prepare('UPDATE transactions SET user_id = ? WHERE user_id = ?').run(clerkUser.id, existing.id);
        db.prepare('UPDATE applications SET user_id = ? WHERE user_id = ?').run(clerkUser.id, existing.id);
        try {
          db.prepare('UPDATE applicant_profiles SET user_id = ? WHERE user_id = ?').run(clerkUser.id, existing.id);
        } catch {
          // The table is optional in older databases.
        }
      } finally {
        db.exec('PRAGMA foreign_keys = ON;');
      }
    } else {
      db.prepare('UPDATE users SET role = ?, canonical_email = ? WHERE id = ?').run(
        role,
        canonicalEmail,
        clerkUser.id
      );
    }

    return {
      id: clerkUser.id,
      name,
      email,
      role,
      isAdmin,
      subscription: getUserSubscription(clerkUser.id),
      authProvider: 'clerk',
    };
  } catch (error) {
    console.error('[currentAuth] Authentication error:', error);
    return null;
  }
}

export async function requireAuthenticatedUser(): Promise<AuthenticatedProfile> {
  const profile = await getAuthenticatedUser();
  if (!profile) throw new Error('UNAUTHORIZED');
  return profile;
}

export async function requireAdminUser(): Promise<AuthenticatedProfile> {
  const profile = await requireAuthenticatedUser();
  if (profile.role !== 'admin') throw new Error('FORBIDDEN');
  return profile;
}
