import { after, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'pothikvisa-access-'));
process.env.POTHIKVISA_DB_PATH = path.join(testDirectory, 'test.db');
const database = await import('./db');

after(() => {
  database.getDb().close();
  fs.rmSync(testDirectory, { recursive: true, force: true });
});

describe('account approval and tier changes', () => {
  test('a new pending user gets free access only after approval', () => {
    const db = database.getDb();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO users (
        id, name, email, canonical_email, password_hash, salt, role,
        account_status, updated_at, created_at
      ) VALUES (?, ?, ?, ?, '', '', 'user', 'pending', ?, ?)
    `).run('user_test', 'Test User', 'test@example.com', 'test@example.com', now, now);

    assert.equal(database.getUserSubscription('user_test'), null);
    const subscription = database.approveAccount('user_test', 'admin_test');
    assert.equal(database.getUserById('user_test')?.account_status, 'approved');
    assert.equal(subscription.plan, 'free');
    assert.equal(subscription.quota_total, 3);
  });

  test('one tier call grants or revokes paid access', () => {
    assert.equal(database.deductUserQuota('user_test'), true);
    const firstPaid = database.setUserTier('user_test', 'paid', 'admin_test');
    assert.equal(firstPaid.plan, 'paid');
    assert.equal(database.getUserSubscription('user_test')?.quota_total, null);
    const renewed = database.setUserTier('user_test', 'paid', 'admin_test');
    assert.ok(new Date(renewed.expires_at!).getTime() > new Date(firstPaid.expires_at!).getTime());
    assert.equal(database.setUserTier('user_test', 'free', 'admin_test').plan, 'free');
    assert.equal(database.getUserSubscription('user_test')?.quota_total, 3);
    assert.equal(database.getUserSubscription('user_test')?.quota_used, 1);
  });

  test('suspension revokes all membership access', () => {
    assert.equal(database.deductUserQuota('user_test'), true);
    assert.equal(database.deductUserQuota('user_test'), true);
    assert.equal(database.deductUserQuota('user_test'), false);
    database.suspendAccount('user_test', 'admin_test');
    assert.equal(database.getUserById('user_test')?.account_status, 'suspended');
    assert.equal(database.getUserSubscription('user_test'), null);
  });
});
