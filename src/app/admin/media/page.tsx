'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/Spinner';
import { ConfirmModal } from '@/components/ui/Modal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Trash2, Copy, Image as ImageIcon } from 'lucide-react';

async function fetchMedia() {
  const res = await fetch('/api/upload/image');
  if (!res.ok) return { data: [] };
  return res.json();
}

export default function MediaPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDragging, setIsDragging] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ['media'], queryFn: fetchMedia });
  const deleteMutation = useMutation({
    mutationFn: async (publicId: string) => {
      const res = await fetch('/api/upload/image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId }),
      });
      if (!res.ok) throw new Error('Delete failed');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['media'] }),
  });

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload/image', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      toast.success('Image uploaded successfully!');
      queryClient.invalidateQueries({ queryKey: ['media'] });
    } catch {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    files.forEach((f) => uploadFile(f));
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((f) => uploadFile(f));
    e.target.value = '';
  };

  const media = data?.data?.media || [];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Media Library</h1>
          <p className="text-sm text-slate-400">Manage your uploaded images</p>
        </div>
        <label>
          <span className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-700 cursor-pointer transition-all">
            <Upload className="w-4 h-4" /> Upload Image
          </span>
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileInput} />
        </label>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          isDragging ? 'border-violet-500 bg-violet-500/10' : 'border-slate-700 hover:border-slate-600'
        }`}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Uploading...</p>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Drag & drop images here, or{' '}
              <label className="text-violet-400 cursor-pointer hover:text-violet-300">
                browse
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileInput} />
              </label>
            </p>
            <p className="text-xs text-slate-600 mt-1">JPEG, PNG, WebP, GIF up to 10MB</p>
          </>
        )}
      </div>

      {/* Media Grid */}
      {isLoading ? (
        <LoadingScreen />
      ) : media.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <ImageIcon className="w-12 h-12 mb-3 opacity-30" />
          <p>No media uploaded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {media.map((item: { publicId: string; url: string; format: string; width: number; height: number; bytes: number }) => (
            <div key={item.publicId} className="group relative aspect-square bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-slate-600 transition-colors">
              <Image
                src={item.url}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 16vw"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(item.url);
                    toast.info('URL copied!');
                  }}
                  className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteId(item.publicId)}
                  className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs text-white/70 truncate">{item.format.toUpperCase()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId) {
            await deleteMutation.mutateAsync(deleteId);
            setDeleteId(null);
            toast.success('Image deleted');
          }
        }}
        title="Delete Image"
        description="This image will be permanently deleted from Cloudinary."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
