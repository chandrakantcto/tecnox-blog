import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { BlogService } from '@/services/blog.service';
import { CategoryService } from '@/services/category.service';
import { formatRelativeDate } from '@/utils/date';
import { Clock, Eye, ArrowRight, Zap, Bot } from 'lucide-react';
import { connectToDatabase } from '@/lib/mongodb';

export const metadata: Metadata = {
  title: 'AI Blog Platform — Smart Content at Scale',
  description: 'Discover AI-powered articles on technology, products, and guides.',
};

export const revalidate = 60;

async function getHomeData() {
  try {
    await connectToDatabase();
    const blogService = new BlogService();
    const categoryService = new CategoryService();

    const [featuredResult, latestResult, categories] = await Promise.all([
      blogService.getFeatured(6),
      blogService.list({ status: 'published', limit: 9, page: 1, sortBy: 'publishedAt', sortOrder: 'desc' }),
      categoryService.getAll(),
    ]);

    return {
      featured: featuredResult,
      latest: latestResult.blogs,
      categories: categories.slice(0, 8),
    };
  } catch {
    return { featured: [], latest: [], categories: [] };
  }
}

type BlogPost = {
  _id: string; title: string; slug: string; excerpt?: string;
  featuredImage?: string; category?: { name: string; slug: string; color?: string };
  author?: { name: string }; readingTime?: number; views?: number;
  publishedAt?: Date; aiGenerated?: boolean;
};
type CatItem = { slug: string; name: string; color?: string; blogCount?: number };

export default async function HomePage() {
  const rawData = await getHomeData();
  const featured = rawData.featured as unknown as BlogPost[];
  const latest = rawData.latest as unknown as BlogPost[];
  const categories = rawData.categories as unknown as CatItem[];

  const heroPost = featured[0] || latest[0];
  const gridPosts = featured.length > 1 ? featured.slice(1, 7) : latest.slice(1, 7);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-56 h-56 bg-purple-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {/* Badge */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-2 px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full">
              <Bot className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs font-medium text-violet-300">AI-Powered Content</span>
            </div>
          </div>

          {heroPost ? (
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Link
                  href={`/category/${heroPost.category?.slug || ''}`}
                  className="text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors mb-3 block"
                >
                  {heroPost.category?.name || 'Featured'}
                </Link>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
                  {heroPost.title}
                </h1>
                {heroPost.excerpt && (
                  <p className="text-lg text-slate-300 leading-relaxed mb-6 line-clamp-3">
                    {heroPost.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                      {(heroPost.author?.name?.[0] || 'A').toUpperCase()}
                    </div>
                    <span className="text-sm text-slate-300">{heroPost.author?.name || 'AI Author'}</span>
                  </div>
                  <span className="text-slate-600">•</span>
                  <span className="flex items-center gap-1 text-sm text-slate-400">
                    <Clock className="w-4 h-4" />
                    {heroPost.readingTime || 1} min read
                  </span>
                  <span className="flex items-center gap-1 text-sm text-slate-400">
                    <Eye className="w-4 h-4" />
                    {(heroPost.views || 0).toLocaleString()}
                  </span>
                </div>
                <Link
                  href={`/blog/${heroPost.slug}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-violet-500/25"
                >
                  Read Article <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              {heroPost.featuredImage && (
                <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-violet-500/10">
                  <Image
                    src={heroPost.featuredImage}
                    alt={heroPost.title}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                AI-Powered Blog Platform
              </h1>
              <p className="text-xl text-slate-300 mb-8">
                High-quality content generated and published automatically.
              </p>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors"
              >
                Explore Blogs <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-5">Browse by Category</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/blog" className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-full hover:bg-violet-700 transition-colors">
              All Posts
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {cat.name}
                {cat.blogCount ? <span className="ml-1.5 text-slate-400 dark:text-slate-500">({cat.blogCount})</span> : ''}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Grid */}
      {gridPosts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Featured Articles</h2>
            <Link href="/blog" className="flex items-center gap-1.5 text-sm text-violet-600 dark:text-violet-400 hover:underline font-medium">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gridPosts.map((blog) => (
              <Link key={blog._id} href={`/blog/${blog.slug}`} className="group">
                <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-violet-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/5 hover:-translate-y-0.5">
                  {blog.featuredImage ? (
                    <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <Image
                        src={blog.featuredImage}
                        alt={blog.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-violet-900/20 to-slate-800 flex items-center justify-center">
                      <Zap className="w-10 h-10 text-violet-500/30" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      {blog.category && (
                        <span className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                          {blog.category.name}
                        </span>
                      )}
                      {blog.aiGenerated && (
                        <span className="flex items-center gap-0.5 text-xs text-purple-500">
                          <Bot className="w-3 h-3" />AI
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-2">
                      {blog.title}
                    </h3>
                    {blog.excerpt && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">{blog.excerpt}</p>
                    )}
                    <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
                      <span>{formatRelativeDate(blog.publishedAt || new Date())}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {blog.readingTime || 1} min
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="bg-gradient-to-r from-violet-600 to-purple-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Content Generated by AI, Delivered for You
          </h2>
          <p className="text-violet-200 mb-8 text-lg max-w-xl mx-auto">
            Our AI creates high-quality, SEO-optimized articles automatically.
          </p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-violet-700 font-semibold rounded-xl hover:bg-violet-50 transition-colors shadow-xl"
          >
            Browse All Articles <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
