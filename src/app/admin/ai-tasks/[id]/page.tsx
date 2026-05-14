'use client';

import { use } from 'react';
import { useAITask, useRetryAITask } from '@/hooks/useAITasks';
import { TaskStatusBadge } from '@/components/admin/blog/TaskStatusBadge';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/utils/date';
import { ArrowLeft, RotateCcw, ExternalLink, Clock, Bot } from 'lucide-react';
import Link from 'next/link';

export default function AITaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, error } = useAITask(id);
  const retryTask = useRetryAITask();
  const { toast } = useToast();

  const handleRetry = async () => {
    try {
      await retryTask.mutateAsync(id);
      toast.success('Task requeued for retry');
    } catch {
      toast.error('Failed to retry task');
    }
  };

  if (isLoading) return <LoadingScreen text="Loading task..." />;
  if (error || !data?.data) return (
    <div className="p-6 text-red-400">Task not found or failed to load.</div>
  );

  const task = data.data;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/ai-tasks">
            <button className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">AI Task Detail</h1>
            <p className="text-sm text-slate-400 font-mono">{task._id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <TaskStatusBadge status={task.status} />
          {task.status === 'failed' && (
            <Button
              leftIcon={<RotateCcw className="w-4 h-4" />}
              onClick={handleRetry}
              loading={retryTask.isPending}
              size="sm"
            >
              Retry
            </Button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Task Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Bot className="w-4 h-4 text-violet-400" /> Task Information
          </h2>
          <div className="space-y-3">
            <InfoRow label="Content Type" value={task.contentType} />
            <InfoRow label="Product/Name" value={task.productName || '—'} />
            <InfoRow label="Target URL" value={task.targetUrl || '—'} isUrl />
            <InfoRow label="Workflow Run ID" value={task.workflowRunId || 'Not started'} mono />
            <InfoRow label="Attempts" value={`${task.attempts} / ${task.maxAttempts}`} />
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-violet-400" /> Timeline
          </h2>
          <div className="space-y-3">
            <InfoRow label="Created" value={task.createdAt ? formatDate(task.createdAt) : '—'} />
            <InfoRow label="Started" value={task.startedAt ? formatDate(task.startedAt) : '—'} />
            <InfoRow label="Completed" value={task.completedAt ? formatDate(task.completedAt) : '—'} />
          </div>
          {task.blogId && (
            <div className="pt-3 border-t border-slate-800">
              <p className="text-xs text-slate-500 mb-2">Generated Blog</p>
              <Link href={`/blog/${task.blogId.slug || ''}`} target="_blank"
                className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300"
              >
                <ExternalLink className="w-4 h-4" />
                {task.blogId.title || 'View Blog'}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Keywords */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-3">Keywords</h2>
        <div className="flex flex-wrap gap-2">
          {task.keywords?.map((kw: string) => (
            <span key={kw} className="px-3 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm rounded-full">
              {kw}
            </span>
          ))}
        </div>
      </div>

      {/* Error */}
      {task.errorMessage && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-red-400 mb-3">Error Details</h2>
          <p className="text-sm text-red-300">{task.errorMessage}</p>
          {task.errorStack && (
            <pre className="mt-3 text-xs text-red-400/70 overflow-auto max-h-40 font-mono">
              {task.errorStack}
            </pre>
          )}
        </div>
      )}

      {/* Webhook Payload */}
      {task.webhookPayload && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-3">Webhook Payload</h2>
          <pre className="text-xs text-slate-400 overflow-auto max-h-64 font-mono bg-slate-950 p-4 rounded-lg">
            {JSON.stringify(task.webhookPayload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, mono, isUrl }: { label: string; value: string; mono?: boolean; isUrl?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-slate-500 flex-shrink-0 mt-0.5">{label}</span>
      {isUrl && value !== '—' ? (
        <a href={value} target="_blank" rel="noreferrer" className="text-sm text-violet-400 hover:text-violet-300 truncate max-w-xs">
          {value}
        </a>
      ) : (
        <span className={`text-sm text-slate-200 break-all text-right ${mono ? 'font-mono text-xs' : ''}`}>
          {value}
        </span>
      )}
    </div>
  );
}
