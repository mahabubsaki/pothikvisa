'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock3, CreditCard, RefreshCw, ShieldBan, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AccessUser = {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  account_status: 'pending' | 'approved' | 'suspended';
  created_at: string;
  tier: 'free' | 'paid' | null;
  quota_used: number | null;
  quota_limit: number | null;
  expires_at: string | null;
};

type UserAction = 'approve' | 'suspend' | 'grant_free' | 'grant_paid';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AccessUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/users', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load users');
      setUsers(data.users);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const pendingCount = useMemo(
    () => users.filter((user) => user.account_status === 'pending').length,
    [users]
  );

  async function updateAccess(userId: string, action: UserAction) {
    setWorkingId(userId);
    setError('');
    try {
      const response = await fetch('/api/admin/users/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update user');
      setUsers((current) => current.map((user) => user.id === userId ? data.user : user));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not update user');
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700">Access control</p>
            <h1 className="text-3xl font-bold text-slate-950">User approvals</h1>
            <p className="mt-1 text-sm text-slate-600">{pendingCount} account{pendingCount === 1 ? '' : 's'} waiting for approval.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link href="/admin/transactions">Payments</Link></Button>
            <Button variant="outline" onClick={() => void loadUsers()} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Account</th>
                <th className="px-5 py-4">Access tier</th>
                <th className="px-5 py-4">Usage</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => {
                const busy = workingId === user.id;
                return (
                  <tr key={user.id} className="align-top">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{user.name || 'Unnamed user'}</div>
                      <div className="text-slate-500">{user.email}</div>
                      <div className="mt-1 text-xs text-slate-400">Joined {new Date(user.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        user.account_status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                          user.account_status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {user.account_status === 'approved' ? <CheckCircle2 className="h-3.5 w-3.5" /> :
                          user.account_status === 'pending' ? <Clock3 className="h-3.5 w-3.5" /> : <ShieldBan className="h-3.5 w-3.5" />}
                        {user.account_status}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold capitalize text-slate-800">{user.tier || 'none'}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {user.quota_limit === null && user.tier === 'paid' ? 'Unlimited' : `${user.quota_used || 0} / ${user.quota_limit || 0}`}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        {user.account_status !== 'approved' && (
                          <Button size="sm" onClick={() => void updateAccess(user.id, 'approve')} disabled={busy}>
                            Approve
                          </Button>
                        )}
                        {user.account_status === 'approved' && user.role !== 'admin' && (
                          <Button size="sm" variant="outline" onClick={() => void updateAccess(user.id, 'suspend')} disabled={busy}>
                            Suspend
                          </Button>
                        )}
                        {user.account_status === 'approved' && user.tier !== 'free' && (
                          <Button size="sm" variant="outline" onClick={() => void updateAccess(user.id, 'grant_free')} disabled={busy}>
                            <Users className="mr-1 h-3.5 w-3.5" /> Free
                          </Button>
                        )}
                        {user.account_status === 'approved' && user.tier !== 'paid' && (
                          <Button size="sm" variant="outline" onClick={() => void updateAccess(user.id, 'grant_paid')} disabled={busy}>
                            <CreditCard className="mr-1 h-3.5 w-3.5" /> Paid
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && users.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">No users found.</td></tr>
              )}
            </tbody>
          </table>
          {loading && <div className="p-12 text-center text-sm text-slate-500">Loading users…</div>}
        </div>
      </div>
    </main>
  );
}
