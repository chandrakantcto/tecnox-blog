import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CategoryService } from '@/services/category.service';
import { BlogService } from '@/services/blog.service';
import { connectToDatabase } from '@/lib/mongodb';
import { formatRelativeDate } from '@/utils/date';
import { Clock, ArrowLeft } from 'lucide-react';

export const revalidate = 300;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  await connectToDatabase();
  const categoryService = new CategoryService();
  const category = (await categoryService.getBySlug(slug) as unknown) as { name: string; description?: string } | null;
  if (!category) return { title: 'Category Not Found' };
  return {
    title: `${category.name} Articles`,
    description: category.description || `Browse all articles in ${category.name}`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  await connectToDatabase();
  const categoryService = new CategoryService();
  const blogService = new BlogService();

  type CategoryDetail = { _id: string; name: string; slug: string; description?: string; color?: string; blogCount?: number };
  type BlogItem = { _id: string; title: string; slug: string; excerpt?: string; featuredImage?: string; readingTime?: number; publishedAt?: Date; author?: { name: string } };
  const category = (await categoryService.getBySlug(slug) as unknown) as CategoryDetail | null;
  if (!category) notFound();

  const { blogs: rawBlogs } = await blogService.list({
    status: 'published',
    category: slug,
    limit: 12,
    page: 1,
    sortBy: 'publishedAt',
    sortOrder: 'desc',
  });
  const blogs = rawBlogs as unknown as BlogItem[];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/blog" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> All Articles
      </Link>

      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color || '#8b5cf6' }} />
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{category.name}</h1>
        </div>
        {category.description && (
          <p className="text-lg text-slate-500 dark:text-slate-400">{category.description}</p>
        )}
        <p className="text-sm text-slate-400 mt-2">{category.blogCount || blogs.length} articles</p>
      </div>

      {blogs.length === 0 ? (
        <div className="text-center py-20 text-slate-400">No articles in this category yet.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog) => (
            <Link key={blog._id} href={`/blog/${blog.slug}`} className="group">
              <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-violet-500/30 transition-all hover:shadow-md hover:-translate-y-0.5">
                {blog.featuredImage ? (
                  <div className="relative h-44 overflow-hidden">
                    <Image
                      src={blog.featuredImage} alt={blog.title} fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="33vw"
                    />
                  </div>
                ) : (
                  <div className="h-44 bg-gradient-to-br from-violet-900/20 to-slate-800/20" />
                )}
                <div className="p-5">
                  <h2 className="font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{blog.title}</h2>
                  {blog.excerpt && <p className="text-sm text-slate-500 mt-2 line-clamp-2">{blog.excerpt}</p>}
                  <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
                    <span>{formatRelativeDate(blog.publishedAt || new Date())}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{blog.readingTime || 1}m</span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
