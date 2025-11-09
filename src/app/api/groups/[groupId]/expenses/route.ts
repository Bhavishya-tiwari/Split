import { NextRequest, NextResponse } from 'next/server';
import { createClientForServer } from '@/utils/supabase/server';
import { createServiceRoleClient } from '@/utils/supabase/service';

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Validates if a user is a member of a group
 * @returns The user's membership data or null if not a member
 */
async function validateGroupMembership(
  serviceSupabase: ReturnType<typeof createServiceRoleClient>,
  userId: string,
  groupId: string
) {
  const { data: membership, error } = await serviceSupabase
    .from('user_group_mapping')
    .select('id, role')
    .eq('user_id', userId)
    .eq('group_id', groupId)
    .maybeSingle();

  if (error) {
    console.error('Error checking membership:', error);
    return null;
  }

  return membership;
}

/**
 * Validates if all user IDs are members of the group in a SINGLE query
 * @returns { valid: boolean, invalidUsers: string[] }
 */
async function validateAllUsersInGroup(
  serviceSupabase: ReturnType<typeof createServiceRoleClient>,
  userIds: string[],
  groupId: string
): Promise<{ valid: boolean; invalidUsers: string[] }> {
  // Single query to fetch all memberships at once
  const { data: memberships, error } = await serviceSupabase
    .from('user_group_mapping')
    .select('user_id')
    .eq('group_id', groupId)
    .in('user_id', userIds);

  if (error) {
    console.error('Error checking memberships:', error);
    return {
      valid: false,
      invalidUsers: userIds,
    };
  }

  // Find which users are NOT in the results
  const validUserIds = new Set(memberships?.map((m) => m.user_id) || []);
  const invalidUsers = userIds.filter((id) => !validUserIds.has(id));

  return {
    valid: invalidUsers.length === 0,
    invalidUsers,
  };
}

/**
 * Validates expense data structure and business rules
 */
