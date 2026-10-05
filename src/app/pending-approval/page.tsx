'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClerk, useUser } from '@clerk/nextjs';
import { Clock3, LogOut, RefreshCw, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AccountStatus = 'pending' | 'approved' | 'suspended';

export default function PendingApprovalPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const [status, setStatus] = useState<AccountStatus>('pending');
  const [checking, setChecking] = useState(true);

  const refreshStatus = async () => {
    setChecking(true);
    try {
      const response = await fetch('/api/auth/me', { cache: 'no-store' });
      const data = await response.json();
      const nextStatus = data.user?.accountStatus as AccountStatus | undefined;
      if (nextStatus === 'approved') {
        router.replace('/dashboard');
        return;
      }
      if (nextStatus) setStatus(nextStatus);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace('/sign-in');
      return;
    }
    void refreshStatus();
  }, [isLoaded, isSignedIn]);

  const suspended = status === 'suspended';

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-[#FBFBFB] px-4 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm space-y-5">
        <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${suspended ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
          {suspended ? <ShieldX className="h-7 w-7" /> : <Clock3 className="h-7 w-7" />}
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-zinc-950">
            {suspended ? 'Account access suspended' : 'Account approval pending'}
          </h1>
          <p className="text-sm leading-6 text-zinc-600">
            {suspended
              ? 'Your account cannot access the dashboard or protected services. Contact an administrator if you believe this is a mistake.'
              : 'An administrator must approve your account before you can use the dashboard, create profiles, or run visa automation.'}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          {!suspended && (
            <Button type="button" variant="outline" onClick={refreshStatus} disabled={checking}>
              <RefreshCw className={`mr-2 h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
              Check approval
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => signOut({ redirectUrl: '/' })}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}

