'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  User,
  Shield,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  PlusCircle,
  ExternalLink,
  LogOut,
  RefreshCw,
  Sparkles,
  Zap,
  Lock,
  ChevronRight,
  ShieldCheck,
  Building,
  Trash2,
  FileCheck,
  Globe,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/context/LanguageContext';
import { PothikVisaLogo } from '@/components/PothikVisaLogo';
import { LiveAutomationModal } from '@/components/LiveAutomationModal';
import { IvacChecklistModal } from '@/components/IvacChecklistModal';
import { EditAndResumeModal } from '@/components/EditAndResumeModal';
import { ApplicationQrModal } from '@/components/ApplicationQrModal';
import { PaymentHistory, type PaymentTransaction } from '@/components/dashboard/PaymentHistory';
import { ApplicationHistory, type ApplicationItem } from '@/components/dashboard/ApplicationHistory';
import { useClerk, useUser } from '@clerk/nextjs';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  accountStatus: 'pending' | 'approved' | 'suspended';
  tier: 'free' | 'paid' | null;
  authProvider: 'clerk' | 'local';
}

interface SubscriptionData {
  id: string;
  plan: 'free' | 'paid';
  status: 'active' | 'expired' | 'revoked';
  quota_total: number | null;
  quota_used: number;
  starts_at: string;
  expires_at: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const { isBn } = useLanguage();
  const { signOut } = useClerk();
  const { user: clerkUser, isLoaded: isClerkLoaded, isSignedIn } = useUser();
  const currentClerkUserId = useRef<string | null>(null);
  currentClerkUserId.current = clerkUser?.id ?? null;

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [liveModalAppId, setLiveModalAppId] = useState<string | null>(null);
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [checklistAppId, setChecklistAppId] = useState<string | null>(null);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [qrModalApp, setQrModalApp] = useState<ApplicationItem | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [editResumeAppId, setEditResumeAppId] = useState<string | null>(null);
  const [isEditResumeModalOpen, setIsEditResumeModalOpen] = useState(false);
  const [deleteConfirmAppId, setDeleteConfirmAppId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'default' | 'destructive' | 'success' | 'warning' | 'info';
    message: string;
    title?: string;
  } | null>(null);

