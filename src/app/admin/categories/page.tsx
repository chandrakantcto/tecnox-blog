'use client';

import { useState } from 'react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { LoadingScreen } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { generateSlug } from '@/utils/slug';
import { Plus, Edit, Trash2, FolderOpen } from 'lucide-react';

interface CategoryForm {
  name: string;
  slug: string;
  description: string;
  color: string;
}

export default function CategoriesPage() {
  const { toast } = useToast();
  const { data, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ _id: string; name: string; slug: string; description?: string; color?: string } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>({ name: '', slug: '', description: '', color: '#8b5cf6' });

  const categories = data?.data || [];

  const resetForm = () => setForm({ name: '', slug: '', description: '', color: '#8b5cf6' });

  const handleCreate = async () => {
    if (!form.name) { toast.error('Name is required'); return; }
    try {
      await createCategory.mutateAsync({
        name: form.name,
        slug: form.slug || generateSlug(form.name),
        description: form.description || undefined,
        color: form.color,
        isActive: true,
      });
      toast.success('Category created!');
      setIsCreateOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to create category', error instanceof Error ? error.message : undefined);
    }
  };

  const handleUpdate = async () => {
    if (!editingCategory) return;
    try {
      await updateCategory.mutateAsync({
        id: editingCategory._id,
        data: {
          name: form.name,
          slug: form.slug,
          description: form.description || undefined,
          color: form.color,
        },
      });
      toast.success('Category updated!');
      setEditingCategory(null);
      resetForm();
    } catch (error) {
      toast.error('Failed to update category', error instanceof Error ? error.message : undefined);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCategory.mutateAsync({ id: deleteId });
      toast.success('Category deleted!');
      setDeleteId(null);
    } catch (error) {
      toast.error('Failed to delete', error instanceof Error ? error.message : undefined);
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Categories</h1>
          <p className="text-sm text-slate-400">Organize your blog content</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => { resetForm(); setIsCreateOpen(true); }}>
          New Category
        </Button>
      </div>

      {isLoading ? (
        <LoadingScreen />
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-slate-900 border border-slate-800 rounded-xl text-slate-500">
          <FolderOpen className="w-12 h-12 mb-3 opacity-30" />
          <p className="font-medium">No categories yet</p>
          <Button leftIcon={<Plus className="w-4 h-4" />} className="mt-4" onClick={() => { resetForm(); setIsCreateOpen(true); }}>
            Create First Category
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((cat: { _id: string; name: string; slug: string; description?: string; color?: string; blogCount?: number; isActive?: boolean }) => (
            <div key={cat._id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color || '#8b5cf6' }}
                  />
                  <h3 className="font-semibold text-white">{cat.name}</h3>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingCategory(cat);
                      setForm({ name: cat.name, slug: cat.slug, description: cat.description || '', color: cat.color || '#8b5cf6' });
                    }}
                    className="p-1 rounded text-slate-500 hover:text-violet-400 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteId(cat._id)}
                    className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {cat.description && (
                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{cat.description}</p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-mono">{cat.slug}</span>
                <Badge variant="default" size="sm">{cat.blogCount || 0} posts</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Category"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button loading={createCategory.isPending} onClick={handleCreate}>Create</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Name" required placeholder="e.g. Technology"
            value={form.name}
            onChange={(e) => {
              setForm((f) => ({ ...f, name: e.target.value }));
              if (!form.slug) setForm((f) => ({ ...f, slug: generateSlug(e.target.value) }));
            }}
          />
          <Input
            label="Slug" placeholder="e.g. technology"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          />
          <Textarea
            label="Description" placeholder="Brief description..."
            rows={2}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                className="h-9 w-20 rounded-lg cursor-pointer border border-slate-700 bg-slate-900"
              />
              <span className="text-sm text-slate-400 font-mono">{form.color}</span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        title="Edit Category"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setEditingCategory(null)}>Cancel</Button>
            <Button loading={updateCategory.isPending} onClick={handleUpdate}>Save Changes</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input label="Slug" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
          <Textarea label="Description" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Color</label>
            <input type="color" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} className="h-9 w-20 rounded-lg cursor-pointer border border-slate-700 bg-slate-900" />
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        description="This category will be deleted. Blogs using it will need to be reassigned."
        confirmLabel="Delete"
        loading={deleteCategory.isPending}
      />
    </div>
  );
}
