/**
 * React Query hooks for Groups
 *
 * Provides:
 * - Automatic caching
 * - Loading/error states
 * - Background refetching
 * - Cache invalidation
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Query Keys - centralized for easy invalidation
export const groupKeys = {
  all: ['groups'] as const,
  lists: () => [...groupKeys.all, 'list'] as const,
  list: () => [...groupKeys.lists()] as const,
  details: () => [...groupKeys.all, 'detail'] as const,
  detail: (id: string) => [...groupKeys.details(), id] as const,
  summary: (id: string) => [...groupKeys.all, 'summary', id] as const,
  members: (id: string) => [...groupKeys.all, 'members', id] as const,
};

export interface Group {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  role: string;
  joined_at: string;
  profiles: {
    id: string;
    display_name: string;
    email: string;
  };
}

export interface GroupSummary {
  group: Group;
  members: GroupMember[];
  expenseCount: number;
  userRole: string;
}

/**
 * Fetch all groups for the current user
 */
export function useGroups() {
  return useQuery({
    queryKey: groupKeys.list(),
    queryFn: async () => {
      const response = await fetch('/api/groups');
      if (!response.ok) throw new Error('Failed to fetch groups');
      const data = await response.json();
      return data.groups as Group[];
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Fetch group summary (group + members + recent expenses)
 * OPTIMIZED: Single API call instead of 3
 */
export function useGroupSummary(groupId: string) {
  return useQuery({
    queryKey: groupKeys.summary(groupId),
    queryFn: async () => {
      const response = await fetch(`/api/groups/${groupId}/summary`);
      if (!response.ok) throw new Error('Failed to fetch group summary');
      return response.json() as Promise<GroupSummary>;
    },
    staleTime: 45 * 1000, // 45 seconds
    enabled: !!groupId, // Only run if groupId exists
  });
}

/**
 * Create a new group
 */
export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string; icon?: string }) => {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create group');
      }

      const result = await response.json();
      return result.group as Group;
    },
    onSuccess: () => {
      // Invalidate and refetch groups list immediately
      queryClient.invalidateQueries({ 
        queryKey: groupKeys.lists(),
        refetchType: 'active'
      });
    },
  });
}

/**
 * Update a group
 */
export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; name: string; description?: string; icon?: string }) => {
      const response = await fetch('/api/groups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update group');
      }

      const result = await response.json();
      return result.group as Group;
    },
    onSuccess: (_, variables) => {
      // Invalidate specific group and groups list immediately
      queryClient.invalidateQueries({ 
        queryKey: groupKeys.detail(variables.id),
        refetchType: 'active'
      });
      queryClient.invalidateQueries({ 
        queryKey: groupKeys.summary(variables.id),
        refetchType: 'active'
      });
      queryClient.invalidateQueries({ 
        queryKey: groupKeys.lists(),
        refetchType: 'active'
      });
    },
  });
}

/**
 * Delete a group
 */
export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const response = await fetch(`/api/groups?id=${groupId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete group');
      }
    },
    onSuccess: () => {
      // Invalidate groups list immediately
      queryClient.invalidateQueries({ 
        queryKey: groupKeys.lists(),
        refetchType: 'active'
      });
    },
  });
}
