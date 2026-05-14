'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Bell, Search, ExternalLink, Menu } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface AdminTopbarProps {
  onMenuToggle?: () => void;
}

export function AdminTopbar({ onMenuToggle }: AdminTopbarProps) {
  const { data: session } = useSession();
  const user = session?.user as { name?: string; email?: string; role?: string; image?: string } | undefined;

  const roleVariant = user?.role === 'super_admin' ? 'purple' :
    user?.role === 'admin' ? 'primary' : 'default';

  return (
    <header className="h-16 bg-slate-950 border-b border-slate-800/50 flex items-center justify-between px-4 gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="search"
            placeholder="Search..."
            className="pl-9 pr-4 h-9 w-64 text-sm bg-slate-900 border border-slate-700/50 rounded-lg text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">View Site</span>
        </Link>

        <button className="relative p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-violet-500 rounded-full" />
        </button>

        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-white leading-none">{user?.name || 'Admin'}</p>
            <Badge variant={roleVariant as 'default' | 'primary' | 'purple'} size="sm" className="mt-0.5">
              {user?.role?.replace('_', ' ') || 'admin'}
            </Badge>
          </div>
        </div>
      </div>
    </header>
  );
}
