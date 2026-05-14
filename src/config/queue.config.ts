import type { JobsOptions } from 'bullmq';

export const AI_TASK_QUEUE_NAME = 'ai-task-queue';
export const AI_TASK_JOB_NAME = 'process-ai-task';

export const defaultJobOptions: JobsOptions = {
  attempts: Number(process.env.QUEUE_MAX_ATTEMPTS) || 3,
  backoff: {
    type: 'exponential',
    delay: 5000,
  },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
};

export const workerOptions = {
  concurrency: Number(process.env.QUEUE_CONCURRENCY) || 5,
};
