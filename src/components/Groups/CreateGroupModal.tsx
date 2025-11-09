'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { useCreateGroup } from '@/hooks/useGroups';
import IconPicker from './IconPicker';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  description: string;
  icon: string;
}

export default function CreateGroupModal({ isOpen, onClose, onSuccess }: CreateGroupModalProps) {
  const [error, setError] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Users');
  
  // REACT QUERY: Automatic cache invalidation
  const createGroupMutation = useCreateGroup();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name: '',
      description: '',
      icon: 'Users'
    }
  });

  const onSubmit = async (data: FormData) => {
    setError('');

    try {
      await createGroupMutation.mutateAsync({
        ...data,
        icon: selectedIcon
      });

      // Success - reset form and close modal
      reset();
      setSelectedIcon('Users');
      setError('');
      onClose();
      onSuccess();
    } catch (err: unknown) {
      console.error('Error creating group:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create group';
      setError(errorMessage);
    }
  };

  const handleClose = () => {
    setError('');
    reset();
    setSelectedIcon('Users');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Create New Group</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Group Name *
            </label>
            <input
              type="text"
              id="name"
              {...register('name', { 
                required: 'Group name is required',
                validate: value => value.trim().length > 0 || 'Group name is required'
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g., Weekend Trip"
              disabled={createGroupMutation.isPending}
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <textarea
              id="description"
              {...register('description')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="What's this group for?"
              rows={3}
              disabled={createGroupMutation.isPending}
            />
          </div>

          <div className="mb-6">
            <IconPicker
              selectedIcon={selectedIcon}
              onIconSelect={setSelectedIcon}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              disabled={createGroupMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-linear-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={createGroupMutation.isPending}
            >
              {createGroupMutation.isPending ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

