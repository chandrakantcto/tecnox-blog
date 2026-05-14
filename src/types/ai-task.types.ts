import type { Types } from 'mongoose';

export type AITaskStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ContentType = 'Product' | 'Category' | 'How-To' | 'Listicle' | 'General';

export interface IAITask {
  _id: Types.ObjectId | string;
  contentType: ContentType | string;
  keywords: string[];
  targetUrl?: string;
  productName?: string;
  workflowRunId?: string;
  blogId?: Types.ObjectId | string;
  status: AITaskStatus;
  attempts: number;
  maxAttempts: number;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  webhookPayload?: Record<string, unknown>;
  errorMessage?: string;
  errorStack?: string;
  createdBy: Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAITaskInput {
  contentType: string;
  keywords: string[];
  targetUrl?: string;
  productName?: string;
  scheduledAt?: Date;
}
