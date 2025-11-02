'use client';

import { Plus } from 'lucide-react';

interface GroupsHeaderProps {
  onCreateClick: () => void;
}

export default function GroupsHeader({ onCreateClick }: GroupsHeaderProps) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Groups</h2>
        <p className="text-gray-600">Manage your expense groups</p>
      </div>
      <button
        onClick={onCreateClick}
        className="px-6 py-3 bg-linear-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md flex items-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Create Group
      </button>
    </div>
  );
}

