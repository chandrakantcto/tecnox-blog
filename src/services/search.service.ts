import { connectToDatabase } from '@/lib/mongodb';
import { Blog } from '@/models/Blog';
import '@/models/User';     // register User schema for .populate('author')
import '@/models/Category'; // register Category schema for .populate('category')

export class SearchService {
  async search(query: string, page = 1, limit = 10) {
    await connectToDatabase();

    if (!query.trim()) return { results: [], total: 0 };

    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {
      status: 'published',
      visibility: 'public',
      $text: { $search: query },
    };

    const [results, total] = await Promise.all([
      Blog.find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit)
        .populate('category', 'name slug color')
        .populate('author', 'name avatar')
        .select('title slug excerpt featuredImage category author tags readingTime publishedAt views')
        .lean(),
      Blog.countDocuments(filter),
    ]);

    return { results, total };
  }
}
