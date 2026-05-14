import { connectToDatabase } from '@/lib/mongodb';
import { cloudinary } from '@/lib/cloudinary';
import { Media } from '@/models/Media';

export class MediaService {
  async upload(fileBuffer: Buffer, filename: string, userId: string) {
    await connectToDatabase();

    const result = await new Promise<{
      public_id: string;
      secure_url: string;
      format: string;
      width: number;
      height: number;
      bytes: number;
    }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'blog-platform',
          public_id: `${Date.now()}-${filename.replace(/\.[^/.]+$/, '')}`,
          overwrite: false,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as Parameters<typeof resolve>[0]);
        }
      );
      uploadStream.end(fileBuffer);
    });

    const media = await Media.create({
      publicId: result.public_id,
      url: result.secure_url,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      uploadedBy: userId,
    });

    return media;
  }

  async delete(publicId: string) {
    await connectToDatabase();
    await cloudinary.uploader.destroy(publicId);
    return Media.findOneAndDelete({ publicId });
  }

  async getAll(userId?: string, page = 1, limit = 20) {
    await connectToDatabase();

    const filter = userId ? { uploadedBy: userId } : {};
    const skip = (page - 1) * limit;

    const [media, total] = await Promise.all([
      Media.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('uploadedBy', 'name')
        .lean(),
      Media.countDocuments(filter),
    ]);

    return { media, total };
  }
}
