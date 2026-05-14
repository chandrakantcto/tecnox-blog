import type { Metadata } from 'next';
import { Header } from '@/components/website/layout/Header';
import { Footer } from '@/components/website/layout/Footer';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    template: '%s | AI Blog Platform',
    default: 'AI Blog Platform — Smart Content at Scale',
  },
  description: 'Discover AI-powered blog content on technology, products, guides, and more.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'AI Blog Platform',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
