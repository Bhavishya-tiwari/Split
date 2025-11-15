/**
 * React Query hooks for Payments
 *
 * Provides:
 * - Automatic caching
 * - Loading/error states
 * - Background refetching
 * - Cache invalidation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Query Keys
export const paymentKeys = {
  all: ['payments'] as const,
  group: (groupId: string) => [...paymentKeys.all, 'group', groupId] as const,
};

export interface Payment {
  id: string;
  group_id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  created_by: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentData {
  from_user_id: string;
  to_user_id: string;
  amount: number;
  notes?: string;
}

/**
 * Hook to fetch payments for a group
 */
export function usePayments(groupId: string) {
  return useQuery<Payment[]>({
    queryKey: paymentKeys.group(groupId),
    queryFn: async () => {
      const response = await fetch(`/api/groups/${groupId}/payments`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Failed to fetch payments';
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data.payments || [];
    },
    staleTime: 60 * 1000, // Consider data fresh for 1 minute
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: true,
    enabled: !!groupId,
  });
}

/**
 * Hook to create a payment
 */
export function useCreatePayment(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePaymentData) => {
      const response = await fetch(`/api/groups/${groupId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create payment');
      }

      const result = await response.json();
      return result.payment as Payment;
    },
    onSuccess: async () => {
      // Invalidate payments cache
      await queryClient.invalidateQueries({
        queryKey: paymentKeys.group(groupId),
        refetchType: 'active',
      });

      // CRITICAL: Force refetch settlements immediately by invalidating and refetching
      // Use exact query key from settlementKeys.group(groupId)
      const settlementQueryKey = ['settlements', 'group', groupId];
      
      // Invalidate all settlement-related queries
      await queryClient.invalidateQueries({
        queryKey: settlementQueryKey,
        refetchType: 'active',
      });
      
      // Also invalidate with partial match to catch all variations
      await queryClient.invalidateQueries({
        queryKey: ['settlements'],
        refetchType: 'active',
      });

      // Force immediate refetch of active settlement queries
      await queryClient.refetchQueries({
        queryKey: settlementQueryKey,
        type: 'active',
      });
    },
  });
}

/**
 * Helper hook to invalidate payments cache
 */
export function useInvalidatePayments() {
  const queryClient = useQueryClient();

  return (groupId: string) => {
    queryClient.invalidateQueries({ queryKey: paymentKeys.group(groupId) });
    // Also invalidate settlements when payments change
    queryClient.invalidateQueries({ queryKey: ['settlements', 'group', groupId] });
    queryClient.invalidateQueries({ queryKey: ['settlements', 'user', groupId] });
  };
}

