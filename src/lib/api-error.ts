import { NextResponse } from 'next/server';

const ERROR_RESPONSES: Record<string, { status: number; message: string }> = {
  UNAUTHORIZED: { status: 401, message: 'Sign in is required.' },
  ACCOUNT_PENDING: { status: 403, message: 'Your account is waiting for administrator approval.' },
  ACCOUNT_SUSPENDED: { status: 403, message: 'Your account has been suspended.' },
  FORBIDDEN: { status: 403, message: 'You do not have access to this resource.' },
  NOT_FOUND: { status: 404, message: 'The requested resource was not found.' },
};

export function apiErrorResponse(error: unknown, fallbackMessage = 'Request failed') {
  const code = error instanceof Error ? error.message : 'INTERNAL_ERROR';
  const known = ERROR_RESPONSES[code];
  if (known) {
    return NextResponse.json({ error: code, message: known.message }, { status: known.status });
  }

  console.error(fallbackMessage, error);
  return NextResponse.json(
    { error: 'INTERNAL_ERROR', message: fallbackMessage },
    { status: 500 }
  );
}
