import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/currentAuth';
import {
  getUserSavedProfiles,
  saveOrUpdateProfile,
  deleteSavedProfile,
  getMaxProfilesForPlan,
} from '@/lib/db';

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const profiles = getUserSavedProfiles(user.id);
    const plan = user.subscription?.plan || 'starter';
    const maxAllowed = getMaxProfilesForPlan(plan, user.isAdmin);

    return NextResponse.json({ profiles, maxAllowed, plan });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch profiles';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await req.json();
    const { id, profileName, passportNumber, data } = body;

    if (!profileName || !passportNumber || !data) {
      return NextResponse.json(
        { error: 'INVALID_DATA', message: 'Profile name, passport number, and data are required.' },
        { status: 400 }
      );
    }

    // Check plan limits when creating a brand-new profile
    const existingProfiles = getUserSavedProfiles(user.id);
    const cleanPassport = (passportNumber || '').trim().toUpperCase();
    const isExisting = Boolean(
      (id && existingProfiles.some((p) => p.id === id)) ||
      (cleanPassport && existingProfiles.some((p) => p.passport_number.toUpperCase() === cleanPassport))
    );

    if (!isExisting && !user.isAdmin) {
      const plan = user.subscription?.plan || 'starter';
      const maxAllowed = getMaxProfilesForPlan(plan, user.isAdmin);

      if (existingProfiles.length >= maxAllowed) {
        const planNameBn =
          plan === 'agency'
            ? 'এজেন্সি প্রো (Agency Pro)'
            : plan === 'standard'
              ? 'স্ট্যান্ডার্ড (Standard)'
              : plan === 'starter'
                ? 'স্টার্টার (Starter)'
                : 'ফ্রি ট্রায়াল (Free Trial)';
        const upgradeSuggestion =
          plan === 'free'
            ? 'পরিবার বা ক্লায়েন্টের একাধিক প্রোফাইল সেভ করতে স্টার্টার প্ল্যানে (১৫০ ৳) আপগ্রেড করুন অথবা পূর্বে সংরক্ষিত প্রোফাইলটি মুছে ফেলুন।'
            : 'আরও প্রোফাইল সংরক্ষণ করতে প্ল্যান আপগ্রেড করুন অথবা পূর্বে সংরক্ষিত অপ্রয়োজনীয় প্রোফাইল মুছে ফেলুন।';

        return NextResponse.json(
          {
            error: 'PROFILE_LIMIT_REACHED',
            message: `আপনার ${planNameBn} অ্যাকাউন্টে সর্বোচ্চ ${maxAllowed}টি প্রোফাইল সংরক্ষণের সীমা পূর্ণ হয়েছে (${existingProfiles.length}/${maxAllowed})। ${upgradeSuggestion}`,
            maxAllowed,
            currentCount: existingProfiles.length,
          },
          { status: 403 }
        );
      }
    }

    const saved = saveOrUpdateProfile({
      id,
      userId: user.id,
      profileName,
      passportNumber,
      data,
    });

    return NextResponse.json({ success: true, profile: saved });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save profile';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    let profileId: string | null = null;
    const { searchParams } = new URL(req.url);
    profileId = searchParams.get('id');

    if (!profileId) {
      try {
        const body = await req.json();
        profileId = body?.id || null;
      } catch {
        // No json body provided
      }
    }

    if (!profileId) {
      return NextResponse.json(
        { error: 'INVALID_DATA', message: 'Profile ID is required to delete.' },
        { status: 400 }
      );
    }

    const success = deleteSavedProfile(profileId, user.id);
    if (!success) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Profile not found or already deleted.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile deleted successfully.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete profile';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
