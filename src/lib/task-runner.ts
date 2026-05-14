/**
 * Task Runner — central dispatcher for AI task execution.
 *
 * Decision tree:
 *  1. If task.scheduledAt is in the future → do nothing (cron will pick it up).
 *  2. If ENABLE_QUEUE && ENABLE_REDIS → try BullMQ.
 *     On Redis failure → fall back to direct Dify call.
 *  3. Otherwise → call Dify directly (blocking / streaming mode per task config).
 *
 * This module is the ONLY place that decides "queue vs direct".
 */

import { connectToDatabase } from '@/lib/mongodb';
import { AITask } from '@/models/AITask';
import { enqueueAITask, isQueueEnabled } from '@/lib/queue';
import type { IAITaskDocument } from '@/models/AITask';

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Dispatch a newly-created or rescheduled task.
 * Called right after AITask.create().
 */
export async function dispatchTask(task: IAITaskDocument): Promise<void> {
  // Scheduled for later → cron handles it; nothing to do now.
  if (task.scheduledAt && task.scheduledAt > new Date()) {
    console.info(`[TaskRunner] Task ${task._id} scheduled for ${task.scheduledAt.toISOString()} — skipping immediate dispatch.`);
    return;
  }

  await executeTask(task);
}

/**
 * Execute a single task, respecting the queue/direct preference.
 * Used both by dispatchTask() and by the cron route.
 */
export async function executeTask(task: IAITaskDocument): Promise<void> {
  if (isQueueEnabled()) {
    const enqueued = await enqueueAITask(task);
    if (enqueued) {
      console.info(`[TaskRunner] Task ${task._id} added to BullMQ queue.`);
      return;
    }
    console.warn(`[TaskRunner] Queue unavailable for task ${task._id} — falling back to direct execution.`);
  }

  await executeDirectly(task);
}

/**
 * Execute a task directly via Dify (no queue).
 * Updates task status in MongoDB throughout the lifecycle.
 */
export async function executeDirectly(task: IAITaskDocument): Promise<void> {
  await connectToDatabase();

  console.info(`[TaskRunner] Executing task ${task._id} directly via Dify.`);

  // Mark as processing
  await AITask.findByIdAndUpdate(task._id, {
    status: 'processing',
    startedAt: new Date(),
    $inc: { attempts: 1 },
  });

  try {
    const { DifyService } = await import('@/services/dify.service');
    const dify = new DifyService();

    const result = await dify.triggerWorkflow({
      taskId:       String(task._id),
      contentType:  task.contentType,
      keywords:     task.keywords,
      targetUrl:    task.targetUrl,
      productName:  task.productName,
      responseMode: task.response_mode as 'blocking' | 'async' | undefined || 'blocking',
      user:         task.user || 'admin-user',
    });

    // Store the workflow run id; webhook will mark it completed later.
    await AITask.findByIdAndUpdate(task._id, {
      workflowRunId: result.workflow_run_id,
    });

    console.info(`[TaskRunner] Task ${task._id} triggered — run id: ${result.workflow_run_id}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack   = err instanceof Error ? err.stack  : undefined;
    console.error(`[TaskRunner] Task ${task._id} failed:`, message);

    await AITask.findByIdAndUpdate(task._id, {
      status:       'failed',
      errorMessage: message,
      errorStack:   stack,
    });
  }
}

/**
 * Find all pending tasks that are due (scheduledAt <= now OR no scheduledAt)
 * and execute them.  Called by the cron route.
 */
export async function processDueTasks(): Promise<{ processed: number; errors: number }> {
  await connectToDatabase();

  const now = new Date();

  const dueTasks = await AITask.find({
    status: 'pending',
    $or: [
      { scheduledAt: { $lte: now } },
      { scheduledAt: null },
      { scheduledAt: { $exists: false } },
    ],
  }).limit(20); // safety cap per cron run

  let processed = 0;
  let errors    = 0;

  for (const task of dueTasks) {
    try {
      await executeTask(task);
      processed++;
    } catch (err) {
      errors++;
      console.error(`[TaskRunner] Cron failed for task ${task._id}:`, err);
    }
  }

  return { processed, errors };
}
