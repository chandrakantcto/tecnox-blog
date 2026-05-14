import { formatRelativeDate } from '@/utils/date';
import { CheckCircle, XCircle, FileText } from 'lucide-react';
import Link from 'next/link';

interface ActivityItem {
  type: 'blog_published' | 'task_completed' | 'task_failed';
  title: string;
  timestamp: Date | string;
  link?: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

const icons = {
  blog_published: <FileText className="w-4 h-4 text-blue-400" />,
  task_completed: <CheckCircle className="w-4 h-4 text-emerald-400" />,
  task_failed: <XCircle className="w-4 h-4 text-red-400" />,
};

const bgColors = {
  blog_published: 'bg-blue-500/10',
  task_completed: 'bg-emerald-500/10',
  task_failed: 'bg-red-500/10',
};

export function RecentActivity({ activities }: RecentActivityProps) {
  if (!activities?.length) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">
        No recent activity
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.slice(0, 8).map((activity, idx) => (
        <div key={idx} className="flex items-start gap-3">
          <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${bgColors[activity.type]}`}>
            {icons[activity.type]}
          </div>
          <div className="flex-1 min-w-0">
            {activity.link ? (
              <Link href={activity.link} className="text-sm text-slate-300 hover:text-white truncate block">
                {activity.title}
              </Link>
            ) : (
              <p className="text-sm text-slate-300 truncate">{activity.title}</p>
            )}
            <p className="text-xs text-slate-500 mt-0.5">
              {formatRelativeDate(activity.timestamp)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
