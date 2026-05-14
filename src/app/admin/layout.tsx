import type { Metadata } from 'next';
import { AdminClientLayout } from './AdminClientLayout';

export const metadata: Metadata = {
  title: {
    template: '%s | AI Blog Admin',
    default: 'AI Blog Admin',
  },
  description: 'AI Blog Platform Administration',
  robots: 'noindex, nofollow',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminClientLayout>{children}</AdminClientLayout>;
}
