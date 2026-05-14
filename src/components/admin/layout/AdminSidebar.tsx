'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Tag,
  Bot,
  Image,
  Settings,
  Zap,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { signOut } from 'next-auth/react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Blogs',     href: '/admin/blogs',     icon: <FileText className="w-4 h-4" /> },
  // { label: 'Categories', href: '/admin/categories', icon: <FolderOpen className="w-4 h-4" /> },  // hidden for now
  // { label: 'Tags',       href: '/admin/tags',       icon: <Tag className="w-4 h-4" /> },          // hidden for now
  { label: 'AI Tasks',  href: '/admin/ai-tasks',  icon: <Bot className="w-4 h-4" /> },
  { label: 'Media',     href: '/admin/media',     icon: <Image className="w-4 h-4" /> },
  { label: 'Settings',  href: '/admin/settings',  icon: <Settings className="w-4 h-4" /> },
];

interface AdminSidebarProps {
  isCollapsed?: boolean;
}

export function AdminSidebar({ isCollapsed = false }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={clsx(
        'h-screen bg-slate-950 flex flex-col border-r border-slate-800/50 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-800/50">
        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        {!isCollapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">AI Blog</p>
            <p className="text-xs text-slate-400 truncate">Platform</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex items-center gap-3 px-3 h-9 rounded-lg text-sm font-medium transition-all duration-150 group',
              isActive(item.href)
                ? 'bg-violet-600/20 text-violet-400 border border-violet-500/20'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
            )}
          >
            <span className={clsx('flex-shrink-0', isActive(item.href) ? 'text-violet-400' : '')}>
              {item.icon}
            </span>
            {!isCollapsed && (
              <>
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <span className="text-xs bg-violet-600 text-white px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
                {isActive(item.href) && (
                  <ChevronRight className="w-3 h-3 text-violet-400" />
                )}
              </>
            )}
          </Link>
        ))}
      </nav>

      {/* Sign Out */}
      <div className="p-3 border-t border-slate-800/50">
        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className={clsx(
            'flex items-center gap-3 px-3 h-9 w-full rounded-lg text-sm font-medium transition-all duration-150',
            'text-slate-500 hover:text-red-400 hover:bg-red-500/10'
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
