import { after, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'pothikvisa-storage-'));
process.env.POTHIKVISA_STORAGE_ROOT = path.join(testDirectory, 'private-uploads');
delete process.env.R2_ACCOUNT_ID;
delete process.env.R2_ACCESS_KEY_ID;
delete process.env.R2_SECRET_ACCESS_KEY;

const storage = await import('./r2');

after(() => {
  fs.rmSync(testDirectory, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
});

describe('private storage', () => {
  test('stores local fallback outside the public directory', async () => {
    const result = await storage.uploadBufferToStorage({
      key: 'applications/app_test/photo.jpg',
      buffer: Buffer.from('private-image'),
      contentType: 'image/jpeg',
    });
    assert.equal(result.url, 'storage:applications/app_test/photo.jpg');
    assert.equal(fs.existsSync(path.join(testDirectory, 'public', 'uploads', 'applications', 'app_test', 'photo.jpg')), false);
    assert.equal((await storage.downloadR2Buffer(result.key)).toString(), 'private-image');
  });

  test('rejects traversal keys', async () => {
    await assert.rejects(() => storage.uploadBufferToStorage({
      key: '../escape.txt',
      buffer: Buffer.from('no'),
      contentType: 'text/plain',
    }), /INVALID_STORAGE_KEY/);
  });
});
