'use client';

import { Users } from 'lucide-react';

interface EmptyGroupsStateProps {
  onCreateClick: () => void;
}

export default function EmptyGroupsState({ onCreateClick }: EmptyGroupsStateProps) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
        <Users className="w-8 h-8 text-gray-400" />
      </div>
      <p className="text-gray-600 mb-4">No groups yet</p>
      <button
        onClick={onCreateClick}
        className="px-6 py-3 bg-linear-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md"
      >
        Create your first group
      </button>
    </div>
  );
}

