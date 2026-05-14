'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/layout/AdminSidebar';
import { AdminTopbar } from '@/components/admin/layout/AdminTopbar';

export function AdminClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  const isLoginPage = pathname === '/admin/login';
  if (isLoginPage) return <>{children}</>;

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar isCollapsed={sidebarCollapsed} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminTopbar onMenuToggle={() => setSidebarCollapsed((v) => !v)} />
        <main className="flex-1 overflow-y-auto bg-slate-900/50">
          {children}
        </main>
      </div>
    </div>
  );
}
