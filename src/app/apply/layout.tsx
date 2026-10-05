import { ApprovedLayout } from '@/components/auth/ApprovedLayout';

export default function ApplyLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <ApprovedLayout>{children}</ApprovedLayout>;
}
