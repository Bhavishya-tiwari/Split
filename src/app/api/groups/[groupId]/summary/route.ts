import { NextRequest, NextResponse } from 'next/server';
import { createClientForServer } from '@/utils/supabase/server';
import { createServiceRoleClient } from '@/utils/supabase/service';

/**
 * OPTIMIZED GROUP SUMMARY ENDPOINT
 *
 * This endpoint combines 3 separate requests into 1:
 * - Group details
 * - Group members
 * - Recent expenses
 *
 * Benefits:
 * - 66% reduction in API calls (3 → 1)
 * - Single membership validation instead of 3
 * - Parallel data fetching with Promise.all
 * - Reduces database connection overhead
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

    // Get query params
    const { searchParams } = new URL(request.url);
    const expenseLimit = parseInt(searchParams.get('expense_limit') || '20');

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
    const [groupResult, membersResult, expensesResult] = await Promise.all([
      // Fetch group details
      serviceSupabase.from('groups').select('*').eq('id', groupId).single(),

      // Fetch members
      serviceSupabase
        .from('user_group_mapping')
        .select('id, role, joined_at, profiles(id, display_name:full_name, email)')
        .eq('group_id', groupId),

      // Fetch recent expenses WITHOUT profile joins
      serviceSupabase
        .from('expenses')
        .select(
          `
          id,
          title,
          group_id,
          currency,
          created_by,
          created_at,
          updated_at,
          expense_payers(id, amount, paid_by),
          expense_splits(id, user_id, amount, split_type, percentage, shares)
        `,
          { count: 'exact' }
        )
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .limit(expenseLimit),
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

    if (expensesResult.error) {
      console.error('Error fetching expenses:', expensesResult.error);
      return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
    }

    // OPTIMIZATION 3: Build profile map from members (already fetched)
    const profileMap = new Map();
    membersResult.data?.forEach((member) => {
      if (member.profiles) {
        // Handle profiles as either object or array (Supabase typing quirk)
        const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
        if (profile) {
          profileMap.set(profile.id, {
            id: profile.id,
            full_name: profile.display_name,
            email: profile.email,
          });
        }
      }
    });

    // OPTIMIZATION 4: Enrich expenses with profiles from the member map
    // No additional DB query needed!
    const enrichedExpenses = expensesResult.data?.map((expense) => ({
      ...expense,
      created_by_profile: profileMap.get(expense.created_by) || null,
      expense_payers:
        expense.expense_payers?.map((payer) => ({
          ...payer,
          payer_profile: profileMap.get(payer.paid_by) || null,
        })) || [],
      expense_splits:
        expense.expense_splits?.map((split) => ({
          ...split,
          split_user_profile: profileMap.get(split.user_id) || null,
        })) || [],
    }));

    return NextResponse.json(
      {
        group: groupResult.data,
        members: membersResult.data,
        expenses: enrichedExpenses || [],
        expenseCount: expensesResult.count || 0,
        userRole: membership.role,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/groups/[groupId]/summary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
