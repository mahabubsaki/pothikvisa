import { ApprovedLayout } from '@/components/auth/ApprovedLayout';

export default function ApplicationsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <ApprovedLayout>{children}</ApprovedLayout>;
}
