import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/currentAuth';

export async function ApprovedLayout({
  children,
  adminOnly = false,
}: Readonly<{
  children: React.ReactNode;
  adminOnly?: boolean;
}>) {
  const user = await getAuthenticatedUser({ allowUnapproved: true });
  if (!user) redirect('/sign-in');
  if (user.accountStatus !== 'approved') redirect('/pending-approval');
  if (adminOnly && !user.isAdmin) redirect('/dashboard');
  return children;
}
