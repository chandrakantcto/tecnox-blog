import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import type { BlogStatus, BlogVisibility } from '@/types/blog.types';

export interface IBlogDocument extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  category: Types.ObjectId;
  tags: string[];
  author: Types.ObjectId;
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    canonicalUrl?: string;
    ogImage?: string;
  };
  status: BlogStatus;
  visibility: BlogVisibility;
  aiGenerated: boolean;
  aiTaskId?: Types.ObjectId;
  difyWorkflowId?: string;
  readingTime: number;
  views: number;
  likes: number;
  isFeatured: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema = new Schema<IBlogDocument>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, trim: true, lowercase: true },
    excerpt: { type: String, maxlength: 500, default: '' },
    content: { type: String, required: true },
    featuredImage: { type: String },
    featuredImageAlt: { type: String, maxlength: 200 },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    tags: [{ type: String, trim: true }],
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    seo: {
      metaTitle: { type: String, maxlength: 60 },
      metaDescription: { type: String, maxlength: 160 },
      keywords: [{ type: String }],
      canonicalUrl: { type: String },
      ogImage: { type: String },
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
    aiGenerated: { type: Boolean, default: false },
    aiTaskId: { type: Schema.Types.ObjectId, ref: 'AITask' },
    difyWorkflowId: { type: String },
    readingTime: { type: Number, default: 1 },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

BlogSchema.index({ slug: 1 }, { unique: true });
BlogSchema.index({ status: 1, publishedAt: -1 });
BlogSchema.index({ category: 1, status: 1, publishedAt: -1 });
BlogSchema.index({ tags: 1, status: 1, publishedAt: -1 });
BlogSchema.index({ isFeatured: 1, status: 1 });
BlogSchema.index({ aiGenerated: 1 });
BlogSchema.index({ title: 'text', excerpt: 'text', content: 'text' });

export const Blog: Model<IBlogDocument> =
  mongoose.models.Blog || mongoose.model<IBlogDocument>('Blog', BlogSchema);
