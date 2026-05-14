'use client';

import { useAnalytics } from '@/hooks/useAnalytics';
import { StatsCard } from '@/components/admin/dashboard/StatsCard';
import { RecentActivity } from '@/components/admin/dashboard/RecentActivity';
import { LoadingScreen } from '@/components/ui/Spinner';
import {
  FileText, Bot, Eye, Heart, CheckCircle, XCircle, Clock, TrendingUp,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import Link from 'next/link';

const CHART_COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export default function DashboardPage() {
  const { data, isLoading, error } = useAnalytics();

  if (isLoading) return <LoadingScreen text="Loading analytics..." />;
  if (error) return (
    <div className="p-8 text-center text-red-400">Failed to load analytics. Please refresh.</div>
  );

  const { totals, charts, recentActivity } = data || {};

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5">Welcome back! Here&apos;s your platform overview.</p>
        </div>
        <Link
          href="/admin/ai-tasks/new"
          className="flex items-center gap-2 h-9 px-4 text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
        >
          <Bot className="w-4 h-4" />
          New AI Task
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Blogs"
          value={totals?.blogs || 0}
          icon={<FileText className="w-5 h-5" />}
          color="violet"
          description={`${totals?.publishedBlogs || 0} published`}
        />
        <StatsCard
          title="Published"
          value={totals?.publishedBlogs || 0}
          icon={<CheckCircle className="w-5 h-5" />}
          color="emerald"
          description={`${totals?.draftBlogs || 0} drafts`}
        />
        <StatsCard
          title="Total Views"
          value={totals?.totalViews || 0}
          icon={<Eye className="w-5 h-5" />}
          color="blue"
        />
        <StatsCard
          title="Total Likes"
          value={totals?.totalLikes || 0}
          icon={<Heart className="w-5 h-5" />}
          color="amber"
        />
        <StatsCard
          title="AI Tasks"
          value={totals?.aiTasks || 0}
          icon={<Bot className="w-5 h-5" />}
          color="violet"
          description={`${totals?.completedTasks || 0} completed`}
        />
        <StatsCard
          title="Completed Tasks"
          value={totals?.completedTasks || 0}
          icon={<CheckCircle className="w-5 h-5" />}
          color="emerald"
        />
        <StatsCard
          title="Pending Tasks"
          value={totals?.pendingTasks || 0}
          icon={<Clock className="w-5 h-5" />}
          color="amber"
        />
        <StatsCard
          title="Failed Tasks"
          value={totals?.failedTasks || 0}
          icon={<XCircle className="w-5 h-5" />}
          color="red"
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Publications Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-white">Blog Publications (Last 30 Days)</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={charts?.blogPublicationsLast30Days || []}>
              <defs>
                <linearGradient id="colorPubs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} width={25} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
                labelStyle={{ color: '#94a3b8' }}
                itemStyle={{ color: '#a78bfa' }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#8b5cf6"
                fill="url(#colorPubs)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Task Status Donut */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-white">AI Task Status</h2>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={charts?.taskStatusBreakdown || []}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                dataKey="count"
                nameKey="status"
              >
                {(charts?.taskStatusBreakdown || []).map((_: unknown, index: number) => (
                  <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
              />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
                itemStyle={{ color: '#a78bfa' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Blogs */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Top Performing Blogs</h2>
          <div className="space-y-3">
            {(charts?.topBlogsByViews || []).slice(0, 6).map((blog: {
              title: string; slug: string; views: number; likes: number
            }, idx: number) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-600 w-4">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/blog/${blog.slug}`}
                    target="_blank"
                    className="text-sm text-slate-300 hover:text-white truncate block"
                  >
                    {blog.title}
                  </Link>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 flex-shrink-0">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {blog.views?.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
            {!(charts?.topBlogsByViews?.length) && (
              <p className="text-sm text-slate-500 text-center py-4">No blog data yet</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Recent Activity</h2>
          <RecentActivity activities={recentActivity || []} />
        </div>
      </div>
    </div>
  );
}
