export const QUEUE_NAMES = {
  AI_TASK: 'ai-task-queue',
} as const;

export const JOB_NAMES = {
  PROCESS_AI_TASK: 'process-ai-task',
} as const;

export const TASK_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;
