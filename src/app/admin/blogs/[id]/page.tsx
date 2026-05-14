'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useBlogById, useUpdateBlog, useDeleteBlog } from '@/hooks/useBlogs';
import { useCategories } from '@/hooks/useCategories';
import { useTags } from '@/hooks/useTags';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { BlogStatusBadge } from '@/components/admin/blog/TaskStatusBadge';
import { ConfirmModal } from '@/components/ui/Modal';
import { LoadingScreen } from '@/components/ui/Spinner';
import { generateSlug } from '@/utils/slug';
import { formatDate } from '@/utils/date';
import {
  Save, Eye, ArrowLeft, Trash2, ExternalLink,
  Clock, Bot, Calendar, RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface BlogFormData {
  title:            string;
  slug:             string;
  excerpt:          string;
  content:          string;
  category:         string;
  tags:             string;
  status:           'draft' | 'published' | 'archived';
  featuredImage:    string;
  metaTitle:        string;
  metaDescription:  string;
  isFeatured:       boolean;
}

export default function BlogDetailPage() {
  const params   = useParams<{ id: string }>();
  const router   = useRouter();
  const { toast }  = useToast();
  const id         = params.id;

  const [activeTab,    setActiveTab]    = useState<'content' | 'seo' | 'settings'>('content');
  const [deleteOpen,   setDeleteOpen]   = useState(false);

  const { data: blogData, isLoading, isError } = useBlogById(id);
  const { data: categoriesData }               = useCategories();
  const { data: tagsData }                     = useTags();
  const updateBlog  = useUpdateBlog();
  const deleteBlog  = useDeleteBlog();

  const blog       = blogData?.data;
  const categories = categoriesData?.data || [];
  const availableTags = tagsData?.data || [];

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isDirty } } =
    useForm<BlogFormData>({
      defaultValues: { status: 'draft', isFeatured: false },
    });

  // Populate form once blog data is loaded
  useEffect(() => {
    if (!blog) return;
    reset({
      title:           blog.title            || '',
      slug:            blog.slug             || '',
      excerpt:         blog.excerpt          || '',
      content:         blog.content          || '',
      category:        blog.category?._id    || blog.category || '',
      tags:            (blog.tags || []).join(', '),
      status:          blog.status           || 'draft',
      featuredImage:   blog.featuredImage    || '',
      metaTitle:       blog.seo?.metaTitle   || '',
      metaDescription: blog.seo?.metaDescription || '',
      isFeatured:      blog.isFeatured       || false,
    });
  }, [blog, reset]);

  const title = watch('title');

  const handleTitleBlur = () => {
    const currentSlug = watch('slug');
    if (!currentSlug && title) setValue('slug', generateSlug(title));
  };

  const onSubmit = async (data: BlogFormData) => {
    if (!data.content) { toast.error('Content is required'); return; }
    try {
      await updateBlog.mutateAsync({
        id,
        data: {
          title:        data.title,
          slug:         data.slug || generateSlug(data.title),
          excerpt:      data.excerpt,
          content:      data.content,
          category:     data.category,
          tags:         data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
          status:       data.status,
          featuredImage: data.featuredImage || undefined,
          isFeatured:   data.isFeatured,
          seo: {
            metaTitle:       data.metaTitle       || undefined,
            metaDescription: data.metaDescription || undefined,
          },
        },
      });
      toast.success('Blog updated successfully!');
    } catch (err) {
      toast.error('Failed to update blog', err instanceof Error ? err.message : undefined);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteBlog.mutateAsync(id);
      toast.success('Blog deleted');
      router.push('/admin/blogs');
    } catch {
      toast.error('Failed to delete blog');
    }
  };

  // ── Loading / error states ──────────────────────────────────────────────────

  if (isLoading) return <LoadingScreen text="Loading blog…" />;

  if (isError || !blog) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-64 gap-4">
        <p className="text-red-400 font-medium">Blog not found</p>
        <p className="text-slate-500 text-sm">ID: {id}</p>
        <Link href="/admin/blogs">
          <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Blogs
          </Button>
        </Link>
      </div>
    );
  }

  const categoryOptions = categories.map((c: { _id: string; name: string }) => ({
    value: c._id,
    label: c.name,
  }));

  const tabs = [
    { key: 'content',  label: 'Content'  },
    { key: 'seo',      label: 'SEO'      },
    { key: 'settings', label: 'Settings' },
  ] as const;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/blogs">
          <button className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-white truncate">{blog.title}</h1>
            <BlogStatusBadge status={blog.status} />
            {blog.aiGenerated && (
              <span className="flex items-center gap-1 text-xs text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">
                <Bot className="w-3 h-3" /> AI Generated
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">ID: {id}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {blog.slug && (
            <Link href={`/blog/${blog.slug}`} target="_blank">
              <Button variant="ghost" size="sm" leftIcon={<ExternalLink className="w-4 h-4" />}>
                View
              </Button>
            </Link>
          )}
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Trash2 className="w-4 h-4" />}
            className="text-red-400 border-red-400/30 hover:bg-red-500/10"
            onClick={() => setDeleteOpen(true)}
          >
            Delete
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            loading={updateBlog.isPending}
            leftIcon={<Save className="w-4 h-4" />}
            disabled={!isDirty && !updateBlog.isPending}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* Meta strip */}
      <div className="flex flex-wrap gap-4 mb-6 text-xs text-slate-500">
        {blog.createdAt && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Created {formatDate(blog.createdAt)}
          </span>
        )}
        {blog.publishedAt && (
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            Published {formatDate(blog.publishedAt)}
          </span>
        )}
        {blog.updatedAt && (
          <span className="flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" />
            Updated {formatDate(blog.updatedAt)}
          </span>
        )}
        {blog.readingTime && (
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {blog.readingTime} min read
          </span>
        )}
        <span>{(blog.views || 0).toLocaleString()} views</span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── Main content ──────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">
            <Input
              label="Title"
              placeholder="Blog title…"
              error={errors.title?.message}
              {...register('title', { required: 'Title is required', minLength: { value: 5, message: 'Too short' } })}
              onBlur={handleTitleBlur}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Slug</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="auto-generated-from-title"
                  className="flex-1 h-9 px-3 text-sm bg-slate-900 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  {...register('slug')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setValue('slug', generateSlug(title || ''), { shouldDirty: true })}
                >
                  Regenerate
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="flex border-b border-slate-800">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                      activeTab === tab.key
                        ? 'text-violet-400 border-b-2 border-violet-400 bg-violet-500/5'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {activeTab === 'content' && (
                  <div className="space-y-4">
                    <Textarea
                      label="Excerpt"
                      placeholder="Brief summary…"
                      rows={3}
                      {...register('excerpt')}
                    />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-slate-300">Content *</label>
                      <textarea
                        placeholder="Write blog content here… (HTML supported)"
                        rows={22}
                        className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y font-mono"
                        {...register('content', { required: 'Content is required' })}
                      />
                      {errors.content && <p className="text-xs text-red-400">{errors.content.message}</p>}
                    </div>
                  </div>
                )}

                {activeTab === 'seo' && (
                  <div className="space-y-4">
                    <Input
                      label="Meta Title"
                      placeholder="SEO meta title (max 60 chars)"
                      hint="Recommended: 50–60 characters"
                      {...register('metaTitle')}
                    />
                    <Textarea
                      label="Meta Description"
                      placeholder="SEO meta description (max 160 chars)"
                      hint="Recommended: 140–160 characters"
                      rows={3}
                      {...register('metaDescription')}
                    />
                    <Input
                      label="Featured Image URL"
                      placeholder="https://res.cloudinary.com/…"
                      {...register('featuredImage')}
                    />
                    {watch('featuredImage') && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={watch('featuredImage')}
                        alt="Featured preview"
                        className="mt-2 rounded-lg border border-slate-700 max-h-48 object-cover w-full"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="isFeatured"
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-violet-600 focus:ring-violet-500"
                        {...register('isFeatured')}
                      />
                      <label htmlFor="isFeatured" className="text-sm text-slate-300">
                        Feature this post on homepage
                      </label>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-slate-300">Tags</label>
                      <input
                        type="text"
                        placeholder="tag1, tag2, tag3"
                        className="h-9 px-3 text-sm bg-slate-900 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        {...register('tags')}
                      />
                      {availableTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {availableTags.slice(0, 20).map((tag: { slug: string; name: string }) => (
                            <button
                              key={tag.slug}
                              type="button"
                              onClick={() => {
                                const current = watch('tags');
                                const existing = current ? current.split(',').map((t) => t.trim()) : [];
                                if (!existing.includes(tag.slug)) {
                                  setValue('tags', [...existing, tag.slug].join(', '), { shouldDirty: true });
                                }
                              }}
                              className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
                            >
                              {tag.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Read-only metadata */}
                    <div className="mt-4 pt-4 border-t border-slate-800 space-y-2 text-xs text-slate-500">
                      <p><span className="text-slate-400">Blog ID:</span> {id}</p>
                      {blog.author && (
                        <p>
                          <span className="text-slate-400">Author:</span>{' '}
                          {(blog.author as { name?: string; email?: string }).name || (blog.author as { email?: string }).email || String(blog.author)}
                        </p>
                      )}
                      {blog.difyWorkflowId && (
                        <p><span className="text-slate-400">Dify Workflow:</span> {blog.difyWorkflowId}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Sidebar ───────────────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Publish */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
              <h3 className="text-sm font-semibold text-white">Publish</h3>
              <Select
                label="Status"
                options={[
                  { value: 'draft',     label: 'Draft'     },
                  { value: 'published', label: 'Published' },
                  { value: 'archived',  label: 'Archived'  },
                ]}
                {...register('status')}
              />
              <Button
                type="submit"
                fullWidth
                loading={updateBlog.isPending}
                leftIcon={<Save className="w-4 h-4" />}
                disabled={!isDirty && !updateBlog.isPending}
              >
                {watch('status') === 'published' ? 'Update & Publish' : 'Save Draft'}
              </Button>
            </div>

            {/* Category */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
              <h3 className="text-sm font-semibold text-white">Category</h3>
              <Select
                options={[{ value: '', label: 'Select category…' }, ...categoryOptions]}
                error={errors.category?.message}
                {...register('category')}
              />
            </div>

            {/* Stats */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white">Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-white">{(blog.views || 0).toLocaleString()}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Views</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-white">{(blog.likes || 0).toLocaleString()}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Likes</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-white">{blog.readingTime || 1}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Min Read</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-white">{blog.isFeatured ? '★' : '—'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Featured</p>
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
              <h3 className="text-sm font-semibold text-white mb-3">Quick Links</h3>
              {blog.slug && (
                <Link href={`/blog/${blog.slug}`} target="_blank"
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-violet-400 transition-colors">
                  <Eye className="w-4 h-4" /> View on website
                </Link>
              )}
              {blog.aiTaskId && (
                <Link href={`/admin/ai-tasks/${String(blog.aiTaskId)}`}
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-violet-400 transition-colors">
                  <Bot className="w-4 h-4" /> View AI Task
                </Link>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Blog Post"
        description={`Permanently delete "${blog.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteBlog.isPending}
      />
    </div>
  );
}
