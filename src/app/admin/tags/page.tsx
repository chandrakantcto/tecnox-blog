'use client';

import { useState } from 'react';
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from '@/hooks/useTags';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { LoadingScreen } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { generateSlug } from '@/utils/slug';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';

export default function TagsPage() {
  const { toast } = useToast();
  const { data, isLoading } = useTags();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<{ _id: string; name: string; slug: string } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  const tags = data?.data || [];

  const handleCreate = async () => {
    if (!name) { toast.error('Name is required'); return; }
    try {
      await createTag.mutateAsync({ name, slug: slug || generateSlug(name) });
      toast.success('Tag created!');
      setIsCreateOpen(false);
      setName(''); setSlug('');
    } catch (error) {
      toast.error('Failed to create tag', error instanceof Error ? error.message : undefined);
    }
  };

  const handleUpdate = async () => {
    if (!editingTag) return;
    try {
      await updateTag.mutateAsync({ id: editingTag._id, data: { name, slug } });
      toast.success('Tag updated!');
      setEditingTag(null);
    } catch (error) {
      toast.error('Failed to update tag', error instanceof Error ? error.message : undefined);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTag.mutateAsync(deleteId);
      toast.success('Tag deleted!');
      setDeleteId(null);
    } catch { toast.error('Failed to delete tag'); }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Tags</h1>
          <p className="text-sm text-slate-400">Manage content tags</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => { setName(''); setSlug(''); setIsCreateOpen(true); }}>
          New Tag
        </Button>
      </div>

      {isLoading ? <LoadingScreen /> : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {tags.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Tag className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium">No tags yet</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3 p-5">
              {tags.map((tag: { _id: string; name: string; slug: string; blogCount?: number }) => (
                <div
                  key={tag._id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full group hover:bg-slate-700 transition-colors"
                >
                  <span className="text-sm text-slate-200">{tag.name}</span>
                  <Badge variant="default" size="sm">{tag.blogCount || 0}</Badge>
                  <div className="flex gap-1 ml-1">
                    <button
                      onClick={() => {
                        setEditingTag(tag);
                        setName(tag.name);
                        setSlug(tag.slug);
                      }}
                      className="text-slate-500 hover:text-violet-400 transition-colors"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setDeleteId(tag._id)}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Tag"
        footer={<div className="flex gap-3 justify-end"><Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button><Button loading={createTag.isPending} onClick={handleCreate}>Create</Button></div>}
      >
        <div className="space-y-4">
          <Input label="Tag Name" required placeholder="e.g. JavaScript" value={name} onChange={(e) => { setName(e.target.value); if (!slug) setSlug(generateSlug(e.target.value)); }} />
          <Input label="Slug" placeholder="e.g. javascript" value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
      </Modal>

      <Modal isOpen={!!editingTag} onClose={() => setEditingTag(null)} title="Edit Tag"
        footer={<div className="flex gap-3 justify-end"><Button variant="outline" onClick={() => setEditingTag(null)}>Cancel</Button><Button loading={updateTag.isPending} onClick={handleUpdate}>Save</Button></div>}
      >
        <div className="space-y-4">
          <Input label="Tag Name" required value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
      </Modal>

      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Tag" description="This tag will be removed from all blogs." confirmLabel="Delete" loading={deleteTag.isPending} />
    </div>
  );
}
