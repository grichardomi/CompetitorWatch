import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STATIC_QUERY_CONFIG } from '@/lib/config/query-config';

export const businessKeys = {
  all: ['business'] as const,
  detail: () => [...businessKeys.all, 'detail'] as const,
};

// Fetch business data
export function useBusiness() {
  return useQuery({
    queryKey: businessKeys.detail(),
    queryFn: async () => {
      const res = await fetch('/api/business');
      if (!res.ok) throw new Error('Failed to fetch business');
      return res.json();
    },
    ...STATIC_QUERY_CONFIG,
  });
}

// Update business mutation
export function useUpdateBusiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name?: string; location?: string }) => {
      const res = await fetch('/api/business', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update business');
      }
      return res.json();
    },
    // Update cache optimistically
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: businessKeys.detail() });

      // Snapshot previous value
      const previousBusiness = queryClient.getQueryData(businessKeys.detail());

      // Optimistically update cache
      queryClient.setQueryData(businessKeys.detail(), (old: any) => ({
        ...old,
        ...newData,
      }));

      return { previousBusiness };
    },
    // On error, roll back to previous value
    onError: (_err, _newData, context) => {
      queryClient.setQueryData(businessKeys.detail(), context?.previousBusiness);
    },
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: businessKeys.detail() });
    },
  });
}

// Update business industry mutation
export function useUpdateBusinessIndustry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { newIndustry: string; confirmed: boolean }) => {
      const res = await fetch('/api/business/industry', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update industry');
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate business cache
      queryClient.invalidateQueries({ queryKey: businessKeys.detail() });
    },
  });
}
