import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const { connectToDatabase } = await import('@/lib/mongodb');
    const { Blog } = await import('@/models/Blog');
    const { Category } = await import('@/models/Category');

    await connectToDatabase();

    const [blogs, categories] = await Promise.all([
      Blog.find({ status: 'published', visibility: 'public' })
        .select('slug updatedAt')
        .lean(),
      Category.find({ isActive: true })
        .select('slug updatedAt')
        .lean(),
    ]);

    type SitemapEntry = { slug: string; updatedAt: Date };
    const blogEntries: MetadataRoute.Sitemap = (blogs as unknown as SitemapEntry[]).map((blog) => ({
      url: `${BASE_URL}/blog/${blog.slug}`,
      lastModified: blog.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    const categoryEntries: MetadataRoute.Sitemap = (categories as unknown as SitemapEntry[]).map((cat) => ({
      url: `${BASE_URL}/category/${cat.slug}`,
      lastModified: cat.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

    return [
      { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
      { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
      { url: `${BASE_URL}/search`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
      ...blogEntries,
      ...categoryEntries,
    ];
  } catch {
    return [
      { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    ];
  }
}
