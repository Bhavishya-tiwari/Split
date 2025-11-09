import { NextRequest, NextResponse } from 'next/server';
import { createClientForServer } from '@/utils/supabase/server';
import { createServiceRoleClient } from '@/utils/supabase/service';

// PUT - Update user profile
export async function PUT(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { full_name, phone } = body;

    // Validation
    if (full_name !== undefined && full_name !== null) {
      // If full_name is provided, it should be a string
      if (typeof full_name !== 'string') {
        return NextResponse.json({ error: 'Full name must be a string' }, { status: 400 });
      }

      // Trim and check if it's too long
      const trimmedName = full_name.trim();
      if (trimmedName.length > 100) {
        return NextResponse.json(
          { error: 'Full name must be 100 characters or less' },
          { status: 400 }
        );
      }

      // Optional: Check for valid characters (letters, spaces, hyphens, apostrophes)
      if (trimmedName && !/^[a-zA-Z\s\-']+$/.test(trimmedName)) {
        return NextResponse.json(
          { error: 'Full name can only contain letters, spaces, hyphens, and apostrophes' },
          { status: 400 }
        );
      }
    }

    if (phone !== undefined && phone !== null) {
      // If phone is provided, it should be a string
      if (typeof phone !== 'string') {
        return NextResponse.json({ error: 'Phone number must be a string' }, { status: 400 });
      }

      // Trim and validate phone number format
      const trimmedPhone = phone.trim();
      if (trimmedPhone.length > 20) {
        return NextResponse.json(
          { error: 'Phone number must be 20 characters or less' },
          { status: 400 }
        );
      }

      // Optional: Check for valid phone format (numbers, +, -, spaces, parentheses)
      if (trimmedPhone && !/^[\d\s\-+()]+$/.test(trimmedPhone)) {
        return NextResponse.json(
          { error: 'Phone number can only contain numbers, spaces, +, -, and parentheses' },
          { status: 400 }
        );
      }
    }

    // Use service role client for database operations
    const serviceSupabase = createServiceRoleClient();

    // Update or insert profile
    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: full_name?.trim() || null,
        phone: phone?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ profile }, { status: 200 });
  } catch (error) {
    console.error('Error in PUT /api/profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get user profile
export async function GET(request: NextRequest) {
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

    // Use service role client for database operations
    const serviceSupabase = createServiceRoleClient();

    // Fetch profile
    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    // If no profile exists, return user data from auth
    if (!profile) {
      return NextResponse.json(
        {
          profile: {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || null,
            phone: user.user_metadata?.phone || null,
            created_at: user.created_at,
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ profile }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
