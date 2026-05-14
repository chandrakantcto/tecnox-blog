import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { BlogService } from '@/services/blog.service';
import { connectToDatabase } from '@/lib/mongodb';
import { formatDate } from '@/utils/date';
import { Clock, Eye, Calendar, Tag, ArrowLeft, Bot, Share2 } from 'lucide-react';

export const revalidate = 300;

interface BlogDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  await connectToDatabase();
  const blogService = new BlogService();
  type BlogMeta = {
    title: string; excerpt?: string; featuredImage?: string;
    seo?: { metaTitle?: string; metaDescription?: string; ogImage?: string; canonicalUrl?: string; keywords?: string[] };
    publishedAt?: Date; author?: { name: string }; tags?: string[];
  };
  const blog = (await blogService.getBySlug(slug) as unknown) as BlogMeta | null;
  if (!blog) return { title: 'Blog Not Found' };

  return {
    title: blog.seo?.metaTitle || blog.title,
    description: blog.seo?.metaDescription || blog.excerpt,
    keywords: blog.seo?.keywords,
    openGraph: {
      title: blog.seo?.metaTitle || blog.title,
      description: blog.seo?.metaDescription || blog.excerpt,
      images: [{ url: blog.seo?.ogImage || blog.featuredImage || '' }],
      type: 'article',
      publishedTime: blog.publishedAt?.toISOString(),
      authors: [blog.author?.name || ''],
      tags: blog.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.seo?.metaTitle || blog.title,
      description: blog.seo?.metaDescription || blog.excerpt,
      images: [blog.seo?.ogImage || blog.featuredImage || ''],
    },
    alternates: {
      canonical: blog.seo?.canonicalUrl || `/blog/${slug}`,
    },
  };
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  await connectToDatabase();
  const blogService = new BlogService();

  type BlogDetail = {
    _id: string; title: string; slug: string; content: string; excerpt?: string;
    featuredImage?: string; featuredImageAlt?: string;
    category?: { name: string; slug: string; color?: string };
    author?: { name: string; email: string; avatar?: string };
    tags?: string[]; readingTime?: number; views?: number; likes?: number;
    publishedAt?: Date; aiGenerated?: boolean;
    seo?: { metaTitle?: string; metaDescription?: string };
  };
  type RelatedBlog = {
    _id: string; title: string; slug: string; featuredImage?: string;
    category?: { name: string }; publishedAt?: Date; readingTime?: number;
  };

  const blog = (await blogService.getBySlug(slug) as unknown) as BlogDetail | null;
  if (!blog) notFound();

  const related = (await blogService.getRelated(slug, 3) as unknown) as RelatedBlog[];

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8">
        <Link href="/" className="hover:text-slate-700 dark:hover:text-slate-300">Home</Link>
        <span>/</span>
        <Link href="/blog" className="hover:text-slate-700 dark:hover:text-slate-300">Blog</Link>
        {blog.category && (
          <>
            <span>/</span>
            <Link href={`/category/${blog.category.slug}`} className="hover:text-slate-700 dark:hover:text-slate-300">
              {blog.category.name}
            </Link>
          </>
        )}
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          {blog.category && (
            <Link
              href={`/category/${blog.category.slug}`}
              className="text-sm font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider hover:underline"
            >
              {blog.category.name}
            </Link>
          )}
          {blog.aiGenerated && (
            <span className="flex items-center gap-1 text-xs text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-full">
              <Bot className="w-3 h-3" /> AI Generated
            </span>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white leading-tight mb-6">
          {blog.title}
        </h1>

        {blog.excerpt && (
          <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
            {blog.excerpt}
          </p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
              {(blog.author?.name?.[0] || 'A').toUpperCase()}
            </div>
            <span className="font-medium text-slate-700 dark:text-slate-300">{blog.author?.name || 'Author'}</span>
          </div>
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {blog.publishedAt ? formatDate(blog.publishedAt) : 'Unknown date'}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {blog.readingTime || 1} min read
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {(blog.views || 0).toLocaleString()} views
          </span>
        </div>
      </header>

      {/* Featured Image */}
      {blog.featuredImage && (
        <div className="relative aspect-video rounded-2xl overflow-hidden mb-10 bg-slate-100 dark:bg-slate-800">
          <Image
            src={blog.featuredImage}
            alt={blog.featuredImageAlt || blog.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 896px) 100vw, 896px"
          />
        </div>
      )}

      {/* Content */}
      <div
        className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-violet-600 dark:prose-a:text-violet-400 prose-img:rounded-xl prose-code:text-violet-600 dark:prose-code:text-violet-400 prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800"
        dangerouslySetInnerHTML={{ __html: blog.content }}
      />

      {/* Tags */}
      {blog.tags && blog.tags.length > 0 && (
        <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 flex-wrap">
            <Tag className="w-4 h-4 text-slate-400" />
            {blog.tags.map((tag) => (
              <Link
                key={tag}
                href={`/tag/${tag}`}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm rounded-full hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Share */}
      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <Share2 className="w-4 h-4" /> Share this article
        </p>
        <div className="flex gap-3">
          {[
            { label: 'Twitter', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(blog.title)}&url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL || ''}/blog/${blog.slug}`)}` },
            { label: 'LinkedIn', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL || ''}/blog/${blog.slug}`)}` },
          ].map((s) => (
            <a
              key={s.label}
              href={s.url}
              target="_blank"
              rel="noreferrer noopener"
              className="px-4 py-2 text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {s.label}
            </a>
          ))}
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Related Articles</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {related.map((rel) => (
              <Link key={rel._id} href={`/blog/${rel.slug}`} className="group">
                <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:border-violet-500/30 transition-all hover:shadow-md">
                  {rel.featuredImage ? (
                    <div className="relative h-36 overflow-hidden">
                      <Image
                        src={rel.featuredImage}
                        alt={rel.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="33vw"
                      />
                    </div>
                  ) : (
                    <div className="h-36 bg-gradient-to-br from-violet-900/20 to-slate-800/20" />
                  )}
                  <div className="p-4">
                    {rel.category && (
                      <p className="text-xs text-violet-600 dark:text-violet-400 font-semibold mb-1">{rel.category.name}</p>
                    )}
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      {rel.title}
                    </h3>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Back */}
      <div className="mt-12">
        <Link href="/blog" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>
      </div>
    </article>
  );
}
