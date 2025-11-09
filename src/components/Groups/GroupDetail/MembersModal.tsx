import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { GroupMember } from './types';
import MemberListItem from './MemberListItem';
import { X, Plus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { groupKeys } from '@/hooks/useGroups';

interface MembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: GroupMember[];
  isAdmin: boolean;
  groupId: string;
  currentUserId: string | null;
}

interface AddMemberFormData {
  email: string;
}

export default function MembersModal({
  isOpen,
  onClose,
  members,
  isAdmin,
  groupId,
  currentUserId,
}: MembersModalProps) {
  // REACT QUERY: Use query client for cache invalidation
  const queryClient = useQueryClient();
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddMemberFormData>({
    defaultValues: {
      email: '',
    },
  });

  if (!isOpen) return null;

  const handleMemberAddition = async (data: AddMemberFormData) => {
    setAddError('');
    setIsAdding(true);

    try {
      const response = await fetch(`/api/groups/${groupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email.trim().toLowerCase() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add member');
      }

      await response.json();

      // REACT QUERY: Invalidate cache to refetch members automatically
      queryClient.invalidateQueries({ 
        queryKey: groupKeys.summary(groupId),
        refetchType: 'active' // Refetch immediately to show new member
      });

      // Close the add member modal and reset form
      setShowAddMemberModal(false);
      reset();
      setAddError('');
    } catch (err: unknown) {
      console.error('Error adding member:', err);
      setAddError(err instanceof Error ? err.message : 'Failed to add member');
    } finally {
      setIsAdding(false);
    }
  };

  const handleMemberDeletion = async (memberId: string) => {
    const memberToDelete = members.find((m) => m.id === memberId);
    const memberName = memberToDelete?.profiles.display_name || memberToDelete?.profiles.email;

    if (!confirm(`Are you sure you want to remove ${memberName} from this group?`)) {
      return;
    }

    setDeletingMemberId(memberId);

    try {
      const response = await fetch(`/api/groups/${groupId}/members?member_id=${memberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove member');
      }

      // REACT QUERY: Invalidate cache to refetch members automatically
      queryClient.invalidateQueries({ 
        queryKey: groupKeys.summary(groupId),
        refetchType: 'active' // Refetch immediately to show new member
      });
    } catch (err: unknown) {
      console.error('Error removing member:', err);
      const errorMessage = err instanceof Error ? err.message : undefined;
      alert(errorMessage || 'Failed to remove member');
    } finally {
      setDeletingMemberId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Group Members</h2>
              <p className="text-sm text-gray-600 mt-1">
                {members.length} {members.length === 1 ? 'member' : 'members'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Members List */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-3">
              {members.map((member) => (
                <MemberListItem
                  key={member.id}
                  member={member}
                  variant="detailed"
                  canDelete={isAdmin && member.profiles.id !== currentUserId}
                  onDelete={handleMemberDeletion}
                  isDeleting={deletingMemberId === member.id}
                />
              ))}
            </div>
          </div>

          {/* Footer */}
          {isAdmin && (
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowAddMemberModal(true)}
                className="w-full px-6 py-3 bg-linear-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Add New Member
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-60 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => {
                setShowAddMemberModal(false);
                reset();
                setAddError('');
              }}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Add New Member</h3>
                <button
                  onClick={() => {
                    setShowAddMemberModal(false);
                    reset();
                    setAddError('');
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(handleMemberAddition)} className="p-6">
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Please enter a valid email address',
                      },
                    })}
                    placeholder="user@example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    disabled={isAdding}
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    Enter the email address of the user you want to add to this group.
                  </p>
                </div>

                {addError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{addError}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMemberModal(false);
                      reset();
                      setAddError('');
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
                    disabled={isAdding}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="flex-1 px-4 py-3 bg-linear-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAdding ? 'Adding...' : 'Add Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
