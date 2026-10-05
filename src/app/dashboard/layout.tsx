import { ApprovedLayout } from '@/components/auth/ApprovedLayout';

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <ApprovedLayout>{children}</ApprovedLayout>;
}
