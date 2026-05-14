import { clsx } from 'clsx';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: { value: number; label: string };
  color?: 'violet' | 'emerald' | 'blue' | 'amber' | 'red';
  description?: string;
}

const colorClasses = {
  violet: 'from-violet-500 to-purple-600 shadow-violet-500/25',
  emerald: 'from-emerald-500 to-teal-600 shadow-emerald-500/25',
  blue: 'from-blue-500 to-indigo-600 shadow-blue-500/25',
  amber: 'from-amber-500 to-orange-600 shadow-amber-500/25',
  red: 'from-red-500 to-rose-600 shadow-red-500/25',
};

export function StatsCard({ title, value, icon, change, color = 'violet', description }: StatsCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
        <div className={clsx(
          'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg flex-shrink-0',
          colorClasses[color]
        )}>
          <span className="text-white">{icon}</span>
        </div>
      </div>

      {change && (
        <div className="flex items-center gap-1.5">
          <span className={clsx(
            'text-xs font-medium',
            change.value >= 0 ? 'text-emerald-400' : 'text-red-400'
          )}>
            {change.value >= 0 ? '+' : ''}{change.value}%
          </span>
          <span className="text-xs text-slate-500">{change.label}</span>
        </div>
      )}
    </div>
  );
}
