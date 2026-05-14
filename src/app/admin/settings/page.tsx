'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Settings, Shield, Database, Zap } from 'lucide-react';

export default function SettingsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [healthData, setHealthData] = useState<Record<string, unknown> | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const user = session?.user as { name?: string; email?: string; role?: string } | undefined;

  const checkHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealthData(data);
      toast.success('Health check completed');
    } catch {
      toast.error('Health check failed');
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const sections = [
    {
      icon: <Shield className="w-4 h-4 text-violet-400" />,
      title: 'Account Information',
      content: (
        <div className="space-y-4">
          <Input label="Name" defaultValue={user?.name || ''} disabled />
          <Input label="Email" defaultValue={user?.email || ''} disabled />
          <Input label="Role" defaultValue={user?.role?.replace('_', ' ') || ''} disabled />
        </div>
      ),
    },
    {
      icon: <Database className="w-4 h-4 text-emerald-400" />,
      title: 'System Health',
      content: (
        <div className="space-y-4">
          <Button onClick={checkHealth} loading={isCheckingHealth} variant="outline">
            Run Health Check
          </Button>
          {healthData && (
            <pre className="text-xs text-slate-400 font-mono bg-slate-950 rounded-lg p-4 overflow-auto">
              {JSON.stringify(healthData, null, 2)}
            </pre>
          )}
        </div>
      ),
    },
    {
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      title: 'AI Automation',
      content: (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
            <div>
              <p className="text-sm font-medium text-white">Dify Integration</p>
              <p className="text-xs text-slate-400">AI workflow automation</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400">Configured</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
            <div>
              <p className="text-sm font-medium text-white">Queue System</p>
              <p className="text-xs text-slate-400">BullMQ + Redis</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs text-amber-400">Ready</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-5 h-5 text-slate-400" />
        <div>
          <h1 className="text-xl font-bold text-white">Settings</h1>
          <p className="text-sm text-slate-400">Platform configuration and account settings</p>
        </div>
      </div>

      {sections.map((section) => (
        <div key={section.title} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
            {section.icon}
            {section.title}
          </h2>
          {section.content}
        </div>
      ))}

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">About</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Platform</span>
            <span className="text-slate-300">AI Blog Automation Platform</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Version</span>
            <span className="text-slate-300 font-mono">2.0.0</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Framework</span>
            <span className="text-slate-300">Next.js 16 + React 19</span>
          </div>
        </div>
      </div>
    </div>
  );
}
