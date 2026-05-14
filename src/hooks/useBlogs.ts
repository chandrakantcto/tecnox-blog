import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { BlogQueryParams } from '@/types/api.types';

// ── Public API (website) ──────────────────────────────────────────────────────
const PUBLIC_API  = '/api/blogs';

// ── Admin API (all statuses, ID-based) ────────────────────────────────────────
const ADMIN_API   = '/api/admin/blogs';

// ── Fetchers ──────────────────────────────────────────────────────────────────

async function fetchBlogs(params: BlogQueryParams, base = PUBLIC_API) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  const res = await fetch(`${base}?${searchParams}`);
  if (!res.ok) throw new Error('Failed to fetch blogs');
  return res.json();
}

async function fetchBlogBySlug(slug: string) {
  const res = await fetch(`${PUBLIC_API}/${slug}`);
  if (!res.ok) throw new Error('Blog not found');
  return res.json();
}

async function fetchBlogById(id: string) {
  const res = await fetch(`${ADMIN_API}/${id}`);
  if (!res.ok) throw new Error('Blog not found');
  return res.json();
}

async function createBlog(data: Record<string, unknown>) {
  const res = await fetch(ADMIN_API, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create blog');
  return res.json();
}

async function updateBlog(id: string, data: Record<string, unknown>) {
  const res = await fetch(`${ADMIN_API}/${id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update blog');
  return res.json();
}

async function deleteBlog(id: string) {
  const res = await fetch(`${ADMIN_API}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete blog');
  return res.json();
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** Public website listing — filtered to published only by default. */
export function useBlogs(params: BlogQueryParams = {}) {
  return useQuery({
    queryKey:        ['blogs', 'public', params],
    queryFn:         () => fetchBlogs(params, PUBLIC_API),
    staleTime:       30_000, // 30 s — avoids unnecessary refetch on back-nav
  });
}

/** Admin listing — all statuses, sorted by createdAt desc by default. */
export function useAdminBlogs(params: BlogQueryParams = {}) {
  return useQuery({
    queryKey:         ['blogs', 'admin', params],
    queryFn:          () => fetchBlogs({ ...params, status: params.status || 'all' }, ADMIN_API),
    staleTime:        10_000, // 10 s
    refetchOnMount:   true,   // always refresh when navigating back
  });
}

/** Fetch single blog by slug (public / website). */
export function useBlog(slug: string) {
  return useQuery({
    queryKey: ['blog', 'slug', slug],
    queryFn:  () => fetchBlogBySlug(slug),
    enabled:  !!slug,
  });
}

/** Fetch single blog by MongoDB ObjectId (admin detail/edit). */
export function useBlogById(id: string) {
  return useQuery({
    queryKey:       ['blog', 'id', id],
    queryFn:        () => fetchBlogById(id),
    enabled:        !!id && /^[a-f\d]{24}$/i.test(id),
    staleTime:      10_000,
    refetchOnMount: true,
  });
}

export function useCreateBlog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBlog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
    },
  });
}

export function useUpdateBlog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      updateBlog(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      queryClient.invalidateQueries({ queryKey: ['blog', 'id', id] });
    },
  });
}

export function useDeleteBlog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBlog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
    },
  });
}
