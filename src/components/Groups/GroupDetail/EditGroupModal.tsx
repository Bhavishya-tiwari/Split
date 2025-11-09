'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Edit2 } from 'lucide-react';
import IconPicker from '../IconPicker';

interface EditGroupModalProps {
  isOpen: boolean;
  isUpdating: boolean;
  formData: {
    name: string;
    description: string;
    icon: string;
  };
  error: string;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string; icon: string }) => Promise<void>;
}

interface FormData {
  name: string;
  description: string;
  icon: string;
}

export default function EditGroupModal({
  isOpen,
  isUpdating,
  formData,
  error,
  onClose,
  onSubmit,
}: EditGroupModalProps) {
  const [selectedIcon, setSelectedIcon] = useState(formData.icon || 'Users');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: formData,
  });

  // Update form values when formData changes
  useEffect(() => {
    reset(formData);
    setSelectedIcon(formData.icon || 'Users');
  }, [formData, reset]);

  const handleFormSubmit = async (data: FormData) => {
    await onSubmit({
      ...data,
      icon: selectedIcon,
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-linear-to-r from-emerald-500 to-teal-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Edit2 className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">Edit Group</h3>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200"
              disabled={isUpdating}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6">
          <div className="mb-4">
            <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-2">
              Group Name *
            </label>
            <input
              type="text"
              id="edit-name"
              {...register('name', {
                required: 'Group name is required',
                validate: (value) => value.trim().length > 0 || 'Group name is required',
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="e.g., Weekend Trip"
              disabled={isUpdating}
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div className="mb-4">
            <label
              htmlFor="edit-description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Description (optional)
            </label>
            <textarea
              id="edit-description"
              {...register('description')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="What's this group for?"
              rows={3}
              disabled={isUpdating}
            />
          </div>

          <div className="mb-6">
            <IconPicker selectedIcon={selectedIcon} onIconSelect={setSelectedIcon} />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              disabled={isUpdating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-linear-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isUpdating}
            >
              {isUpdating ? 'Updating...' : 'Update Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
