import { connectToDatabase } from '@/lib/mongodb';
import { AITask } from '@/models/AITask';
import { dispatchTask } from '@/lib/task-runner';
import '@/models/User'; // register User schema for .populate('createdBy')
import { buildPagination } from '@/utils/pagination';
import type { CreateAITaskInput } from '@/validations/ai-task.schema';
import type { AITaskQueryParams } from '@/types/api.types';

export class AITaskService {
  async create(input: CreateAITaskInput, userId: string) {
    await connectToDatabase();

    // Map schedule_datetime → scheduledAt (ISO string → Date)
    const scheduledAt =
      input.schedule_datetime && input.schedule_datetime !== ''
        ? new Date(input.schedule_datetime)
        : undefined;

    const task = await AITask.create({
      contentType:   input.contentType,
      keywords:      input.keywords,
      targetUrl:     input.targetUrl || undefined,
      productName:   input.productName || undefined,
      response_mode: input.response_mode || 'blocking',
      user:          input.user          || 'admin-user',
      scheduledAt,
      createdBy:     userId,
      maxAttempts:   Number(process.env.QUEUE_MAX_ATTEMPTS) || 3,
    });

    // Dispatch: immediate (queue or direct) vs deferred (cron picks it up)
    await dispatchTask(task);
    return task;
  }

  async update(id: string, input: Partial<CreateAITaskInput>) {
    await connectToDatabase();

    const update: Record<string, unknown> = { ...input };

    if ('schedule_datetime' in input) {
      update.scheduledAt =
        input.schedule_datetime && input.schedule_datetime !== ''
          ? new Date(input.schedule_datetime)
          : undefined;
      delete update.schedule_datetime;
    }

    return AITask.findByIdAndUpdate(id, update, { new: true });
  }

  async delete(id: string) {
    await connectToDatabase();
    return AITask.findByIdAndDelete(id);
  }

  async getById(id: string) {
    await connectToDatabase();
    return AITask.findById(id)
      .populate('blogId', 'title slug')
      .populate('createdBy', 'name email')
      .lean();
  }

  async list(params: AITaskQueryParams) {
    await connectToDatabase();

    const page  = Math.max(1, params.page  || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 10));
    const skip  = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (params.status) filter.status = params.status;
    if (params.search) {
      filter.$or = [
        { productName:  { $regex: params.search, $options: 'i' } },
        { contentType:  { $regex: params.search, $options: 'i' } },
      ];
    }

    const [tasks, total] = await Promise.all([
      AITask.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email')
        .lean(),
      AITask.countDocuments(filter),
    ]);

    return { tasks, pagination: buildPagination(page, limit, total) };
  }

  async retry(id: string) {
    await connectToDatabase();
    const task = await AITask.findByIdAndUpdate(
      id,
      { status: 'pending', errorMessage: undefined, errorStack: undefined },
      { new: true },
    );
    if (task) await dispatchTask(task);
    return task;
  }

  async retryAllFailed() {
    await connectToDatabase();
    const failedTasks = await AITask.find({ status: 'failed' });

    await AITask.updateMany(
      { status: 'failed' },
      { status: 'pending', errorMessage: undefined, errorStack: undefined },
    );

    await Promise.all(failedTasks.map((t) => dispatchTask(t)));
    return failedTasks.length;
  }

  async enqueueAllPending() {
    await connectToDatabase();
    const pendingTasks = await AITask.find({ status: 'pending' });
    await Promise.all(pendingTasks.map((t) => dispatchTask(t)));
    return pendingTasks.length;
  }

  async getByWorkflowRunId(runId: string) {
    await connectToDatabase();
    return AITask.findOne({ workflowRunId: runId });
  }

  async markCompleted(id: string, blogId: string, webhookPayload: Record<string, unknown>) {
    await connectToDatabase();
    return AITask.findByIdAndUpdate(
      id,
      { status: 'completed', blogId, completedAt: new Date(), webhookPayload },
      { new: true },
    );
  }

  async triggerManually(id: string) {
    await connectToDatabase();
    const task = await AITask.findById(id);
    if (!task) throw new Error('Task not found');

    // Re-dispatch (respects queue vs direct preference)
    await dispatchTask(task);
    return task;
  }
}
