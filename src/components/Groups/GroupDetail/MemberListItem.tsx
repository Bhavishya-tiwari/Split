import { GroupMember } from './types';
import { Trash2 } from 'lucide-react';

interface MemberListItemProps {
  member: GroupMember;
  variant?: 'compact' | 'detailed';
  canDelete?: boolean;
  onDelete?: (memberId: string) => void;
  isDeleting?: boolean;
}

export default function MemberListItem({
  member,
  variant = 'compact',
  canDelete = false,
  onDelete,
  isDeleting = false,
}: MemberListItemProps) {
  const displayName = member.profiles.display_name || member.profiles.email;

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 py-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
          <p className="text-xs text-gray-500 capitalize">{member.role}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
          <p className="text-xs text-gray-500 truncate">{member.profiles.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
            member.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
          }`}
        >
          {member.role}
        </span>
        {canDelete && onDelete && (
          <button
            onClick={() => onDelete(member.id)}
            disabled={isDeleting}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Remove member"
            title="Remove member"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
