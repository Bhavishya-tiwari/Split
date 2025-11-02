import { Settings } from 'lucide-react';

interface GroupHeaderProps {
  name: string;
  description: string | null;
  createdAt: string;
  isAdmin: boolean;
  onSettingsClick: () => void;
}

export default function GroupHeader({
  name,
  description,
  createdAt,
  isAdmin,
  onSettingsClick
}: GroupHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{name}</h2>
          {description && (
            <p className="text-gray-600 mb-2">{description}</p>
          )}
          <p className="text-sm text-gray-400">
            Created {new Date(createdAt).toLocaleDateString()}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={onSettingsClick}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
            title="Group Settings"
          >
            <Settings className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
}

