import { Worker, Job } from 'bullmq';
import { getRedisClient } from '../redis';
import { connectToDatabase } from '../mongodb';
import { QUEUE_NAMES, JOB_NAMES } from '@/constants/queue.constants';

interface AITaskJobData {
  taskId: string;
}

let worker: Worker | null = null;

export function startAITaskWorker(): Worker {
  if (worker) return worker;

  worker = new Worker<AITaskJobData>(
    QUEUE_NAMES.AI_TASK,
    async (job: Job<AITaskJobData>) => {
      const { taskId } = job.data;
      console.info(`[Worker] Processing AI task: ${taskId}`);

      await connectToDatabase();
      const { AITask } = await import('@/models/AITask');
      const task = await AITask.findById(taskId);

      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      if (task.status !== 'pending') {
        console.info(`[Worker] Task ${taskId} is not pending, skipping`);
        return;
      }

      await AITask.findByIdAndUpdate(taskId, {
        status: 'processing',
        startedAt: new Date(),
        $inc: { attempts: 1 },
      });

      const { DifyService } = await import('@/services/dify.service');
      const difyService = new DifyService();

      const result = await difyService.triggerWorkflow({
        taskId,
        contentType: task.contentType,
        keywords: task.keywords,
        targetUrl: task.targetUrl,
        productName: task.productName,
      });

      await AITask.findByIdAndUpdate(taskId, {
        workflowRunId: result.workflow_run_id,
      });

      console.info(`[Worker] AI task ${taskId} triggered with workflow run: ${result.workflow_run_id}`);
    },
    {
      connection: getRedisClient(),
      concurrency: Number(process.env.QUEUE_CONCURRENCY) || 5,
    }
  );

  worker.on('completed', (job) => {
    console.info(`[Worker] Job ${job.id} completed`);
  });

  worker.on('failed', async (job, error) => {
    console.error(`[Worker] Job ${job?.id} failed:`, error.message);

    if (job?.data.taskId) {
      try {
        await connectToDatabase();
        const { AITask } = await import('@/models/AITask');
        const maxAttempts = Number(process.env.QUEUE_MAX_ATTEMPTS) || 3;
        const isFinalAttempt = (job.attemptsMade ?? 0) >= maxAttempts;

        await AITask.findByIdAndUpdate(job.data.taskId, {
          status: isFinalAttempt ? 'failed' : 'pending',
          errorMessage: error.message,
          errorStack: error.stack,
        });
      } catch (updateError) {
        console.error('[Worker] Failed to update task status:', updateError);
      }
    }
  });

  worker.on('stalled', (jobId) => {
    console.warn(`[Worker] Job ${jobId} stalled`);
  });

  console.info('[Worker] AI task worker started');
  return worker;
}

export async function stopAITaskWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
    console.info('[Worker] AI task worker stopped');
  }
}

export { worker as aiTaskWorker };
