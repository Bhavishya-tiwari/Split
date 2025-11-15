/**
 * React Query hooks for Settlements
 *
 * Provides:
 * - Automatic caching
 * - Loading/error states
 * - Background refetching
 * - Cache invalidation
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';

// Query Keys
export const settlementKeys = {
  all: ['settlements'] as const,
  group: (groupId: string) => [...settlementKeys.all, 'group', groupId] as const,
  user: (groupId: string, userId: string) =>
    [...settlementKeys.all, 'user', groupId, userId] as const,
};

export interface UserDebt {
  user_id: string;
  user_name: string;
  amount: number;
}

export interface SettlementsResponse {
  user_id: string;
  total_paid: number;
  total_owed: number;
  net_balance: number;
  owes_to: UserDebt[];
  owed_by: UserDebt[];
  computed_at: string;
}

/**
 * Hook to fetch user's balance for a group
 *
 * Features:
 * - Automatic caching (1 minute stale time)
 * - Automatic refetch on window focus
 * - Loading and error states
 */
export function useSettlements(groupId: string) {
  return useQuery<SettlementsResponse>({
    queryKey: settlementKeys.group(groupId),
    queryFn: async () => {
      const response = await fetch(`/api/groups/${groupId}/settlements`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.details || 'Failed to fetch balance';
        throw new Error(errorMessage);
      }

      return response.json();
    },
    staleTime: 0, // Always consider data stale - refetch immediately when invalidated
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true, // Always refetch when component mounts
    enabled: !!groupId, // Only run if groupId exists
  });
}

/**
 * Helper hook to invalidate settlements cache
 * Call this after creating/updating/deleting expenses or payments
 */
export function useInvalidateSettlements() {
  const queryClient = useQueryClient();

  return async (groupId: string) => {
    const settlementQueryKey = settlementKeys.group(groupId);
    // Invalidate all settlement queries
    await queryClient.invalidateQueries({ 
      queryKey: settlementQueryKey,
      refetchType: 'active'
    });
    await queryClient.invalidateQueries({ 
      queryKey: ['settlements'],
      refetchType: 'active'
    });
    // Force immediate refetch
    await queryClient.refetchQueries({
      queryKey: settlementQueryKey,
      type: 'active',
    });
  };
}