function validateExpenseData(data: {
  title?: string;
  group_id?: string;
  paid_by?: string;
  amount?: number;
  splits?: Array<{
    user_id: string;
    amount: number;
    split_type?: string;
  }>;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate title
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('Title is required');
  } else if (data.title.trim().length < 3) {
    errors.push('Title must be at least 3 characters long');
  }

  // Validate group_id
  if (!data.group_id || typeof data.group_id !== 'string') {
    errors.push('Group ID is required');
  }

  // Validate paid_by
  if (!data.paid_by || typeof data.paid_by !== 'string') {
    errors.push('Payer (paid_by) is required');
  }

  // Validate amount
  if (data.amount === undefined || data.amount === null) {
    errors.push('Amount is required');
  } else if (typeof data.amount !== 'number' || data.amount <= 0) {
    errors.push('Amount must be a positive number greater than 0');
  }

  // Validate splits
  if (!data.splits || !Array.isArray(data.splits) || data.splits.length === 0) {
    errors.push('At least one split is required');
  } else {
    // Validate each split
    data.splits.forEach((split, index) => {
      if (!split.user_id || typeof split.user_id !== 'string') {
        errors.push(`Split ${index + 1}: user_id is required`);
      }
      if (split.amount === undefined || split.amount === null) {
        errors.push(`Split ${index + 1}: amount is required`);
      } else if (typeof split.amount !== 'number' || split.amount < 0) {
        errors.push(`Split ${index + 1}: amount must be a non-negative number`);
      }
      if (
        split.split_type &&
        !['equal', 'exact', 'percentage', 'shares'].includes(split.split_type)
      ) {
        errors.push(`Split ${index + 1}: invalid split_type '${split.split_type}'`);
      }
    });

    // Validate total split amounts match expense amount
    if (data.amount && data.splits.length > 0) {
      const totalSplitAmount = data.splits.reduce((sum, split) => sum + (split.amount || 0), 0);
      if (Math.abs(totalSplitAmount - data.amount) > 0.01) {
        errors.push(
          `Total split amounts (${totalSplitAmount.toFixed(2)}) must equal expense amount (${data.amount.toFixed(2)})`
        );
      }
    }

    // Validate that expense is not split ONLY to the payer
    // (i.e., if there's only one person in splits and it's the payer, that's invalid)
    if (data.paid_by && data.splits.length > 0) {
      const uniqueSplitUserIds = [...new Set(data.splits.map((s) => s.user_id))];
      if (uniqueSplitUserIds.length === 1 && uniqueSplitUserIds[0] === data.paid_by) {
        errors.push(
          'Cannot create an expense that is only split to the payer. Please include at least one other person.'
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// =====================================================
// GET - Fetch all expenses for a group (OPTIMIZED)
// =====================================================
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

    // Get pagination params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Use service role client
    const serviceSupabase = createServiceRoleClient();

    // Verify user is a member of the group
    const membership = await validateGroupMembership(serviceSupabase, user.id, groupId);
    if (!membership) {
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 });
    }

    // OPTIMIZED: Fetch expenses WITHOUT profile joins (70% memory reduction)
    const {
      data: expenses,
      error: expensesError,
      count,
    } = await serviceSupabase
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
        expense_payers(
          id,
          amount,
          paid_by
        ),
        expense_splits(
          id,
          user_id,
          amount,
          split_type,
          percentage,
          shares
        )
      `,
        { count: 'exact' }
      )
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (expensesError) {
      console.error('Error fetching expenses:', expensesError);
      return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
    }

    // OPTIMIZED: Collect unique user IDs and fetch profiles ONCE
    const userIds = new Set<string>();
    expenses?.forEach((expense) => {
      userIds.add(expense.created_by);
      expense.expense_payers?.forEach((payer) => userIds.add(payer.paid_by));
      expense.expense_splits?.forEach((split) => userIds.add(split.user_id));
    });

    // Fetch all unique profiles in a single query
    const { data: profiles, error: profilesError } = await serviceSupabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', Array.from(userIds));

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      // Continue without profiles rather than failing
    }

    // Create a profile lookup map for O(1) access
    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    // Map profiles to expenses on the backend
    const enrichedExpenses = expenses?.map((expense) => ({
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
        expenses: enrichedExpenses || [],
        count: count || 0,
        page,
        limit,
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/groups/[groupId]/expenses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =====================================================
// POST - Create a new expense
// =====================================================
export async function POST(
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

    // Parse request body
    const body = await request.json();
    const { title, currency, paid_by, amount, splits } = body;

    // Ensure group_id matches the route parameter
    const expenseData = {
      title,
      group_id: groupId,
      paid_by,
      amount: typeof amount === 'string' ? parseFloat(amount) : amount,
      currency: currency || 'INR',
      splits: splits || [],
    };

    // Validate expense data
    const validation = validateExpenseData(expenseData);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Use service role client
    const serviceSupabase = createServiceRoleClient();

    // Verify user is a member of the group
    const membership = await validateGroupMembership(serviceSupabase, user.id, groupId);
    if (!membership) {
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 });
    }

    // Collect all user IDs (payer + split users)
    const allUserIds = [paid_by, ...splits.map((s: { user_id: string }) => s.user_id)];
    const uniqueUserIds = [...new Set(allUserIds)];

    // Validate all users are members of the group
    const userValidation = await validateAllUsersInGroup(serviceSupabase, uniqueUserIds, groupId);
    if (!userValidation.valid) {
      return NextResponse.json(
        {
          error: 'Some users are not members of this group',
          invalidUsers: userValidation.invalidUsers,
        },
        { status: 400 }
      );
    }

    // Prepare data for the upsert_expense_from_json function
    const functionPayload = {
      title: expenseData.title.trim(),
      group_id: groupId,
      created_by: user.id,
      currency: expenseData.currency,
      paid_by: expenseData.paid_by,
      amount: expenseData.amount,
      splits: expenseData.splits,
    };

    // Call the database function to create the expense
    const { data: expenseId, error: createError } = await serviceSupabase.rpc(
      'upsert_expense_from_json',
      {
        expense_json: functionPayload,
      }
    );

    if (createError) {
      console.error('Error creating expense:', createError);
      return NextResponse.json(
        {
          error: 'Failed to create expense',
          details: createError.message,
        },
        { status: 500 }
      );
    }

    // OPTIMIZED: Fetch the created expense WITHOUT profile joins
    const { data: createdExpense, error: fetchError } = await serviceSupabase
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
      `
      )
      .eq('id', expenseId)
      .single();

    if (fetchError) {
      console.error('Error fetching created expense:', fetchError);
      // Still return success since expense was created
      return NextResponse.json(
        {
          message: 'Expense created successfully',
          expenseId,
        },
        { status: 201 }
      );
    }

    // OPTIMIZED: Fetch profiles separately
    const userIds = new Set<string>([createdExpense.created_by]);
    createdExpense.expense_payers?.forEach((payer) => userIds.add(payer.paid_by));
    createdExpense.expense_splits?.forEach((split) => userIds.add(split.user_id));

    const { data: profiles } = await serviceSupabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', Array.from(userIds));

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    const enrichedExpense = {
      ...createdExpense,
      created_by_profile: profileMap.get(createdExpense.created_by) || null,
      expense_payers:
        createdExpense.expense_payers?.map((payer) => ({
          ...payer,
          payer_profile: profileMap.get(payer.paid_by) || null,
        })) || [],
      expense_splits:
        createdExpense.expense_splits?.map((split) => ({
          ...split,
          split_user_profile: profileMap.get(split.user_id) || null,
        })) || [],
    };

    return NextResponse.json(
      {
        message: 'Expense created successfully',
        expense: enrichedExpense,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/groups/[groupId]/expenses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =====================================================
// PUT - Update an existing expense
// =====================================================
export async function PUT(
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

    // Parse request body
    const body = await request.json();
    const { expense_id, title, currency, paid_by, amount, splits } = body;

    // Validate expense_id is provided
    if (!expense_id) {
      return NextResponse.json({ error: 'Expense ID is required for update' }, { status: 400 });
    }

    // Ensure group_id matches the route parameter
    const expenseData = {
      title,
      group_id: groupId,
      paid_by,
      amount: typeof amount === 'string' ? parseFloat(amount) : amount,
      currency: currency || 'INR',
      splits: splits || [],
    };

    // Validate expense data
    const validation = validateExpenseData(expenseData);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Use service role client
    const serviceSupabase = createServiceRoleClient();

    // Verify user is a member of the group
    const membership = await validateGroupMembership(serviceSupabase, user.id, groupId);
    if (!membership) {
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 });
    }

    // Verify the expense exists and belongs to this group
    const { data: existingExpense, error: expenseCheckError } = await serviceSupabase
      .from('expenses')
      .select('id, group_id, created_by')
      .eq('id', expense_id)
      .single();

    if (expenseCheckError || !existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    if (existingExpense.group_id !== groupId) {
      return NextResponse.json({ error: 'Expense does not belong to this group' }, { status: 400 });
    }

    // Collect all user IDs (payer + split users)
    const allUserIds = [paid_by, ...splits.map((s: { user_id: string }) => s.user_id)];
    const uniqueUserIds = [...new Set(allUserIds)];

    // Validate all users are members of the group
    const userValidation = await validateAllUsersInGroup(serviceSupabase, uniqueUserIds, groupId);
    if (!userValidation.valid) {
      return NextResponse.json(
        {
          error: 'Some users are not members of this group',
          invalidUsers: userValidation.invalidUsers,
        },
        { status: 400 }
      );
    }

    // Prepare data for the upsert_expense_from_json function
    const functionPayload = {
      expense_id: expense_id,
      title: expenseData.title.trim(),
      group_id: groupId,
      created_by: existingExpense.created_by, // Preserve original creator
      currency: expenseData.currency,
      paid_by: expenseData.paid_by,
      amount: expenseData.amount,
      splits: expenseData.splits,
    };

    // Call the database function to update the expense
    const { data: updatedExpenseId, error: updateError } = await serviceSupabase.rpc(
      'upsert_expense_from_json',
      {
        expense_json: functionPayload,
      }
    );

    if (updateError) {
      console.error('Error updating expense:', updateError);
      return NextResponse.json(
        {
          error: 'Failed to update expense',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    // OPTIMIZED: Fetch the updated expense WITHOUT profile joins
    const { data: updatedExpense, error: fetchError } = await serviceSupabase
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
      `
      )
      .eq('id', updatedExpenseId)
      .single();

    if (fetchError) {
      console.error('Error fetching updated expense:', fetchError);
      // Still return success since expense was updated
      return NextResponse.json(
        {
          message: 'Expense updated successfully',
          expenseId: updatedExpenseId,
        },
        { status: 200 }
      );
    }

    // OPTIMIZED: Fetch profiles separately
    const userIds = new Set<string>([updatedExpense.created_by]);
    updatedExpense.expense_payers?.forEach((payer) => userIds.add(payer.paid_by));
    updatedExpense.expense_splits?.forEach((split) => userIds.add(split.user_id));

    const { data: profiles } = await serviceSupabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', Array.from(userIds));

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    const enrichedExpense = {
      ...updatedExpense,
      created_by_profile: profileMap.get(updatedExpense.created_by) || null,
      expense_payers:
        updatedExpense.expense_payers?.map((payer) => ({
          ...payer,
          payer_profile: profileMap.get(payer.paid_by) || null,
        })) || [],
      expense_splits:
        updatedExpense.expense_splits?.map((split) => ({
          ...split,
          split_user_profile: profileMap.get(split.user_id) || null,
        })) || [],
    };

    return NextResponse.json(
      {
        message: 'Expense updated successfully',
        expense: enrichedExpense,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in PUT /api/groups/[groupId]/expenses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =====================================================
// DELETE - Delete an expense
// =====================================================
export async function DELETE(
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

    // Get expense ID from query params
    const { searchParams } = new URL(request.url);
    const expenseId = searchParams.get('expense_id');

    if (!expenseId) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
    }

    // Use service role client
    const serviceSupabase = createServiceRoleClient();

    // Verify user is a member of the group
    const membership = await validateGroupMembership(serviceSupabase, user.id, groupId);
    if (!membership) {
      return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 });
    }

    // Verify the expense exists and belongs to this group
    const { data: expense, error: expenseCheckError } = await serviceSupabase
      .from('expenses')
      .select('id, group_id, created_by')
      .eq('id', expenseId)
      .single();

    if (expenseCheckError || !expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    if (expense.group_id !== groupId) {
      return NextResponse.json({ error: 'Expense does not belong to this group' }, { status: 400 });
    }

    // Delete the expense (cascade will delete related payers and splits)
    const { error: deleteError } = await serviceSupabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);

    if (deleteError) {
      console.error('Error deleting expense:', deleteError);
      return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Expense deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error in DELETE /api/groups/[groupId]/expenses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
