import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DYNAMIC_QUERY_CONFIG } from '@/lib/config/query-config';

// Query keys for cache management
export const competitorKeys = {
  all: ['competitors'] as const,
  list: () => [...competitorKeys.all, 'list'] as const,
  detail: (id: number) => [...competitorKeys.all, 'detail', id] as const,
};

// Fetch all competitors
export function useCompetitors() {
  return useQuery({
    queryKey: competitorKeys.list(),
    queryFn: async () => {
      const res = await fetch('/api/competitors');
      if (!res.ok) throw new Error('Failed to fetch competitors');
      return res.json();
    },
    ...DYNAMIC_QUERY_CONFIG,
  });
}

// Fetch single competitor
export function useCompetitor(id: number) {
  return useQuery({
    queryKey: competitorKeys.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/competitors/${id}`);
      if (!res.ok) throw new Error('Failed to fetch competitor');
      return res.json();
    },
    enabled: !!id, // Only fetch if id exists
  });
}

// Create competitor mutation
export function useCreateCompetitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; url: string; crawlFrequencyMinutes: number }) => {
      const res = await fetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create competitor');
      }
      return res.json();
    },
    // Automatically refetch competitors list after creation
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: competitorKeys.list() });
    },
  });
}

// Update competitor mutation
export function useUpdateCompetitor(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<{ name: string; url: string; crawlFrequencyMinutes: number; isActive: boolean }>) => {
      const res = await fetch(`/api/competitors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update competitor');
      }
      return res.json();
    },
    // Invalidate both list and detail caches
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: competitorKeys.list() });
      queryClient.invalidateQueries({ queryKey: competitorKeys.detail(id) });
    },
  });
}

// Delete competitor mutation
export function useDeleteCompetitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/competitors/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete competitor');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: competitorKeys.list() });
    },
  });
}
