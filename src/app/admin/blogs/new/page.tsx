'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useCreateBlog } from '@/hooks/useBlogs';
import { useCategories } from '@/hooks/useCategories';
import { useTags } from '@/hooks/useTags';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { generateSlug } from '@/utils/slug';
import { Save, Eye, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface BlogFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string;
  status: 'draft' | 'published';
  featuredImage: string;
  metaTitle: string;
  metaDescription: string;
  isFeatured: boolean;
}

export default function NewBlogPage() {
  const router = useRouter();
  const { toast } = useToast();
  const createBlog = useCreateBlog();
  const { data: categoriesData } = useCategories();
  const { data: tagsData } = useTags();
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'settings'>('content');

  const categories = categoriesData?.data || [];
  const availableTags = tagsData?.data || [];

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<BlogFormData>({
    defaultValues: {
      status: 'draft',
      isFeatured: false,
    },
  });

  const title = watch('title');

  const handleTitleBlur = () => {
    const currentSlug = watch('slug');
    if (!currentSlug && title) {
      setValue('slug', generateSlug(title));
    }
  };

  const onSubmit = async (data: BlogFormData) => {
    if (!data.content) {
      toast.error('Content is required');
      return;
    }

    try {
      await createBlog.mutateAsync({
        title: data.title,
        slug: data.slug || generateSlug(data.title),
        excerpt: data.excerpt,
        content: data.content,
        category: data.category,
        tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        status: data.status,
        featuredImage: data.featuredImage || undefined,
        isFeatured: data.isFeatured,
        seo: {
          metaTitle: data.metaTitle || undefined,
          metaDescription: data.metaDescription || undefined,
        },
      });
      toast.success('Blog created successfully!');
      router.push('/admin/blogs');
    } catch (error) {
      toast.error('Failed to create blog', error instanceof Error ? error.message : undefined);
    }
  };

  const categoryOptions = categories.map((c: { _id: string; name: string }) => ({
    value: c._id,
    label: c.name,
  }));

  const tabs = [
    { key: 'content', label: 'Content' },
    { key: 'seo', label: 'SEO' },
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
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">New Blog Post</h1>
          <p className="text-sm text-slate-400">Create a new blog article</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" leftIcon={<Eye className="w-4 h-4" />}>
            Preview
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            loading={createBlog.isPending}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {watch('status') === 'published' ? 'Publish' : 'Save Draft'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-5">
            <Input
              label="Title"
              placeholder="Enter blog title..."
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
                  onClick={() => setValue('slug', generateSlug(title || ''))}
                >
                  Generate
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
                      placeholder="Brief summary of your blog post..."
                      rows={3}
                      {...register('excerpt')}
                    />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-slate-300">Content *</label>
                      <textarea
                        placeholder="Write your blog content here... (HTML supported)"
                        rows={20}
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
                      hint="Recommended: 50-60 characters"
                      {...register('metaTitle')}
                    />
                    <Textarea
                      label="Meta Description"
                      placeholder="SEO meta description (max 160 chars)"
                      hint="Recommended: 140-160 characters"
                      rows={3}
                      {...register('metaDescription')}
                    />
                    <Input
                      label="Featured Image URL"
                      placeholder="https://res.cloudinary.com/..."
                      {...register('featuredImage')}
                    />
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
                                const tags = current ? current.split(',').map((t) => t.trim()) : [];
                                if (!tags.includes(tag.slug)) {
                                  setValue('tags', [...tags, tag.slug].join(', '));
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
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
              <h3 className="text-sm font-semibold text-white">Publish</h3>
              <Select
                label="Status"
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'published', label: 'Published' },
                  { value: 'archived', label: 'Archived' },
                ]}
                {...register('status')}
              />
              <Button
                type="submit"
                fullWidth
                loading={createBlog.isPending}
                leftIcon={<Save className="w-4 h-4" />}
              >
                {watch('status') === 'published' ? 'Publish Now' : 'Save Draft'}
              </Button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
              <h3 className="text-sm font-semibold text-white">Category *</h3>
              <Select
                options={[{ value: '', label: 'Select category...' }, ...categoryOptions]}
                error={errors.category?.message}
                {...register('category', { required: 'Category is required' })}
              />
              {categories.length === 0 && (
                <p className="text-xs text-amber-400">
                  No categories yet.{' '}
                  <Link href="/admin/categories" className="underline">Create one</Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
