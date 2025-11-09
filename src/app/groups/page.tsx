'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientForBrowser } from '@/utils/supabase/client';
import { useGroups } from '@/hooks/useGroups';
import {
  CreateGroupModal,
  GroupsList,
  EmptyGroupsState,
  LoadingState,
  GroupsHeader,
} from '@/components/Groups';

export default function GroupsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const router = useRouter();

  // REACT QUERY: Automatic caching, loading states, and refetching
  const { data: groups = [], isLoading, error } = useGroups();

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClientForBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/');
      }
    };
    checkAuth();
  }, [router]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Failed to load groups. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <GroupsHeader onCreateClick={() => setShowCreateModal(true)} />

      {groups.length === 0 ? (
        <EmptyGroupsState onCreateClick={() => setShowCreateModal(true)} />
      ) : (
        <GroupsList groups={groups} />
      )}

      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => setShowCreateModal(false)}
      />
    </div>
  );
}
