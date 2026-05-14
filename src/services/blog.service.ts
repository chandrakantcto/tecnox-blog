import { connectToDatabase } from '@/lib/mongodb';
import { Blog } from '@/models/Blog';
import { Category } from '@/models/Category';
import { Tag } from '@/models/Tag';
// User must be imported so Mongoose registers the schema before .populate('author') runs
import '@/models/User';
import { generateSlug } from '@/utils/slug';
import { calculateReadingTime } from '@/utils/reading-time';
import { generateExcerpt } from '@/utils/excerpt';
import { buildPagination } from '@/utils/pagination';
import type { CreateBlogInput } from '@/validations/blog.schema';
import type { BlogQueryParams } from '@/types/api.types';

const POPULATE_CATEGORY = { path: 'category', select: 'name slug color' };
const POPULATE_AUTHOR = { path: 'author', select: 'name email avatar' };

export class BlogService {
  async create(input: CreateBlogInput, authorId: string) {
    await connectToDatabase();

    let slug = input.slug || generateSlug(input.title);

    const existing = await Blog.findOne({ slug });
    if (existing) {
      let counter = 1;
      while (await Blog.findOne({ slug: `${slug}-${counter}` })) counter++;
      slug = `${slug}-${counter}`;
    }

    const excerpt = input.excerpt || generateExcerpt(input.content);
    const readingTime = calculateReadingTime(input.content);

    const blog = await Blog.create({
      ...input,
      slug,
      excerpt,
      readingTime,
      author: authorId,
      publishedAt: input.status === 'published' ? new Date() : undefined,
    });

    if (input.status === 'published') {
      await Category.findByIdAndUpdate(input.category, { $inc: { blogCount: 1 } });
      if (input.tags?.length) {
        await Tag.updateMany(
          { slug: { $in: input.tags } },
          { $inc: { blogCount: 1 } }
        );
      }
    }

    return blog.populate([POPULATE_CATEGORY, POPULATE_AUTHOR]);
  }

  async update(id: string, input: Partial<CreateBlogInput>, userId: string) {
    await connectToDatabase();

    const existing = await Blog.findById(id);
    if (!existing) return null;

    const wasPublished = existing.status === 'published';
    const willBePublished = input.status === 'published';

    if (input.content) {
      input = {
        ...input,
        readingTime: calculateReadingTime(input.content),
        excerpt: input.excerpt || generateExcerpt(input.content),
      } as typeof input & { readingTime: number; excerpt: string };
    }

    if (!wasPublished && willBePublished) {
      (input as Record<string, unknown>).publishedAt = new Date();
    }

    const updated = await Blog.findByIdAndUpdate(id, input, { new: true })
      .populate([POPULATE_CATEGORY, POPULATE_AUTHOR]);

    void userId;
    return updated;
  }

  async delete(id: string) {
    await connectToDatabase();
    const blog = await Blog.findById(id);
    if (!blog) return null;

    await blog.deleteOne();

    if (blog.status === 'published') {
      await Category.findByIdAndUpdate(blog.category, { $inc: { blogCount: -1 } });
    }

    return blog;
  }

  async getBySlug(slug: string) {
    await connectToDatabase();
    return Blog.findOne({ slug, status: 'published', visibility: 'public' })
      .populate([POPULATE_CATEGORY, POPULATE_AUTHOR])
      .lean();
  }

  async getById(id: string) {
    await connectToDatabase();
    return Blog.findById(id).populate([POPULATE_CATEGORY, POPULATE_AUTHOR]).lean();
  }

  async list(params: BlogQueryParams) {
    await connectToDatabase();

    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    // 'all' is the admin sentinel meaning "no status filter"
    if (params.status && params.status !== 'all') filter.status = params.status;
    if (params.category) {
      const cat = await Category.findOne({ slug: params.category });
      if (cat) filter.category = cat._id;
    }
    if (params.tag) filter.tags = params.tag;
    if (params.aiGenerated !== undefined) filter.aiGenerated = params.aiGenerated;
    if (params.search) {
      filter.$text = { $search: params.search };
    }

    const sortField = params.sortBy || 'publishedAt';
    const sortOrder = params.sortOrder === 'asc' ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortOrder };

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate([POPULATE_CATEGORY, POPULATE_AUTHOR])
        .lean(),
      Blog.countDocuments(filter),
    ]);

    return { blogs, pagination: buildPagination(page, limit, total) };
  }

  async incrementViews(id: string) {
    await connectToDatabase();
    await Blog.findByIdAndUpdate(id, { $inc: { views: 1 } });
  }

  async toggleLike(id: string, liked: boolean) {
    await connectToDatabase();
    await Blog.findByIdAndUpdate(id, { $inc: { likes: liked ? 1 : -1 } });
  }

  async getRelated(slug: string, limit = 3) {
    await connectToDatabase();
    const blog = await Blog.findOne({ slug });
    if (!blog) return [];

    return Blog.find({
      _id: { $ne: blog._id },
      status: 'published',
      $or: [{ category: blog.category }, { tags: { $in: blog.tags } }],
    })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .populate([POPULATE_CATEGORY, POPULATE_AUTHOR])
      .lean();
  }

  async getFeatured(limit = 5) {
    await connectToDatabase();
    return Blog.find({ status: 'published', isFeatured: true, visibility: 'public' })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .populate([POPULATE_CATEGORY, POPULATE_AUTHOR])
      .lean();
  }

  async bulkUpdateStatus(ids: string[], status: string) {
    await connectToDatabase();
    return Blog.updateMany(
      { _id: { $in: ids } },
      {
        status,
        ...(status === 'published' ? { publishedAt: new Date() } : {}),
      }
    );
  }

  async bulkDelete(ids: string[]) {
    await connectToDatabase();
    return Blog.deleteMany({ _id: { $in: ids } });
  }

  async duplicate(id: string, authorId: string) {
    await connectToDatabase();
    const original = await Blog.findById(id).lean();
    if (!original) return null;

    const newSlug = `${original.slug}-copy-${Date.now()}`;
    const { _id, createdAt, updatedAt, publishedAt, views, likes, ...rest } = original;
    void _id; void createdAt; void updatedAt; void publishedAt; void views; void likes;

    return Blog.create({
      ...rest,
      title: `${original.title} (Copy)`,
      slug: newSlug,
      status: 'draft',
      author: authorId,
      aiGenerated: false,
      views: 0,
      likes: 0,
    });
  }
}
