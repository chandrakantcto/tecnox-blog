import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import type { AITaskStatus } from '@/types/ai-task.types';

export interface IAITaskDocument extends Document {
  contentType: string;
  keywords: string[];
  targetUrl?: string;
  productName?: string;
  // Dify static payload fields stored per-task
  response_mode?: string;
  user?: string;
  workflowRunId?: string;
  blogId?: Types.ObjectId;
  status: AITaskStatus;
  attempts: number;
  maxAttempts: number;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  webhookPayload?: Record<string, unknown>;
  errorMessage?: string;
  errorStack?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AITaskSchema = new Schema<IAITaskDocument>(
  {
    contentType:   { type: String, required: true },
    keywords:      [{ type: String, required: true }],
    targetUrl:     { type: String },
    productName:   { type: String, maxlength: 200 },
    response_mode: { type: String, default: 'blocking' },
    user:          { type: String, default: 'admin-user' },
    workflowRunId: { type: String },
    blogId: { type: Schema.Types.ObjectId, ref: 'Blog' },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    scheduledAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    webhookPayload: { type: Schema.Types.Mixed },
    errorMessage: { type: String },
    errorStack: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

AITaskSchema.index({ status: 1, createdAt: 1 });
AITaskSchema.index({ workflowRunId: 1 }, { sparse: true });
AITaskSchema.index({ blogId: 1 }, { sparse: true });
AITaskSchema.index({ createdBy: 1 });

export const AITask: Model<IAITaskDocument> =
  mongoose.models.AITask || mongoose.model<IAITaskDocument>('AITask', AITaskSchema);
