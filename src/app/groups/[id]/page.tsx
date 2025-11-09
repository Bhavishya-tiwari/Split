'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClientForBrowser } from '@/utils/supabase/client';
import axios from 'axios';
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

  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', description: '', icon: 'Users' });
  const [editError, setEditError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        const supabase = createClientForBrowser();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/');
          return;
        }

        setCurrentUserId(user.id);

        // Fetch group details through API route
        const groupResponse = await fetch(`/api/groups?id=${groupId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!groupResponse.ok) {
          console.error('Error fetching group:', groupResponse.statusText);
          setError('Group not found');
          setLoading(false);
          return;
        }

        const { group: groupData, userRole: role } = await groupResponse.json();
        setGroup(groupData);
        setUserRole(role);

        // Fetch group members using API route
        const { data: membersResponse } = await axios.get(`/api/groups/${groupId}/members`);
        
        if (membersResponse.members) {
          setMembers(membersResponse.members);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load group');
        setLoading(false);
      }
    };

    if (groupId) {
      fetchGroupDetails();
    }
  }, [groupId, router]);

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
    setIsUpdating(true);

    try {
      const response = await axios.put('/api/groups', {
        id: groupId,
        name: data.name,
        description: data.description,
        icon: data.icon
      });

      // Update local state with new group data
      setGroup(response.data.group);
      setShowEditModal(false);
      setEditError('');
    } catch (err: unknown) {
      console.error('Error updating group:', err);
      const errorMessage = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      setEditError(errorMessage || 'Failed to update group');
      throw err; // Re-throw to let form handle the error
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);

    try {
      await axios.delete(`/api/groups?id=${groupId}`);

      // Success - redirect to groups page
      router.push('/groups');
    } catch (err: unknown) {
      console.error('Error deleting group:', err);
      const errorMessage = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      alert(errorMessage || 'Failed to delete group');
      setIsDeleting(false);
    }
  };

  if (loading) {
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
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{error || 'Group not found'}</h3>
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
          setMembers={setMembers}
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
        isDeleting={isDeleting}
        onClose={() => setShowSettingsModal(false)}
        onEdit={handleEditClick}
        onDelete={handleDeleteGroup}
      />

      <EditGroupModal
        isOpen={showEditModal}
        isUpdating={isUpdating}
        formData={editFormData}
        error={editError}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleUpdateGroup}
      />
    </div>
  );
}

