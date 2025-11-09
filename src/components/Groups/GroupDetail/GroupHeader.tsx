import { Settings } from 'lucide-react';
import { getGroupIcon } from '../IconPicker';

interface GroupHeaderProps {
  name: string;
  description: string | null;
  icon: string;
  createdAt: string;
  isAdmin: boolean;
  onSettingsClick: () => void;
}

export default function GroupHeader({
  name,
  description,
  icon,
  createdAt,
  isAdmin,
  onSettingsClick
}: GroupHeaderProps) {
  const IconComponent = getGroupIcon(icon);

  return (
    <div className="mb-8">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg">
            <IconComponent className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{name}</h2>
            {description && (
              <p className="text-gray-600 mb-2">{description}</p>
            )}
            <p className="text-sm text-gray-400">
              Created {new Date(createdAt).toLocaleDateString()}
            </p>
          </div>
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

