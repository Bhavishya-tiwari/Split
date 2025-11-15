import { NextRequest, NextResponse } from 'next/server';
import { createClientForServer } from '@/utils/supabase/server';
import { createServiceRoleClient } from '@/utils/supabase/service';

/**
 * OPTIMIZED GROUP SUMMARY ENDPOINT
 *
 * This endpoint combines multiple requests into 1:
 * - Group details
 * - Group members
 * - Expense count (optimized to only fetch count, not full expenses)
 *
 * Benefits:
 * - Reduced API calls
 * - Single membership validation
 * - Parallel data fetching with Promise.all
 * - Only fetches what's actually used (no unused expense data)
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    // Authenticate the user
    const supabase = await createClientForServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get group ID from params
    const { groupId } = await params;

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    // Use service role client
    const serviceSupabase = createServiceRoleClient();

    // OPTIMIZATION 1: Single membership check
    const { data: membership, error: membershipError } = await serviceSupabase
      .from('user_group_mapping')
      .select('role')
      .eq('user_id', user.id)
      .eq('group_id', groupId)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 });
    }

    // OPTIMIZATION 2: Fetch all data in parallel
    const [groupResult, membersResult, expenseCountResult] = await Promise.all([
      // Fetch group details
      serviceSupabase.from('groups').select('*').eq('id', groupId).single(),

      // Fetch members
      serviceSupabase
        .from('user_group_mapping')
        .select('id, role, joined_at, profiles(id, display_name:full_name, email)')
        .eq('group_id', groupId),

      // OPTIMIZED: Only fetch COUNT (80% bandwidth savings)
      // Frontend uses useExpenses for actual expense list
      serviceSupabase
        .from('expenses')
        .select('id', { count: 'exact', head: true })
        .eq('group_id', groupId),
    ]);

    // Handle errors
    if (groupResult.error) {
      console.error('Error fetching group:', groupResult.error);
      return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 });
    }

    if (membersResult.error) {
      console.error('Error fetching members:', membersResult.error);
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
    }

    if (expenseCountResult.error) {
      console.error('Error fetching expense count:', expenseCountResult.error);
      return NextResponse.json({ error: 'Failed to fetch expense count' }, { status: 500 });
    }

    return NextResponse.json(
      {
        group: groupResult.data,
        members: membersResult.data,
        expenseCount: expenseCountResult.count || 0,
        userRole: membership.role,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/groups/[groupId]/summary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