  const showToast = (
    message: string,
    type: 'default' | 'destructive' | 'success' | 'warning' | 'info' = 'info',
    title?: string,
    durationMs = 6000
  ) => {
    setNotification({ type, message, title });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, durationMs);
  };

  const fetchDashboardData = async () => {
    const requestUserId = currentClerkUserId.current;
    if (!requestUserId) return;

    setIsRefreshing(true);
    try {
      // 1. Fetch current profile
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' });
      if (currentClerkUserId.current !== requestUserId) return;
      if (!authRes.ok) {
        if (isClerkLoaded && !isSignedIn) {
          router.push('/sign-in');
        }
        return;
      }
      const authData = await authRes.json();
      if (!authData.authenticated || !authData.user) {
        if (isClerkLoaded && !isSignedIn) {
          router.push('/sign-in');
        }
        return;
      }
      if (authData.user.accountStatus !== 'approved') {
        router.replace('/pending-approval');
        return;
      }
      setUser(authData.user);
      setSubscription(authData.subscription);

      // 2. Fetch user transactions
      const trxRes = await fetch('/api/transactions/my');
      if (trxRes.ok) {
        const trxData = await trxRes.json();
        if (currentClerkUserId.current !== requestUserId) return;
        setTransactions(trxData.transactions || []);
      }

      // 3. Fetch user applications
      const appsRes = await fetch('/api/applications');
      if (appsRes.ok) {
        const appsData = await appsRes.json();
        if (currentClerkUserId.current !== requestUserId) return;
        setApplications(appsData.applications || []);
      }
    } catch {
      // Error fetching dashboard
    } finally {
      if (currentClerkUserId.current === requestUserId) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    if (isClerkLoaded) {
      if (!isSignedIn) {
        router.push('/sign-in');
        return;
      }
      setLoading(true);
      setUser(null);
      setSubscription(null);
      setTransactions([]);
      setApplications([]);
      fetchDashboardData();
    }
  }, [isClerkLoaded, isSignedIn, clerkUser?.id]);

  // Live polling if any application is processing or queued
  useEffect(() => {
    const hasActiveQueueOrProcessing = applications.some(
      (app) => app.status === 'processing' || app.status === 'queued'
    );
    if (!hasActiveQueueOrProcessing) return;

    const interval = setInterval(async () => {
      try {
        const appsRes = await fetch('/api/applications');
        if (appsRes.ok) {
          const appsData = await appsRes.json();
          setApplications(appsData.applications || []);
        }
      } catch {
        // ignore
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [applications]);

  const handleRunApp = async (appId: string) => {
    setActionInProgress(appId);
    try {
      const res = await fetch(`/api/applications/${appId}/run`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        showToast(
          data.message || data.error || (isBn ? 'রান শুরু করা যায়নি।' : 'Failed to start runner.'),
          'destructive',
          isBn ? 'ত্রুটি' : 'Error'
        );
      } else {
        if (data.status === 'queued') {
          showToast(
            data.message ||
              (isBn
                ? `আবেদনটি কিউতে যোগ করা হয়েছে (অবস্থান: #${data.queuePosition || 1})`
                : `Application queued at #${data.queuePosition || 1}`),
            'info',
            isBn ? 'কিউতে সারিবদ্ধ' : 'Queued'
          );
        }
        setLiveModalAppId(appId);
        setIsLiveModalOpen(true);
      }
      await fetchDashboardData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error running application', 'destructive');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleResumeApp = async (appId: string) => {
    setActionInProgress(appId);
    setLiveModalAppId(appId);
    setIsLiveModalOpen(true);
    try {
      const res = await fetch(`/api/applications/${appId}/resume`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        showToast(
          data.message || data.error || (isBn ? 'রিজিউম শুরু করা যায়নি।' : 'Failed to resume runner.'),
          'destructive',
          isBn ? 'ত্রুটি' : 'Error'
        );
      } else {
        showToast(
          isBn
            ? 'ধাপ ২ থেকে স্বয়ংক্রিয় রিজিউম রান শুরু হয়েছে...'
            : 'Resume automation started from Step 2...',
          'success',
          isBn ? 'রিজিউম শুরু' : 'Resume Started'
        );
      }
      await fetchDashboardData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error resuming application', 'destructive');
    } finally {
      setActionInProgress(null);
    }
  };

  const confirmDeleteApp = async (appId: string) => {
    setActionInProgress(appId);
    try {
      const res = await fetch(`/api/applications/${appId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(
          isBn ? 'আবেদনটি সফলভাবে মুছে ফেলা হয়েছে।' : 'Application deleted successfully.',
          'success',
          isBn ? 'মুছে ফেলা সম্পন্ন' : 'Deleted'
        );
      }
      await fetchDashboardData();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to delete application', 'destructive');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeleteApp = (appId: string) => {
    setDeleteConfirmAppId(appId);
  };

  const handleSignOut = () => {
    signOut({ redirectUrl: '/' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFBFB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-black" />
          <p className="text-xs font-semibold text-[#666666]">
            {isBn ? 'ড্যাশবোর্ড লোড হচ্ছে...' : 'Loading Dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  const quotaRemaining = subscription?.quota_total !== null && subscription?.quota_total !== undefined
    ? Math.max(0, subscription.quota_total - subscription.quota_used)
    : 0;
  const isUnlimited = subscription?.quota_total === null;
  const quotaPercent = isUnlimited
    ? 100
    : subscription
    && subscription.quota_total !== null
    ? Math.min(100, Math.round((subscription.quota_used / subscription.quota_total) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-black py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Admin Shortcut Banner */}
        {user?.role === 'admin' && (
          <div className="bg-gradient-to-r from-zinc-900 to-black text-white p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md border border-zinc-800">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0 mt-0.5 sm:mt-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-white flex items-center gap-2 flex-wrap">
                  <span>{isBn ? 'অ্যাডমিনিস্ট্রেটর অ্যাকাউন্ট' : 'Administrator Privileges'}</span>
                  <Badge className="bg-emerald-500 text-black font-extrabold text-[10px] hover:bg-emerald-400">
                    ADMIN
                  </Badge>
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  {isBn
                    ? 'গ্রাহকদের জমা দেওয়া এমএফএস পেমেন্ট যাচাই ও অনুমোদন করুন।'
                    : 'Review and approve pending MFS transactions to activate user quotas.'}
                </div>
              </div>
            </div>
            <Button asChild size="sm" className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs shrink-0 w-full sm:w-auto">
              <Link href="/admin/transactions">
                <span>{isBn ? 'ট্রানজেকশন ম্যানেজমেন্টে যান' : 'Go to Admin Approval Panel'}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        )}

        {/* Top Profile Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-[#EAEAEA] shadow-2xs">
          <div className="flex items-center gap-3.5 sm:gap-4">
            {clerkUser?.imageUrl ? (
              <img
                src={clerkUser.imageUrl}
                alt={user?.name || 'User'}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border border-[#EAEAEA] object-cover shadow-sm shrink-0"
              />
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-black text-white flex items-center justify-center text-xl font-bold shadow-sm shrink-0">
                {user?.name?.[0] || 'U'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-extrabold text-black tracking-tight">{user?.name}</h1>
                <Badge variant="outline" className="text-[10px] font-mono capitalize">
                  {user?.role}
                </Badge>
              </div>
              <p className="text-xs text-[#666666] mt-0.5 break-all">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchDashboardData}
              disabled={isRefreshing}
              className="gap-1.5 text-xs font-semibold rounded-xl flex-1 sm:flex-initial"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isBn ? 'রিফ্রেশ' : 'Refresh'}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="gap-1.5 text-xs font-semibold rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 flex-1 sm:flex-initial"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isBn ? 'লগআউট' : 'Sign out'}</span>
            </Button>
          </div>
        </div>

        {/* Grid: Subscription Card & Quick CTA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Subscription Status Card (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#EAEAEA] p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-black">
                  {isBn ? 'বর্তমান সাবস্ক্রিপশন ও কোটা' : 'Active Subscription & Quota'}
                </h2>
              </div>
              {subscription ? (
                <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold uppercase text-[10px]">
                  {isBn ? 'সক্রিয় প্ল্যান' : 'Active Plan'}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200 text-[10px]">
                  {isBn ? 'কোনো প্ল্যান সক্রিয় নেই' : 'No Active Plan'}
                </Badge>
              )}
            </div>

            {subscription ? (
              <div className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-black uppercase tracking-tight text-black">
                      {subscription.plan === 'paid' && (isBn ? 'পেইড প্ল্যান' : 'Paid Plan')}
                      {subscription.plan === 'free' && (isBn ? '🎁 ফ্রি (প্রতিদিন ৩টি ওয়েব ফাইল)' : '🎁 Free (3 Web Files Per Day)')}
                    </span>
                    <div className="text-xs text-[#666666] mt-0.5">
                      {isBn ? 'মেয়াদ শেষ:' : 'Expires:'}{' '}
                      <span className="font-semibold text-black">
                        {subscription.expires_at ? new Date(subscription.expires_at).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        }) : (isBn ? 'মেয়াদ নেই' : 'No expiry')}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xl font-extrabold text-black font-mono">
                      {isUnlimited ? (
                        '∞'
                      ) : (
                        `${subscription.quota_used} / ${subscription.quota_total}`
                      )}
                    </span>
                    <div className="text-[11px] text-[#666666]">
                      {isUnlimited
                        ? (isBn ? 'সীমাহীন ফর্ম পূরণ' : 'Unlimited forms')
                        : (isBn ? `${quotaRemaining}টি ফর্ম বাকি` : `${quotaRemaining} remaining`)}
                    </div>
                  </div>
                </div>

                {/* Quota Progress Bar */}
                {!isUnlimited && (
                  <div className="space-y-1.5">
                    <div className="w-full bg-[#EEEEEE] rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${quotaPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-[#888888]">
                      <span>{isBn ? 'ব্যবহৃত ফর্ম' : 'Used'}</span>
                      <span>{isBn ? `মোট বরাদ্দ ${subscription.quota_total}টি` : `Total ${subscription.quota_total}`}</span>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between border-t border-[#EAEAEA]">
                  <span className="text-xs text-[#666666]">
                    {isBn ? 'আরো কোটা বা নতুন প্ল্যান নিতে চান?' : 'Need more quota or upgrade?'}
                  </span>
                  <Button asChild size="sm" variant="outline" className="rounded-xl text-xs font-bold">
                    <Link href="/checkout?plan=paid">
                      <span>{isBn ? 'প্ল্যান রিনিউ বা পরিবর্তন' : 'Renew or Upgrade'}</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-[#FAFAFA] rounded-xl p-5 border border-[#EAEAEA] text-center space-y-3">
                <p className="text-xs text-[#666666]">
                  {isBn
                    ? 'আপনার অ্যাকাউন্টে বর্তমানে কোনো সক্রিয় প্যাকেজ নেই। ফর্ম পূরণের জন্য একটি প্যাকেজ বেছে নিন।'
                    : 'You do not have an active subscription. Choose a plan to unlock automated visa filing.'}
                </p>
                <Button asChild className="rounded-full text-xs font-bold">
                  <Link href="/checkout?plan=paid">
                    <span>{isBn ? 'পেইড নিন (৫০০ ৳)' : 'Upgrade to Paid (500 ৳)'}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* New Application CTA Card (1 col) */}
          <div className="bg-gradient-to-br from-black to-zinc-900 text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                {isBn ? 'নতুন ওয়েব ফাইল তৈরি' : 'Create New Web File'}
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {isBn
                  ? '৯টি ধাপেই ১০০% স্বয়ংক্রিয় ফর্ম পূরণ, ছবি রিসাইজিং ও ইনস্ট্যান্ট ওয়েব ফাইল নম্বর জেনারেশন।'
                  : 'Zero timeout errors. 9-step automated Indian visa web file creation with PDF export.'}
              </p>
            </div>

            <Button
              asChild
              disabled={!subscription || (!isUnlimited && quotaRemaining === 0)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-xl h-11 text-xs"
            >
              <Link href={subscription && (isUnlimited || quotaRemaining > 0) ? '/apply' : '/checkout?plan=paid'}>
                <PlusCircle className="w-4 h-4 mr-1.5" />
                <span>{isBn ? 'ওয়েব ফাইল তৈরি শুরু করুন' : 'Create Web File Now'}</span>
              </Link>
            </Button>
          </div>

        </div>

        {/* Recent Visa Applications Table */}
        <ApplicationHistory
          applications={applications}
          isBn={isBn}
          actionInProgress={actionInProgress}
          onTrack={(applicationId) => {
            setLiveModalAppId(applicationId);
            setIsLiveModalOpen(true);
          }}
          onRun={handleRunApp}
          onEditResume={(applicationId) => {
            setEditResumeAppId(applicationId);
            setIsEditResumeModalOpen(true);
          }}
          onResume={handleResumeApp}
          onQrCode={(application) => {
            setQrModalApp(application);
            setIsQrModalOpen(true);
          }}
          onDelete={handleDeleteApp}
        />

        {/* MFS Transactions Table */}
        <PaymentHistory transactions={transactions} isBn={isBn} />

      </div>

      {liveModalAppId && (
        <LiveAutomationModal
          applicationId={liveModalAppId}
          isOpen={isLiveModalOpen}
          onClose={() => {
            setIsLiveModalOpen(false);
            fetchDashboardData();
          }}
          onViewDashboard={() => {
            setIsLiveModalOpen(false);
            fetchDashboardData();
          }}
        />
      )}

      {checklistAppId && (
        <IvacChecklistModal
          applicationId={checklistAppId}
          isOpen={isChecklistModalOpen}
          onClose={() => setIsChecklistModalOpen(false)}
        />
      )}

      {qrModalApp && (
        <ApplicationQrModal
          application={qrModalApp}
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
        />
      )}

      {editResumeAppId && (
        <EditAndResumeModal
          applicationId={editResumeAppId}
          isOpen={isEditResumeModalOpen}
          onClose={() => setIsEditResumeModalOpen(false)}
          onResumeStarted={(appId) => {
            setLiveModalAppId(appId);
            setIsLiveModalOpen(true);
          }}
          onSaved={() => fetchDashboardData()}
          showToast={showToast}
        />
      )}



      {/* Floating shadcn Alert Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 duration-200">
          <Alert variant={notification.type} className="shadow-xl border bg-white relative pr-9">
            {notification.type === 'destructive' && <AlertCircle className="w-4 h-4 text-rose-600" />}
            {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            {notification.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-600" />}
            {notification.type === 'info' && <Globe className="w-4 h-4 text-blue-600" />}
            <div>
              {notification.title && <AlertTitle>{notification.title}</AlertTitle>}
              <AlertDescription>{notification.message}</AlertDescription>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="absolute top-3 right-3 text-zinc-400 hover:text-black transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </Alert>
        </div>
      )}

      {/* Custom Deletion Confirmation Dialog (No browser confirm) */}
      {deleteConfirmAppId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-black">
                  {isBn ? 'আবেদনটি মুছে ফেলতে চান?' : 'Delete Application?'}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {isBn ? 'এই আবেদনটির রেকর্ড চিরতরে মুছে ফেলা হবে।' : 'This action cannot be undone.'}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmAppId(null)}
                className="text-xs rounded-xl"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const id = deleteConfirmAppId;
                  setDeleteConfirmAppId(null);
                  if (id) confirmDeleteApp(id);
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs rounded-xl font-bold"
              >
                {isBn ? 'হ্যাঁ, মুছে ফেলুন' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
