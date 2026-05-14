import { connectToDatabase } from '@/lib/mongodb';
import { Tag } from '@/models/Tag';
import { Blog } from '@/models/Blog';
import { generateSlug } from '@/utils/slug';
import type { CreateTagInput } from '@/validations/tag.schema';

export class TagService {
  async create(input: CreateTagInput) {
    await connectToDatabase();
    const slug = input.slug || generateSlug(input.name);

    const existing = await Tag.findOne({ slug });
    if (existing) throw new Error('Tag with this slug already exists');

    return Tag.create({ ...input, slug });
  }

  async update(id: string, input: Partial<CreateTagInput>) {
    await connectToDatabase();
    if (input.name && !input.slug) {
      input.slug = generateSlug(input.name);
    }
    return Tag.findByIdAndUpdate(id, input, { new: true });
  }

  async delete(id: string) {
    await connectToDatabase();
    const tag = await Tag.findById(id);
    if (!tag) return null;

    await Blog.updateMany(
      { tags: tag.slug },
      { $pull: { tags: tag.slug } }
    );

    return tag.deleteOne();
  }

  async merge(sourceId: string, targetId: string) {
    await connectToDatabase();
    const [source, target] = await Promise.all([
      Tag.findById(sourceId),
      Tag.findById(targetId),
    ]);

    if (!source || !target) throw new Error('One or both tags not found');

    await Blog.updateMany(
      { tags: source.slug },
      { $addToSet: { tags: target.slug }, $pull: { tags: source.slug } }
    );

    const count = await Blog.countDocuments({ tags: target.slug });
    await Tag.findByIdAndUpdate(targetId, { blogCount: count });
    await source.deleteOne();

    return target;
  }

  async getAll() {
    await connectToDatabase();
    return Tag.find().sort({ blogCount: -1, name: 1 }).lean();
  }

  async getBySlug(slug: string) {
    await connectToDatabase();
    return Tag.findOne({ slug }).lean();
  }

  async syncCount(slug: string) {
    await connectToDatabase();
    const count = await Blog.countDocuments({ tags: slug, status: 'published' });
    await Tag.findOneAndUpdate({ slug }, { blogCount: count });
  }
}
