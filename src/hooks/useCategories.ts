import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = '/api/categories';

async function fetchCategories() {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

async function createCategory(data: Record<string, unknown>) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Failed to create category');
  }
  return res.json();
}

async function updateCategory(id: string, data: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update category');
  return res.json();
}

async function deleteCategory(id: string, force = false) {
  const res = await fetch(`${API_BASE}/${id}?force=${force}`, { method: 'DELETE' });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Failed to delete category');
  }
  return res.json();
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      updateCategory(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) => deleteCategory(id, force),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });
}
