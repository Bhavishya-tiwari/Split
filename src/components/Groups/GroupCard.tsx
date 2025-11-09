'use client';

import { useRouter } from 'next/navigation';
import { Group } from './types';
import { getGroupIcon } from './IconPicker';

interface GroupCardProps {
  group: Group;
}

export default function GroupCard({ group }: GroupCardProps) {
  const router = useRouter();
  const IconComponent = getGroupIcon(group.icon);

  const handleClick = () => {
    router.push(`/groups/${group.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
          <IconComponent className="w-6 h-6 text-emerald-600" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{group.name}</h3>
      {group.description && (
        <p className="text-gray-600 text-sm mb-4">{group.description}</p>
      )}
      <p className="text-xs text-gray-400">
        Created {new Date(group.created_at).toLocaleDateString()}
      </p>
    </div>
  );
}

