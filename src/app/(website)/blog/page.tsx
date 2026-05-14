import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { BlogService } from '@/services/blog.service';
import { CategoryService } from '@/services/category.service';
import { Pagination } from '@/components/ui/Pagination';
import { formatRelativeDate } from '@/utils/date';
import { connectToDatabase } from '@/lib/mongodb';
import { Clock, Eye, Bot, Filter } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Browse all published articles on our AI blog platform.',
};

export const revalidate = 60;

interface BlogListingPageProps {
  searchParams: Promise<{ page?: string; category?: string; tag?: string; sort?: string }>;
}

export default async function BlogListingPage({ searchParams }: BlogListingPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const category = params.category || undefined;
  const tag = params.tag || undefined;
  const sort = params.sort || 'publishedAt';

  await connectToDatabase();
  const blogService = new BlogService();
  const categoryService = new CategoryService();

  const [result, categories] = await Promise.all([
    blogService.list({
      page,
      limit: 12,
      status: 'published',
      category,
      tag,
      sortBy: sort,
      sortOrder: 'desc',
    }),
    categoryService.getAll(),
  ]);

  type BlogItem = {
    _id: string; title: string; slug: string; excerpt?: string;
    featuredImage?: string; category?: { name: string; slug: string };
    author?: { name: string }; readingTime?: number; views?: number;
    publishedAt?: Date; aiGenerated?: boolean; tags?: string[];
  };
  type CategoryItem = { slug: string; name: string };
  const { blogs: rawBlogs, pagination } = result;
  const blogs = rawBlogs as unknown as BlogItem[];
  const typedCategories = categories as unknown as CategoryItem[];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">All Articles</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          {pagination.total} article{pagination.total !== 1 ? 's' : ''} published
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link
          href="/blog"
          className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
            !category ? 'bg-violet-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          All
        </Link>
        {typedCategories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/blog?category=${cat.slug}`}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
              category === cat.slug ? 'bg-violet-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Grid */}
      {blogs.length === 0 ? (
        <div className="text-center py-24 text-slate-400">
          <Filter className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No articles found</p>
          <Link href="/blog" className="mt-4 inline-block text-violet-500 hover:underline">Clear filters</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog) => (
            <Link key={blog._id} href={`/blog/${blog.slug}`} className="group">
              <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-violet-500/30 transition-all hover:shadow-md hover:-translate-y-0.5">
                {blog.featuredImage ? (
                  <div className="relative h-44 overflow-hidden">
                    <Image
                      src={blog.featuredImage}
                      alt={blog.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                ) : (
                  <div className="h-44 bg-gradient-to-br from-violet-900/20 to-slate-800/20" />
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    {blog.category && (
                      <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                        {blog.category.name}
                      </span>
                    )}
                    {blog.aiGenerated && <Bot className="w-3.5 h-3.5 text-purple-500" />}
                  </div>
                  <h2 className="font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {blog.title}
                  </h2>
                  {blog.excerpt && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">{blog.excerpt}</p>
                  )}
                  <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
                    <span>{formatRelativeDate(blog.publishedAt || new Date())}</span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{blog.readingTime || 1}m</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{(blog.views || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-10">
          <Pagination
            pagination={pagination}
            onPageChange={() => {}}
          />
        </div>
      )}
    </div>
  );
}
