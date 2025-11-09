import { NextRequest, NextResponse } from 'next/server'
import { createClientForServer } from '@/utils/supabase/server'
import { createServiceRoleClient } from '@/utils/supabase/service'

// GET - Fetch all groups for the authenticated user, or a single group by ID
export async function GET(request: NextRequest) {
  try {
    // Authenticate the user
    const supabase = await createClientForServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if fetching a single group
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('id')

    // Use service role client for database operations (bypasses RLS)
    const serviceSupabase = createServiceRoleClient()

    // If groupId is provided, fetch single group
    if (groupId) {
      // Check if user is a member of the group
      const { data: membership, error: membershipError } = await serviceSupabase
        .from('user_group_mapping')
        .select('role')
        .eq('user_id', user.id)
        .eq('group_id', groupId)
        .single()

      if (membershipError || !membership) {
        return NextResponse.json(
          { error: 'Group not found or you do not have access' },
          { status: 404 }
        )
      }

      // Fetch the group details
      const { data: group, error: groupError } = await serviceSupabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single()

      if (groupError) {
        console.error('Error fetching group:', groupError)
        return NextResponse.json(
          { error: 'Failed to fetch group' },
          { status: 500 }
        )
      }

      return NextResponse.json({ group, userRole: membership.role }, { status: 200 })
    }

    // Fetch all groups the user is a member of
    const { data, error } = await serviceSupabase
      .from('user_group_mapping')
      .select(`
        role,
        joined_at,
        groups (
          id,
          name,
          description,
          icon,
          created_by,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false })

    if (error) {
      console.error('Error fetching groups:', error)
      return NextResponse.json(
        { error: 'Failed to fetch groups' },
        { status: 500 }
      )
    }

    // Transform the data to extract groups
    const groups = data?.map((item) => item.groups) || []

    return NextResponse.json({ groups }, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/groups:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new group
export async function POST(request: NextRequest) {
  try {
    // Authenticate the user using server client
    const supabase = await createClientForServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { name, description, icon } = body

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      )
    }

    // Use service role client for database operations (bypasses RLS)
    const serviceSupabase = createServiceRoleClient()

    // Create the group
    const { data: group, error: groupError } = await serviceSupabase
      .from('groups')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon || 'Users',
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (groupError) {
      console.error('Error creating group:', groupError)
      return NextResponse.json(
        { error: 'Failed to create group' },
        { status: 500 }
      )
    }

    // Add creator to user_group_mapping as admin
    const { error: mappingError } = await serviceSupabase
      .from('user_group_mapping')
      .insert({
        user_id: user.id,
        group_id: group.id,
        role: 'admin',
        joined_at: new Date().toISOString()
      })

    if (mappingError) {
      console.error('Error creating group mapping:', mappingError)
      // Rollback: delete the group if mapping fails
      await serviceSupabase.from('groups').delete().eq('id', group.id)
      return NextResponse.json(
        { error: 'Failed to create group' },
        { status: 500 }
      )
    }

    return NextResponse.json({ group }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/groups:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update a group
export async function PUT(request: NextRequest) {
  try {
    // Authenticate the user
    const supabase = await createClientForServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { id, name, description, icon } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      )
    }

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      )
    }

    // Use service role client
    const serviceSupabase = createServiceRoleClient()

    // Check if user is admin of the group
    const { data: membership, error: membershipError } = await serviceSupabase
      .from('user_group_mapping')
      .select('role')
      .eq('user_id', user.id)
      .eq('group_id', id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 403 }
      )
    }

    if (membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can update groups' },
        { status: 403 }
      )
    }

    // Update the group
    const { data: group, error: updateError } = await serviceSupabase
      .from('groups')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        icon: icon || 'Users',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating group:', updateError)
      return NextResponse.json(
        { error: 'Failed to update group' },
        { status: 500 }
      )
    }

    return NextResponse.json({ group }, { status: 200 })
  } catch (error) {
    console.error('Error in PUT /api/groups:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a group
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate the user
    const supabase = await createClientForServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get group ID from query params
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      )
    }

    // Use service role client
    const serviceSupabase = createServiceRoleClient()

    // Check if user is admin of the group
    const { data: membership, error: membershipError } = await serviceSupabase
      .from('user_group_mapping')
      .select('role')
      .eq('user_id', user.id)
      .eq('group_id', id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 403 }
      )
    }

    if (membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can delete groups' },
        { status: 403 }
      )
    }

    // Check if the group has any expenses
    const { data: expenses, error: expensesCheckError } = await serviceSupabase
      .from('expenses')
      .select('id')
      .eq('group_id', id)
      .limit(1)

    if (expensesCheckError) {
      console.error('Error checking group expenses:', expensesCheckError)
      return NextResponse.json(
        { error: 'Failed to verify if group has expenses' },
        { status: 500 }
      )
    }

    if (expenses && expenses.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete group that has expenses. Please delete all expenses first.',
          hasExpenses: true
        },
        { status: 400 }
      )
    }

    // Delete the group (mappings will be cascade deleted)
    const { error: deleteError } = await serviceSupabase
      .from('groups')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting group:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete group' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Group deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in DELETE /api/groups:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

