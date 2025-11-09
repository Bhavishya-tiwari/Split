import { NextRequest, NextResponse } from 'next/server';
import { createClientForServer } from '@/utils/supabase/server';
import { createServiceRoleClient } from '@/utils/supabase/service';

// GET - Fetch all members of a group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    // Authenticate the user using server client
    const supabase = await createClientForServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get group ID from dynamic route params
    const { groupId } = await params;

    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      );
    }

    // Use service role client to bypass RLS
    const serviceSupabase = createServiceRoleClient();

    // 1. Verify the logged-in user is a member of this group
    const { data: userMembership, error: membershipError } = await serviceSupabase
      .from('user_group_mapping')
      .select('role')
      .eq('user_id', user.id)
      .eq('group_id', groupId)
      .single();

    if (membershipError || !userMembership) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 403 }
      );
    }

    // 2. Fetch all members of the group with their profile details
    const { data: membersData, error: membersError } = await serviceSupabase
      .from('user_group_mapping')
      .select('id, role, joined_at, profiles(id, display_name:full_name, email)')
      .eq('group_id', groupId);

    if (membersError) {
      console.error('Error fetching members:', membersError);
      return NextResponse.json(
        { error: 'Failed to fetch members' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      members: membersData,
      userRole: userMembership.role
    }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/groups/[groupId]/members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add a new member to a group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    // Authenticate the user using server client
    const supabase = await createClientForServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get group ID from dynamic route params
    const { groupId } = await params;

    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Use service role client for database operations
    const serviceSupabase = createServiceRoleClient();

    // 1. Check if the requesting user is an admin of the group
    const { data: requestingUserMembership, error: requestingUserError } = await serviceSupabase
      .from('user_group_mapping')
      .select('role')
      .eq('user_id', user.id)
      .eq('group_id', groupId)
      .single();

    if (requestingUserError || !requestingUserMembership) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 403 }
      );
    }

    if (requestingUserMembership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only group admins can add members' },
        { status: 403 }
      );
    }

    // 2. Check if the user exists in the profiles table
    const { data: profileData, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('email', email.toLowerCase())
      .single();

    if (profileError || !profileData) {
      return NextResponse.json(
        { error: 'User with this email does not exist in the system' },
        { status: 404 }
      );
    }

    // 3. Check if the user is already a member of the group
    const { data: existingMembership } = await serviceSupabase
      .from('user_group_mapping')
      .select('id')
      .eq('user_id', profileData.id)
      .eq('group_id', groupId)
      .maybeSingle();

    if (existingMembership) {
      return NextResponse.json(
        { error: 'User is already a member of this group' },
        { status: 400 }
      );
    }

    // 4. Add the user to the group
    const { data: newMembership, error: insertError } = await serviceSupabase
      .from('user_group_mapping')
      .insert({
        user_id: profileData.id,
        group_id: groupId,
        role: 'member'
      })
      .select('id, role, joined_at, profiles(id, display_name:full_name, email)')
      .single();

    if (insertError) {
      console.error('Error adding member:', insertError);
      return NextResponse.json(
        { error: 'Failed to add member to group' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Member added successfully',
        member: newMembership
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/groups/[groupId]/members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a member from a group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    // Authenticate the user using server client
    const supabase = await createClientForServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get group ID from dynamic route params
    const { groupId } = await params;

    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      );
    }

    // Get member ID from query params
    const { searchParams } = new URL(request.url);
    const memberIdToRemove = searchParams.get('member_id');

    if (!memberIdToRemove) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    // Use service role client for database operations
    const serviceSupabase = createServiceRoleClient();

    // 1. Check if the requesting user is an admin of the group
    const { data: requestingUserMembership, error: requestingUserError } = await serviceSupabase
      .from('user_group_mapping')
      .select('role')
      .eq('user_id', user.id)
      .eq('group_id', groupId)
      .single();

    if (requestingUserError || !requestingUserMembership) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 403 }
      );
    }

    if (requestingUserMembership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only group admins can remove members' },
        { status: 403 }
      );
    }

    // 2. Get the membership record to be deleted
    const { data: membershipToRemove, error: membershipError } = await serviceSupabase
      .from('user_group_mapping')
      .select('id, user_id, role')
      .eq('id', memberIdToRemove)
      .eq('group_id', groupId)
      .single();

    if (membershipError || !membershipToRemove) {
      return NextResponse.json(
        { error: 'Member not found in this group' },
        { status: 404 }
      );
    }

    // 3. Prevent users from removing themselves
    if (membershipToRemove.user_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot remove yourself from the group. Ask another admin to remove you.' },
        { status: 400 }
      );
    }

    // 4. Prevent removing the last admin
    if (membershipToRemove.role === 'admin') {
      const { data: adminCount, error: countError } = await serviceSupabase
        .from('user_group_mapping')
        .select('id', { count: 'exact', head: true })
        .eq('group_id', groupId)
        .eq('role', 'admin');

      if (countError) {
        console.error('Error counting admins:', countError);
        return NextResponse.json(
          { error: 'Failed to verify admin count' },
          { status: 500 }
        );
      }

      // Use count property from the response
      const count = (adminCount as unknown as { count: number }).count;
      
      if (count <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last admin. Please promote another member to admin first.' },
          { status: 400 }
        );
      }
    }

    // 5. Check if the user has any expense involvement in this group
    // Check as payer in expense_payers
    const { data: payerExpenses, error: payerCheckError } = await serviceSupabase
      .from('expense_payers')
      .select('id, expenses!inner(group_id)')
      .eq('paid_by', membershipToRemove.user_id)
      .eq('expenses.group_id', groupId)
      .limit(1);

    if (payerCheckError) {
      console.error('Error checking payer expenses:', payerCheckError);
      return NextResponse.json(
        { error: 'Failed to verify expense involvement' },
        { status: 500 }
      );
    }

    if (payerExpenses && payerExpenses.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot remove member who has paid for expenses in this group. Please delete or reassign their expenses first.',
          hasExpenses: true
        },
        { status: 400 }
      );
    }

    // Check as split participant in expense_splits
    const { data: splitExpenses, error: splitCheckError } = await serviceSupabase
      .from('expense_splits')
      .select('id, expenses!inner(group_id)')
      .eq('user_id', membershipToRemove.user_id)
      .eq('expenses.group_id', groupId)
      .limit(1);

    if (splitCheckError) {
      console.error('Error checking split expenses:', splitCheckError);
      return NextResponse.json(
        { error: 'Failed to verify expense involvement' },
        { status: 500 }
      );
    }

    if (splitExpenses && splitExpenses.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot remove member who is part of expense splits in this group. Please delete or reassign their expenses first.',
          hasExpenses: true
        },
        { status: 400 }
      );
    }

    // 6. Delete the member from the group
    const { error: deleteError } = await serviceSupabase
      .from('user_group_mapping')
      .delete()
      .eq('id', memberIdToRemove)
      .eq('group_id', groupId);

    if (deleteError) {
      console.error('Error removing member:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove member from group' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Member removed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE /api/groups/[groupId]/members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

