import { NextRequest, NextResponse } from 'next/server';
import { createClientForServer } from '@/utils/supabase/server';
import { createServiceRoleClient } from '@/utils/supabase/service';

/**
 * POST /api/groups/[groupId]/payments
 * Create a new payment between users
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;

    // Authenticate user
    const supabase = await createClientForServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { from_user_id, to_user_id, amount, notes } = body;

    // Validate required fields
    if (!from_user_id || !to_user_id || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: from_user_id, to_user_id, amount' },
        { status: 400 }
      );
    }

    // Validate amount is positive
    const paymentAmount = parseFloat(String(amount));
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    // Validate user isn't paying themselves
    if (from_user_id === to_user_id) {
      return NextResponse.json(
        { error: 'Cannot pay yourself' },
        { status: 400 }
      );
    }

    // Use service role client
    const serviceSupabase = createServiceRoleClient();

    // Verify user is a member of the group
    const { data: membership, error: membershipError } = await serviceSupabase
      .from('user_group_mapping')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Forbidden - Not a member of this group' },
        { status: 403 }
      );
    }

    // Verify both users are members of the group
    const { data: memberships, error: membersError } = await serviceSupabase
      .from('user_group_mapping')
      .select('user_id')
      .eq('group_id', groupId)
      .in('user_id', [from_user_id, to_user_id]);

    if (membersError || !memberships || memberships.length !== 2) {
      return NextResponse.json(
        { error: 'Both users must be members of this group' },
        { status: 400 }
      );
    }

    // Create payment
    const { data: payment, error: paymentError } = await serviceSupabase
      .from('payments')
      .insert({
        group_id: groupId,
        from_user_id,
        to_user_id,
        amount: paymentAmount,
        created_by: user.id,
        notes: notes || null,
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment:', paymentError);
      return NextResponse.json(
        { error: 'Failed to create payment', details: paymentError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { payment },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in payments route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/groups/[groupId]/payments
 * Get all payments for a group
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;

    // Authenticate user
    const supabase = await createClientForServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role client
    const serviceSupabase = createServiceRoleClient();

    // Verify user is a member of the group
    const { data: membership, error: membershipError } = await serviceSupabase
      .from('user_group_mapping')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Forbidden - Not a member of this group' },
        { status: 403 }
      );
    }

    // Get all payments for the group
    const { data: payments, error: paymentsError } = await serviceSupabase
      .from('payments')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
      return NextResponse.json(
        { error: 'Failed to fetch payments', details: paymentsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ payments: payments || [] });
  } catch (error) {
    console.error('Error in payments route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

