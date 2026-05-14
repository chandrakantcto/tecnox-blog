import Link from 'next/link';
import Image from 'next/image';
import { formatRelativeDate } from '@/utils/date';
import { Clock, Eye, Bot } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface BlogCardProps {
  blog: {
    _id: string;
    title: string;
    slug: string;
    excerpt?: string;
    featuredImage?: string;
    category?: { name: string; slug: string; color?: string };
    author?: { name: string; avatar?: string };
    readingTime?: number;
    views?: number;
    publishedAt?: string | Date;
    aiGenerated?: boolean;
    tags?: string[];
  };
  featured?: boolean;
}

export function BlogCard({ blog, featured = false }: BlogCardProps) {
  if (featured) {
    return (
      <Link href={`/blog/${blog.slug}`} className="group block">
        <article className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 hover:border-violet-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/5">
          {blog.featuredImage && (
            <div className="relative h-56 overflow-hidden">
              <Image
                src={blog.featuredImage}
                alt={blog.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
            </div>
          )}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              {blog.category && (
                <Badge
                  variant="primary"
                  size="sm"
                  style={{ color: blog.category.color }}
                >
                  {blog.category.name}
                </Badge>
              )}
              {blog.aiGenerated && (
                <Badge variant="purple" size="sm">
                  <Bot className="w-3 h-3 mr-1" />AI
                </Badge>
              )}
            </div>
            <h2 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors line-clamp-2">
              {blog.title}
            </h2>
            {blog.excerpt && (
              <p className="text-sm text-slate-400 mt-2 line-clamp-2">{blog.excerpt}</p>
            )}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                  {blog.author?.name?.[0]?.toUpperCase() || 'A'}
                </div>
                <span className="text-xs text-slate-500">{blog.author?.name || 'Author'}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {blog.readingTime || 1} min
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {(blog.views || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={`/blog/${blog.slug}`} className="group block">
      <article className="flex gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-violet-500/30 transition-all duration-200 hover:shadow-md">
        {blog.featuredImage && (
          <div className="relative w-24 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
            <Image
              src={blog.featuredImage}
              alt={blog.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="96px"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {blog.category && (
            <span className="text-xs font-medium text-violet-600 dark:text-violet-400 mb-1 block">
              {blog.category.name}
            </span>
          )}
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-2">
            {blog.title}
          </h3>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
            <span>{formatRelativeDate(blog.publishedAt || new Date())}</span>
            <span className="flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {blog.readingTime || 1}m
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
