import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { ACCESS_POLICY, hasTierPermission } from './access-policy';

describe('access policy', () => {
  test('has exactly the two public tiers', () => {
    assert.deepEqual(Object.keys(ACCESS_POLICY), ['free', 'paid']);
  });

  test('free access is limited and non-expiring', () => {
    assert.equal(ACCESS_POLICY.free.quotaLimit, 3);
    assert.equal(ACCESS_POLICY.free.maxProfiles, 1);
    assert.equal(ACCESS_POLICY.free.durationDays, null);
    assert.equal(hasTierPermission('free', 'applications.run'), true);
    assert.equal(hasTierPermission('free', 'ai.extract'), false);
  });

  test('paid access enables advanced capabilities', () => {
    assert.equal(ACCESS_POLICY.paid.priceBdt, 500);
    assert.equal(ACCESS_POLICY.paid.durationDays, 30);
    assert.equal(ACCESS_POLICY.paid.quotaLimit, null);
    assert.equal(hasTierPermission('paid', 'ai.extract'), true);
    assert.equal(hasTierPermission('paid', 'applications.batch'), true);
  });
});
