'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClientForBrowser } from '@/utils/supabase/client';
import { useGroupSummary, useUpdateGroup, useDeleteGroup } from '@/hooks/useGroups';
import {
  GroupHeader,
  ExpensesSection,
  MembersCard,
  GroupStatsCard,
  SettingsModal,
  EditGroupModal,
  Group,
  GroupMember
} from '@/components/Groups/GroupDetail';

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', description: '', icon: 'Users' });
  const [editError, setEditError] = useState('');

  // REACT QUERY: Automatic caching, loading states, and refetching
  const { data: summary, isLoading, error } = useGroupSummary(groupId);
  const updateGroupMutation = useUpdateGroup();
  const deleteGroupMutation = useDeleteGroup();

  // Extract data from summary
  const group = summary?.group || null;
  const members = summary?.members || [];
  const userRole = summary?.userRole || null;

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClientForBrowser();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/');
        return;
      }

      setCurrentUserId(user.id);
    };
    
    checkAuth();
  }, [router]);

  const handleEditClick = () => {
    if (group) {
      setEditFormData({
        name: group.name,
        description: group.description || '',
        icon: group.icon || 'Users'
      });
      setEditError('');
      setShowSettingsModal(false);
      setShowEditModal(true);
    }
  };

  const handleUpdateGroup = async (data: { name: string; description: string; icon: string }) => {
    setEditError('');

    try {
      // REACT QUERY: Automatic cache invalidation
      await updateGroupMutation.mutateAsync({
        id: groupId,
        name: data.name,
        description: data.description,
        icon: data.icon
      });

      setShowEditModal(false);
      setEditError('');
    } catch (err: unknown) {
      console.error('Error updating group:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update group';
      setEditError(errorMessage);
      throw err; // Re-throw to let form handle the error
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }

    try {
      // REACT QUERY: Automatic cache invalidation
      await deleteGroupMutation.mutateAsync(groupId);
      
      // Success - redirect to groups page
      router.push('/groups');
    } catch (err: unknown) {
      console.error('Error deleting group:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete group';
      alert(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading group...</p>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-red-600">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{error?.message || 'Group not found'}</h3>
          <p className="text-gray-600 mb-6">The group you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
          <button
            onClick={() => router.push('/groups')}
            className="px-6 py-3 bg-linear-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md"
          >
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <GroupHeader
        name={group.name}
        description={group.description}
        icon={group.icon || 'Users'}
        createdAt={group.created_at}
        isAdmin={userRole === 'admin'}
        onSettingsClick={() => setShowSettingsModal(true)}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <MembersCard
          members={members}
          isAdmin={userRole === 'admin'}
          groupId={groupId}
          currentUserId={currentUserId}
        />

        <GroupStatsCard />
      </div>

      <ExpensesSection
        members={members}
        groupId={groupId}
        currentUserId={currentUserId}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        isDeleting={deleteGroupMutation.isPending}
        onClose={() => setShowSettingsModal(false)}
        onEdit={handleEditClick}
        onDelete={handleDeleteGroup}
      />

      <EditGroupModal
        isOpen={showEditModal}
        isUpdating={updateGroupMutation.isPending}
        formData={editFormData}
        error={editError}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleUpdateGroup}
      />
    </div>
  );
}

