/**
 * React Query hooks for Expenses
 *
 * Provides:
 * - Automatic caching with pagination
 * - Loading/error states
 * - Optimistic updates
 * - Cache invalidation
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { groupKeys } from './useGroups';

// Query Keys
export const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  list: (groupId: string, page: number = 1) => [...expenseKeys.lists(), groupId, page] as const,
  details: () => [...expenseKeys.all, 'detail'] as const,
  detail: (id: string) => [...expenseKeys.details(), id] as const,
};

export interface Expense {
  id: string;
  title: string;
  group_id: string;
  currency: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  created_by_profile: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  expense_payers: Array<{
    id: string;
    amount: number;
    paid_by: string;
    payer_profile: {
      id: string;
      full_name: string;
      email: string;
    } | null;
  }>;
  expense_splits: Array<{
    id: string;
    user_id: string;
    amount: number;
    split_type: string;
    percentage: number | null;
    shares: number | null;
    split_user_profile: {
      id: string;
      full_name: string;
      email: string;
    } | null;
  }>;
}

export interface ExpensesResponse {
  expenses: Expense[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Fetch expenses for a group with pagination
 * Uses keepPreviousData to show old data while fetching new page
 */
export function useExpenses(groupId: string, page: number = 1, limit: number = 50) {
  return useQuery({
    queryKey: expenseKeys.list(groupId, page),
    queryFn: async () => {
      const url = `/api/groups/${groupId}/expenses?page=${page}&limit=${limit}`;
      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch expenses');
      }

      return response.json() as Promise<ExpensesResponse>;
    },
    staleTime: 30 * 1000, // 30 seconds
    placeholderData: keepPreviousData, // Keep previous page data while loading new page
    enabled: !!groupId,
  });
}

/**
 * Create a new expense
 */
export function useCreateExpense(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      currency?: string;
      paid_by: string;
      amount: number;
      splits: Array<{
        user_id: string;
        amount: number;
        split_type?: string;
      }>;
    }) => {
      const response = await fetch(`/api/groups/${groupId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create expense');
      }

      const result = await response.json();
      return result.expense as Expense;
    },
    onSuccess: () => {
      // Invalidate and refetch all expense pages immediately
      queryClient.invalidateQueries({ 
        queryKey: expenseKeys.lists(),
        refetchType: 'active' // Refetch active queries immediately
      });
      // Also invalidate group summary to show updated data
      queryClient.invalidateQueries({ 
        queryKey: groupKeys.summary(groupId),
        refetchType: 'active'
      });
    },
  });
}

/**
 * Update an existing expense
 */
export function useUpdateExpense(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      expense_id: string;
      title: string;
      currency?: string;
      paid_by: string;
      amount: number;
      splits: Array<{
        user_id: string;
        amount: number;
        split_type?: string;
      }>;
    }) => {
      const response = await fetch(`/api/groups/${groupId}/expenses`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update expense');
      }

      const result = await response.json();
      return result.expense as Expense;
    },
    onSuccess: () => {
      // Invalidate and refetch all expense pages immediately
      queryClient.invalidateQueries({ 
        queryKey: expenseKeys.lists(),
        refetchType: 'active' // Refetch active queries immediately
      });
      // Also invalidate group summary to show updated data
      queryClient.invalidateQueries({ 
        queryKey: groupKeys.summary(groupId),
        refetchType: 'active'
      });
    },
  });
}

/**
 * Delete an expense
 */
export function useDeleteExpense(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expenseId: string) => {
      const response = await fetch(`/api/groups/${groupId}/expenses?expense_id=${expenseId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete expense');
      }
    },
    onSuccess: () => {
      // Invalidate and refetch all expense pages immediately
      queryClient.invalidateQueries({ 
        queryKey: expenseKeys.lists(),
        refetchType: 'active' // Refetch active queries immediately
      });
      // Also invalidate group summary to show updated data
      queryClient.invalidateQueries({ 
        queryKey: groupKeys.summary(groupId),
        refetchType: 'active'
      });
    },
  });
}
