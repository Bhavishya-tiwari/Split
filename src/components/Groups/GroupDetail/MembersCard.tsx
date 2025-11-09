'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { GroupMember } from './types';
import MembersModal from './MembersModal';

interface MembersCardProps {
  members: GroupMember[];
  isAdmin: boolean;
  groupId: string;
  currentUserId: string | null;
}

export default function MembersCard({ members, isAdmin, groupId, currentUserId }: MembersCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div 
        className="bg-white rounded-xl shadow-md border border-gray-200 p-4 cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Members</h3>
          <div className="flex items-center gap-1">
            <span className="text-2xl font-bold text-emerald-600">{members.length}</span>
            <ChevronRight className="h-3 w-5 text-gray-400" />
          </div>
        </div>
        
      </div>

      <MembersModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        members={members}
        isAdmin={isAdmin}
        groupId={groupId}
        currentUserId={currentUserId}
      />
    </>
  );
}
