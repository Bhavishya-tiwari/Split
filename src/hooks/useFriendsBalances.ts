/**
 * React Query hooks for Friends Balances
 *
 * Provides:
 * - Automatic caching
 * - Loading/error states
 * - Background refetching
 * - Cache invalidation
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';

// Query Keys
export const friendsBalanceKeys = {
  all: ['friendsBalances'] as const,
  user: (userId: string) => [...friendsBalanceKeys.all, 'user', userId] as const,
};

export interface UserDebt {
  user_id: string;
  user_name: string;
  amount: number;
}

export interface FriendsBalanceResponse {
  user_id: string;
  total_paid: number;
  total_owed: number;
  net_balance: number;
  owes_to: UserDebt[];
  owed_by: UserDebt[];
  computed_at: string;
}

/**
 * Hook to fetch user's total balances across all groups
 *
 * Features:
 * - Automatic caching (1 minute stale time)
 * - Automatic refetch on window focus
 * - Loading and error states
 */
export function useFriendsBalances() {
  return useQuery<FriendsBalanceResponse>({
    queryKey: friendsBalanceKeys.all,
    queryFn: async () => {
      const response = await fetch('/api/friends');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.details || 'Failed to fetch balances';
        throw new Error(errorMessage);
      }

      return response.json();
    },
    staleTime: 0, // Always consider data stale - refetch immediately when invalidated
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true, // Always refetch when component mounts
  });
}

/**
 * Helper hook to invalidate friends balances cache
 * Call this after creating/updating/deleting expenses or payments
 */
export function useInvalidateFriendsBalances() {
  const queryClient = useQueryClient();

  return async () => {
    // Invalidate all friends balance queries
    await queryClient.invalidateQueries({ 
      queryKey: friendsBalanceKeys.all,
      refetchType: 'active'
    });
    // Force immediate refetch
    await queryClient.refetchQueries({
      queryKey: friendsBalanceKeys.all,
      type: 'active',
    });
  };
}

