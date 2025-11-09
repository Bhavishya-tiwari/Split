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
        className="group relative px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2"
      >
        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
        <span className="text-sm">New Group</span>
      </button>
    </div>
  );
}
