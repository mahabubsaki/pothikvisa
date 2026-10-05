# Access-control architecture

The application has two independent authorization decisions:

1. `users.account_status` decides whether the account may enter protected areas: `pending`, `approved`, or `suspended`.
2. `memberships.tier` decides which product capabilities an approved account receives: `free` or `paid`.

`src/lib/access-policy.ts` is the single feature matrix. Routes call `requirePermission(...)`; they do not compare prices or legacy plan names.

## Account lifecycle

```text
Clerk sign-up
  -> local account: pending, no membership
  -> admin approves
  -> local account: approved + free membership
  -> admin verifies 500 BDT payment
  -> paid membership for 30 days
  -> expiry evaluates as free access

Admin suspension
  -> account: suspended
  -> membership: revoked
  -> no protected page or API access
```

The old multi-plan subscription table and public upload storage have been removed. Authorization reads only `memberships`, and private documents use opaque `storage:` locators.

## One-line access changes

```ts
setUserTier(userId, 'paid', adminId); // grant Paid
setUserTier(userId, 'free', adminId); // revoke Paid, retain Free
approveAccount(userId, adminId);      // approve account with Free access
suspendAccount(userId, adminId);      // revoke all protected access
```

These operations are also exposed safely through the administrator user screen at `/admin/users`.

## Product policy

| Capability | Free | Paid |
|---|---:|---:|
| Web files per day | 3 | Unlimited |
| Saved profiles | 1 | 50 |
| Basic form automation | Yes | Yes |
| Passport OCR, AI extraction, PDF preview | No | Yes |
| Batch and priority processing | No | Yes |
| Duration | No expiry | 30 days |
| Price | 0 BDT | 500 BDT |

Changing feature access requires editing one permission list in `src/lib/access-policy.ts`. Changing a user requires one of the calls above; no Clerk metadata update is required because the local database is the authorization source of truth.

## Enforcement layers

- Clerk proxy: requires a signed-in identity for protected URL groups.
- Server layouts: prevent pending or suspended accounts from rendering dashboard, apply, application, or admin pages.
- Data-access/API layer: checks account approval and named permissions for every sensitive operation.
- Database: performs payment approval and tier activation in one transaction and deducts limited quota atomically.
- Storage: stores identity documents outside `public/` and exposes them only through owner-checked API routes.

## Queue deployment

Queued applications live in SQLite. Run `bun run queue:worker` as a separate supervised process beside `bun run web:start`. Workers claim one job atomically, refresh a database heartbeat, and recover only stale claims. Interrupted jobs require review before resume so an uncertain external portal submission is never duplicated automatically.

## Private media

Application and profile documents are stored as opaque `storage:` keys. The local fallback root is `data/uploads` (or `POTHIKVISA_STORAGE_ROOT`), never `public/`. When R2 is configured, reads still check the local fallback after an R2 miss so files written during an outage remain available.
