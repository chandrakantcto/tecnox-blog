'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAITasks, useRetryAITask, useDeleteAITask, useRunAllPendingTasks } from '@/hooks/useAITasks';
import { TaskStatusBadge } from '@/components/admin/blog/TaskStatusBadge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmModal } from '@/components/ui/Modal';
import { LoadingScreen } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/utils/date';
import {
  Plus, RefreshCw, Trash2, Eye, Bot, Play, RotateCcw,
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
];

export default function AITasksPage() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useAITasks({
    page,
    limit: 15,
    status: status || undefined,
  });

  const retryTask = useRetryAITask();
  const deleteTask = useDeleteAITask();
  const runAllPending = useRunAllPendingTasks();

  const tasks = data?.data || [];
  const pagination = data?.pagination;

  const handleRetry = async (id: string) => {
    try {
      await retryTask.mutateAsync(id);
      toast.success('Task requeued for retry');
      void refetch();
    } catch {
      toast.error('Failed to retry task');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTask.mutateAsync(deleteId);
      toast.success('Task deleted');
      setDeleteId(null);
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleRunAll = async () => {
    try {
      const result = await runAllPending.mutateAsync();
      toast.success(result?.data?.message || 'Tasks queued');
      void refetch();
    } catch {
      toast.error('Failed to run tasks');
    }
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">AI Tasks</h1>
          <p className="text-sm text-slate-400">Manage AI content generation tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            leftIcon={<Play className="w-4 h-4" />}
            onClick={handleRunAll}
            loading={runAllPending.isPending}
            size="sm"
          >
            Run All Pending
          </Button>
          <Button
            variant="outline"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={() => void refetch()}
            size="sm"
          >
            Refresh
          </Button>
          <Link href="/admin/ai-tasks/new">
            <Button leftIcon={<Plus className="w-4 h-4" />}>New Task</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          containerClassName="w-44"
        />
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <LoadingScreen text="Loading AI tasks..." />
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Bot className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium">No AI tasks found</p>
            <Link href="/admin/ai-tasks/new">
              <Button leftIcon={<Plus className="w-4 h-4" />} className="mt-4">
                Create First Task
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Type', 'Keywords', 'Product/URL', 'Status', 'Attempts', 'Created', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {tasks.map((task: {
                  _id: string;
                  contentType: string;
                  keywords: string[];
                  productName?: string;
                  targetUrl?: string;
                  status: 'pending' | 'processing' | 'completed' | 'failed';
                  attempts: number;
                  blogId?: { title: string; slug: string };
                  createdAt: string;
                }) => (
                  <tr key={task._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-slate-200">{task.contentType}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {task.keywords.slice(0, 3).map((kw) => (
                          <span key={kw} className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                            {kw}
                          </span>
                        ))}
                        {task.keywords.length > 3 && (
                          <span className="text-xs text-slate-500">+{task.keywords.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-400 truncate max-w-[120px] block">
                        {task.productName || task.targetUrl || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <TaskStatusBadge status={task.status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm text-slate-400">{task.attempts}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-500">{formatDate(task.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link href={`/admin/ai-tasks/${task._id}`}>
                          <button className="p-1.5 rounded-lg text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>
                        {task.status === 'failed' && (
                          <button
                            onClick={() => handleRetry(task._id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteId(task._id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-800">
            <Pagination pagination={pagination} onPageChange={setPage} />
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete AI Task"
        description="This task will be permanently deleted."
        confirmLabel="Delete"
        loading={deleteTask.isPending}
      />
    </div>
  );
}
