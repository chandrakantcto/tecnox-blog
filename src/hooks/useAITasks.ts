import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AITaskQueryParams } from '@/types/api.types';

const API_BASE = '/api/ai-tasks';

async function fetchAITasks(params: AITaskQueryParams) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  const res = await fetch(`${API_BASE}?${searchParams}`);
  if (!res.ok) throw new Error('Failed to fetch AI tasks');
  return res.json();
}

async function fetchAITask(id: string) {
  const res = await fetch(`${API_BASE}/${id}`);
  if (!res.ok) throw new Error('Task not found');
  return res.json();
}

async function createAITask(data: Record<string, unknown>) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'Failed to create task');
  }
  return res.json();
}

async function retryTask(id: string) {
  const res = await fetch(`${API_BASE}/${id}/retry`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to retry task');
  return res.json();
}

async function deleteTask(id: string) {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete task');
  return res.json();
}

async function runAllPending() {
  const res = await fetch(`${API_BASE}/run`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to run tasks');
  return res.json();
}

export function useAITasks(params: AITaskQueryParams = {}) {
  return useQuery({
    queryKey: ['ai-tasks', params],
    queryFn: () => fetchAITasks(params),
  });
}

export function useAITask(id: string) {
  return useQuery({
    queryKey: ['ai-task', id],
    queryFn: () => fetchAITask(id),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = (query.state.data as { data?: { status?: string } } | undefined)?.data?.status;
      return status === 'processing' || status === 'pending' ? 5000 : false;
    },
  });
}

export function useCreateAITask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAITask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-tasks'] }),
  });
}

export function useRetryAITask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: retryTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-tasks'] }),
  });
}

export function useDeleteAITask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-tasks'] }),
  });
}

export function useRunAllPendingTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: runAllPending,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-tasks'] }),
  });
}
