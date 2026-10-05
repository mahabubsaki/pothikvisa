import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/currentAuth';
import { apiErrorResponse } from '@/lib/api-error';
import {
  deleteSavedProfile,
  getMaxProfilesForPlan,
  getUserSavedProfiles,
  saveOrUpdateProfile,
} from '@/lib/db';

export async function GET() {
  try {
    const user = await requirePermission('profiles.read');
    const plan = user.subscription?.plan || 'free';
    return NextResponse.json({
      profiles: getUserSavedProfiles(user.id),
      maxAllowed: getMaxProfilesForPlan(plan, user.isAdmin),
      plan,
    });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'Failed to fetch profiles');
  }
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission('profiles.write');
    const body = await request.json();
    const id = typeof body.id === 'string' ? body.id : undefined;
    const profileName = typeof body.profileName === 'string' ? body.profileName.trim() : '';
    const passportNumber = typeof body.passportNumber === 'string' ? body.passportNumber.trim().toUpperCase() : '';
    const data = body.data;
    if (!profileName || !passportNumber || !data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Profile name, passport number, and profile data are required.' }, { status: 400 });
    }

    const profiles = getUserSavedProfiles(user.id);
    const isExisting = Boolean(
      (id && profiles.some((profile) => profile.id === id)) ||
      profiles.some((profile) => profile.passport_number.toUpperCase() === passportNumber)
    );
    const plan = user.subscription?.plan || 'free';
    const maxAllowed = getMaxProfilesForPlan(plan, user.isAdmin);
    if (!isExisting && profiles.length >= maxAllowed) {
      return NextResponse.json({
        error: 'PROFILE_LIMIT_REACHED',
        message: `Your ${plan} tier allows ${maxAllowed} saved profile${maxAllowed === 1 ? '' : 's'}.`,
        maxAllowed,
        currentCount: profiles.length,
      }, { status: 403 });
    }

    const profile = saveOrUpdateProfile({
      id,
      userId: user.id,
      profileName,
      passportNumber,
      data,
    });
    return NextResponse.json({ success: true, profile });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'Failed to save profile');
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requirePermission('profiles.write');
    const { searchParams } = new URL(request.url);
    let profileId = searchParams.get('id');
    if (!profileId) {
      const body = await request.json().catch(() => null) as { id?: string } | null;
      profileId = body?.id || null;
    }
    if (!profileId) {
      return NextResponse.json({ error: 'Profile ID is required.' }, { status: 400 });
    }
    if (!deleteSavedProfile(profileId, user.id)) {
      return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return apiErrorResponse(error, 'Failed to delete profile');
  }
}
