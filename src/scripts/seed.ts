import { resetAndSeedDatabase, getDb } from '../lib/db';

console.log('🔄 Wiping all data from SQLite database and seeding fresh admin...');
resetAndSeedDatabase();

const db = getDb();
const admin = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE email = ?').get('saki.admin@pothikvisa.com') as { id: string } | undefined;
const sub = admin ? db.prepare('SELECT * FROM subscriptions WHERE user_id = ?').get(admin.id) : null;

console.log('✅ SQLite database cleared & fresh admin seeded successfully:');
console.log(JSON.stringify({ admin, subscription: sub }, null, 2));
