/**
 * Queue adapter — conditionally initialises BullMQ/Redis.
 *
 * Controlled by env flags:
 *   ENABLE_QUEUE=true   → enable BullMQ job dispatch
 *   ENABLE_REDIS=true   → enable ioredis connection (required for BullMQ)
 *
 * When either flag is false, enqueueAITask() is a no-op and callers must
 * fall back to direct execution via task-runner.ts.
 */

import { env } from '@/config/env';
import type { IAITask } from '@/types/ai-task.types';

// ── Conditional BullMQ imports ────────────────────────────────────────────────

type BullQueue = import('bullmq').Queue;

declare global {
  // eslint-disable-next-line no-var
  var aiTaskQueue: BullQueue | undefined;
}

export function isQueueEnabled(): boolean {
  return env.ENABLE_QUEUE && env.ENABLE_REDIS;
}

export function getAITaskQueue(): BullQueue | null {
  if (!isQueueEnabled()) return null;

  if (global.aiTaskQueue) return global.aiTaskQueue;

  // Dynamic require so BullMQ/ioredis modules are never evaluated when
  // the queue is disabled (avoids noisy connection errors).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Queue } = require('bullmq') as typeof import('bullmq');
  const { getRedisClient } = require('./redis') as typeof import('./redis');
  const { QUEUE_NAMES } = require('@/constants/queue.constants') as typeof import('@/constants/queue.constants');
  const { defaultJobOptions } = require('@/config/queue.config') as typeof import('@/config/queue.config');

  const queue = new Queue(QUEUE_NAMES.AI_TASK, {
    connection: getRedisClient(),
    defaultJobOptions,
  });

  if (process.env.NODE_ENV !== 'production') {
    global.aiTaskQueue = queue;
  }

  return queue;
}

/**
 * Add a task to the BullMQ queue.
 * Returns `true` if successfully enqueued, `false` if queue is disabled or
 * Redis is unreachable (caller should then execute directly).
 */
export async function enqueueAITask(task: Pick<IAITask, '_id'>): Promise<boolean> {
  if (!isQueueEnabled()) return false;

  try {
    const queue = getAITaskQueue();
    if (!queue) return false;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { JOB_NAMES } = require('@/constants/queue.constants') as typeof import('@/constants/queue.constants');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { defaultJobOptions } = require('@/config/queue.config') as typeof import('@/config/queue.config');

    await queue.add(JOB_NAMES.PROCESS_AI_TASK, { taskId: String(task._id) }, defaultJobOptions);
    return true;
  } catch (err) {
    console.warn(
      '[Queue] Failed to enqueue task (Redis unavailable?). Will fall back to direct execution.',
      err instanceof Error ? err.message : err,
    );
    return false;
  }
}

export async function getQueueStats() {
  const queue = getAITaskQueue();
  if (!queue) {
    return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, enabled: false };
  }

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);
  return { waiting, active, completed, failed, delayed, enabled: true };
}
