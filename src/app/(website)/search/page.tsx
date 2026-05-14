'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import { Input } from '@/components/ui/Input';
import { LoadingScreen } from '@/components/ui/Spinner';
import { formatRelativeDate } from '@/utils/date';
import { Search, Clock, Eye, FileSearch } from 'lucide-react';

async function searchBlogs(query: string) {
  if (!query.trim()) return { data: [] };
  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=15`);
  return res.json();
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchBlogs(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  });

  type SearchResult = {
    _id: string; title: string; slug: string; excerpt?: string;
    featuredImage?: string; category?: { name: string; slug: string };
    author?: { name: string }; readingTime?: number; views?: number; publishedAt?: Date;
  };
  const results: SearchResult[] = data?.data || [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Search Articles</h1>
        <Input
          type="search"
          placeholder="Search for articles, topics, keywords..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          leftIcon={<Search className="w-5 h-5" />}
          autoFocus
          className="text-base h-12"
        />
      </div>

      {!debouncedQuery && (
        <div className="text-center py-20 text-slate-400">
          <FileSearch className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg">Type to search across all articles</p>
        </div>
      )}

      {debouncedQuery && isLoading && <LoadingScreen text="Searching..." />}

      {debouncedQuery && !isLoading && results.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No results for &quot;{debouncedQuery}&quot;</p>
          <p className="text-sm mt-2">Try different keywords</p>
        </div>
      )}

      {results.length > 0 && (
        <div>
          <p className="text-sm text-slate-500 mb-4">{results.length} result{results.length !== 1 ? 's' : ''} for &quot;{debouncedQuery}&quot;</p>
          <div className="space-y-4">
            {results.map((blog) => (
              <Link key={blog._id} href={`/blog/${blog.slug}`} className="group block">
                <article className="flex gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-violet-500/30 transition-all hover:shadow-md">
                  {blog.featuredImage && (
                    <div className="relative w-24 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <Image
                        src={blog.featuredImage}
                        alt={blog.title}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {blog.category && (
                      <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-1 block">
                        {blog.category.name}
                      </span>
                    )}
                    <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-1">
                      {blog.title}
                    </h3>
                    {blog.excerpt && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{blog.excerpt}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span>{formatRelativeDate(blog.publishedAt || new Date())}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{blog.readingTime || 1}m</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{(blog.views || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
