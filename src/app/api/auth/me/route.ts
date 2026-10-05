import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/currentAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET() {
  try {
    const profile = await getAuthenticatedUser();
    return NextResponse.json(
      {
        authenticated: !!profile,
        isAdmin: profile?.isAdmin ?? false,
        user: profile
          ? {
              id: profile.id,
              name: profile.name,
              email: profile.email,
              role: profile.role,
              isAdmin: profile.isAdmin,
              authProvider: profile.authProvider,
            }
          : null,
        subscription: profile?.subscription || null,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch {
    return NextResponse.json(
      { authenticated: false, user: null, subscription: null },
      { status: 401, headers: NO_CACHE_HEADERS }
    );
  }
}
