import 'dotenv/config';
import { getDb, seedAdminUser } from '../lib/db';

console.log('Provisioning the configured administrator; existing application data is preserved.');
seedAdminUser();

const db = getDb();
const adminId = process.env.ADMIN_CLERK_USER_ID?.trim();
const admin = adminId
  ? db.prepare('SELECT id, name, email, role, account_status, created_at FROM users WHERE id = ?').get(adminId)
  : null;
const membership = adminId
  ? db.prepare('SELECT tier, status, quota_limit, expires_at FROM memberships WHERE user_id = ?').get(adminId)
  : null;

console.log('Administrator provisioning complete:');
console.log(JSON.stringify({ admin, membership }, null, 2));
