'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClientForBrowser } from '@/utils/supabase/client';
import {
  CreateGroupModal,
  GroupsList,
  EmptyGroupsState,
  LoadingState,
  GroupsHeader,
  type Group,
} from '@/components/Groups';

export default function GroupsPage() {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const router = useRouter();

  const fetchGroups = useCallback(async () => {
    try {
      const supabase = createClientForBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/');
        return;
      }

      // Fetch groups through API route
      const response = await fetch('/api/groups', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Error fetching groups:', response.statusText);
        return;
      }

      const { groups: fetchedGroups } = await response.json();
      setGroups(fetchedGroups || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  if (loading) {
    return <LoadingState />;
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
        onSuccess={fetchGroups}
      />
    </div>
  );
}

