'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAdminBlogs, useDeleteBlog } from '@/hooks/useBlogs';
import { BlogStatusBadge } from '@/components/admin/blog/TaskStatusBadge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmModal } from '@/components/ui/Modal';
import { LoadingScreen } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDate } from '@/utils/date';
import {
  Plus, Search, Edit, Trash2, Eye, Bot, Copy, Filter,
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
];

export default function BlogsPage() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, isError } = useAdminBlogs({
    page,
    limit: 10,
    status: status || 'all',  // 'all' = no status filter, show drafts + published + archived
    search: debouncedSearch || undefined,
  });

  const deleteMutation = useDeleteBlog();

  const blogs = data?.data || [];
  const pagination = data?.pagination;

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success('Blog deleted successfully');
      setDeleteId(null);
    } catch {
      toast.error('Failed to delete blog');
    }
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Blog Posts</h1>
          <p className="text-sm text-slate-400">Manage your blog content</p>
        </div>
        <Link href="/admin/blogs/new">
          <Button leftIcon={<Plus className="w-4 h-4" />}>New Blog</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search blogs..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            leftIcon={<Search className="w-4 h-4" />}
            containerClassName="flex-1"
          />
          <Select
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            containerClassName="w-full sm:w-44"
          />
          <Button variant="outline" leftIcon={<Filter className="w-4 h-4" />} size="md">
            Filters
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <LoadingScreen text="Loading blogs..." />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <p className="font-medium text-red-400">Failed to load blogs</p>
            <p className="text-sm mt-1">Please refresh the page</p>
          </div>
        ) : blogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Bot className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium">No blogs found</p>
            <p className="text-sm mt-1">Create your first blog post or generate one with AI</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Title</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3 hidden md:table-cell">Category</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3 hidden lg:table-cell">Status</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3 hidden lg:table-cell">Views</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3 hidden xl:table-cell">Published</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {blogs.map((blog: {
                  _id: string;
                  title: string;
                  slug: string;
                  status: string;
                  aiGenerated: boolean;
                  category?: { name: string };
                  views?: number;
                  publishedAt?: string;
                }) => (
                  <tr key={blog._id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {blog.aiGenerated && (
                          <span title="AI Generated" className="flex-shrink-0">
                            <Bot className="w-3.5 h-3.5 text-violet-400" />
                          </span>
                        )}
                        <Link
                          href={`/admin/blogs/${blog._id}`}
                          className="text-sm font-medium text-slate-200 hover:text-white truncate max-w-xs"
                        >
                          {blog.title}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-slate-400">{blog.category?.name || '—'}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <BlogStatusBadge status={blog.status} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-slate-400">{(blog.views || 0).toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-sm text-slate-500">
                        {blog.publishedAt ? formatDate(blog.publishedAt) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/blog/${blog.slug}`} target="_blank">
                          <button className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>
                        <Link href={`/admin/blogs/${blog._id}`}>
                          <button className="p-1.5 rounded-lg text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() => {
                            void navigator.clipboard.writeText(`/blog/${blog.slug}`);
                            toast.info('Slug copied to clipboard');
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(blog._id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-800">
            <Pagination pagination={pagination} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Blog Post"
        description="This action cannot be undone. The blog post will be permanently deleted."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
