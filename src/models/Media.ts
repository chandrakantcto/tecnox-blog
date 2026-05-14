import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IMediaDocument extends Document {
  publicId: string;
  url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  altText?: string;
  uploadedBy: Types.ObjectId;
  usedIn: Types.ObjectId[];
  createdAt: Date;
}

const MediaSchema = new Schema<IMediaDocument>(
  {
    publicId: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    format: { type: String, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    bytes: { type: Number, required: true },
    altText: { type: String, maxlength: 200 },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    usedIn: [{ type: Schema.Types.ObjectId, ref: 'Blog' }],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

MediaSchema.index({ uploadedBy: 1 });
MediaSchema.index({ publicId: 1 }, { unique: true });

export const Media: Model<IMediaDocument> =
  mongoose.models.Media || mongoose.model<IMediaDocument>('Media', MediaSchema);
