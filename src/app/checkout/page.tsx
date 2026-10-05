'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Copy, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { ACCESS_POLICY } from '@/lib/access-policy';

type MfsMethod = 'bkash' | 'nagad' | 'rocket';
const ACCOUNTS: Record<MfsMethod, { label: string; number: string }> = {
  bkash: { label: 'bKash', number: '01714269744' },
  nagad: { label: 'Nagad', number: '01714269744' },
  rocket: { label: 'Rocket', number: '017142697440' },
};

function CheckoutContent() {
  const { isLoaded, isSignedIn } = useUser();
  const [method, setMethod] = useState<MfsMethod>('bkash');
  const [senderPhone, setSenderPhone] = useState('');
  const [trxId, setTrxId] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const price = ACCESS_POLICY.paid.priceBdt;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!isSignedIn) {
      setError('Sign in with an approved account before submitting payment.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch('/api/transactions/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mfsMethod: method, senderPhone, trxId, note }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Payment submission failed');
      setSubmitted(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Payment submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-3xl border border-emerald-200 bg-white p-10 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <h1 className="mt-5 text-2xl font-bold">Payment submitted</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">An administrator will verify the transaction. Paid access begins only after approval.</p>
          <Button asChild className="mt-7"><Link href="/dashboard">Return to dashboard</Link></Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="rounded-3xl bg-slate-950 p-8 text-white">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300"><ShieldCheck className="h-5 w-5" />Paid access</div>
          <div className="mt-7 text-5xl font-black">৳{price}</div>
          <p className="mt-1 text-sm text-slate-400">30 days</p>
          <ul className="mt-8 space-y-3 text-sm text-slate-200">
            <li>Unlimited web files</li><li>50 applicant profiles</li><li>OCR and AI extraction</li><li>Batch processing and PDF preview</li><li>Priority processing</li>
          </ul>
          <p className="mt-8 border-t border-slate-800 pt-6 text-xs leading-5 text-slate-400">The server fixes the price and tier. Values sent from the browser cannot change the amount or access granted.</p>
        </aside>

        <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-2"><Lock className="h-5 w-5 text-emerald-600" /><h1 className="text-2xl font-bold">Submit MFS payment</h1></div>
          <p className="mt-2 text-sm text-slate-500">Send ৳{price} using Send Money, then enter the transaction details.</p>

          <div className="mt-7 grid grid-cols-3 gap-2">
            {(Object.keys(ACCOUNTS) as MfsMethod[]).map((item) => <button key={item} type="button" onClick={() => setMethod(item)} className={`rounded-xl border px-3 py-3 text-sm font-semibold ${method === item ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200'}`}>{ACCOUNTS[item].label}</button>)}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-4">
            <div><div className="text-xs text-slate-500">Send Money to</div><div className="font-mono font-bold">{ACCOUNTS[method].number}</div></div>
            <Button type="button" size="sm" variant="outline" onClick={() => void navigator.clipboard.writeText(ACCOUNTS[method].number)}><Copy className="mr-1 h-4 w-4" />Copy</Button>
          </div>

          <label className="mt-6 block text-sm font-semibold">Sender phone</label>
          <input value={senderPhone} onChange={(event) => setSenderPhone(event.target.value)} inputMode="numeric" placeholder="01XXXXXXXXX" maxLength={11} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600" required />
          <label className="mt-4 block text-sm font-semibold">Transaction ID</label>
          <input value={trxId} onChange={(event) => setTrxId(event.target.value.toUpperCase())} placeholder="TrxID" maxLength={40} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-mono outline-none focus:border-emerald-600" required />
          <label className="mt-4 block text-sm font-semibold">Note <span className="font-normal text-slate-400">(optional)</span></label>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={300} className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600" />

          {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {!isLoaded ? <div className="mt-6 text-sm text-slate-500">Checking account…</div> : !isSignedIn ? <Button asChild className="mt-6 w-full"><Link href="/sign-in?redirect_url=/checkout">Sign in to continue</Link></Button> : <Button type="submit" className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit for verification</Button>}
        </form>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return <Suspense fallback={<div className="p-12 text-center">Loading checkout…</div>}><CheckoutContent /></Suspense>;
}
