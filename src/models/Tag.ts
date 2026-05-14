import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITagDocument extends Document {
  name: string;
  slug: string;
  blogCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const TagSchema = new Schema<ITagDocument>(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, trim: true, lowercase: true },
    blogCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

TagSchema.index({ slug: 1 }, { unique: true });

export const Tag: Model<ITagDocument> =
  mongoose.models.Tag || mongoose.model<ITagDocument>('Tag', TagSchema);
