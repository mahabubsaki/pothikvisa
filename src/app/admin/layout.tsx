import { ApprovedLayout } from '@/components/auth/ApprovedLayout';

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <ApprovedLayout adminOnly>{children}</ApprovedLayout>;
}
