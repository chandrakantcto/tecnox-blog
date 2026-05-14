import Link from 'next/link';
import { Zap, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-white">AI Blog Platform</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              AI-powered blog automation platform delivering high-quality content at scale with SEO optimization built in.
            </p>
            <div className="flex items-center gap-3 mt-4">
              {(['X', 'LinkedIn', 'GitHub'] as const).map((name) => (
                <a key={name} href="#" className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors" aria-label={name}>
                  <ExternalLink className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Content</h3>
            <ul className="space-y-2.5">
              {[
                { label: 'All Blogs', href: '/blog' },
                { label: 'Search', href: '/search' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Platform</h3>
            <ul className="space-y-2.5">
              {[
                { label: 'Admin Panel', href: '/admin' },
                { label: 'API Health', href: '/api/health' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} AI Blog Platform. All rights reserved.
          </p>
          <p className="text-xs text-slate-600">Powered by AI • Next.js 16 • MongoDB</p>
        </div>
      </div>
    </footer>
  );
}
