import { Badge } from '@/components/ui/Badge';
import type { AITaskStatus } from '@/types/ai-task.types';

const statusConfig: Record<AITaskStatus, { variant: 'default' | 'warning' | 'info' | 'success' | 'danger'; label: string }> = {
  pending: { variant: 'warning', label: 'Pending' },
  processing: { variant: 'info', label: 'Processing' },
  completed: { variant: 'success', label: 'Completed' },
  failed: { variant: 'danger', label: 'Failed' },
};

export function TaskStatusBadge({ status }: { status: AITaskStatus }) {
  const config = statusConfig[status] || { variant: 'default', label: status };
  return <Badge variant={config.variant} dot>{config.label}</Badge>;
}

export function BlogStatusBadge({ status }: { status: string }) {
  const config = {
    published: { variant: 'success' as const, label: 'Published' },
    draft: { variant: 'warning' as const, label: 'Draft' },
    archived: { variant: 'default' as const, label: 'Archived' },
  }[status] || { variant: 'default' as const, label: status };

  return <Badge variant={config.variant} dot>{config.label}</Badge>;
}
