import { NextRequest, NextResponse } from 'next/server';
import { createClientForServer } from '@/utils/supabase/server';
import { createServiceRoleClient } from '@/utils/supabase/service';

interface UserDebt {
  user_id: string;
  amount: number;
}

interface UserBalanceResponse {
  user_id: string;
  total_paid: number;
  total_owed: number;
  net_balance: number;
  owes_to: UserDebt[];
  owed_by: UserDebt[];
}

interface EnrichedUserDebt {
  user_id: string;
  user_name: string;
  amount: number;
}

interface FriendsBalanceResponse {
  user_id: string;
  total_paid: number;
  total_owed: number;
  net_balance: number;
  owes_to: EnrichedUserDebt[];
  owed_by: EnrichedUserDebt[];
  computed_at: string;
}

// Force dynamic rendering - prevent Next.js from caching this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/friends
 * Returns total balance details for the authenticated user across all groups
 * Shows who they owe and who owes them (aggregated across all groups)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClientForServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Call SQL function to get user's total balances across all groups
    const serviceSupabase = createServiceRoleClient();
    const { data: balanceData, error: balanceError } = await serviceSupabase.rpc(
      'get_user_total_balances',
      {
        p_user_id: userId,
      }
    );

    if (balanceError) {
      const errorMessage = balanceError.message || 'Unknown error';
      const errorDetails = balanceError.details || '';
      const errorHint = balanceError.hint || '';
      
      if (errorMessage.includes('function') && errorMessage.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'Database function not found. Please run the get_user_total_balances migration.',
            details: errorMessage 
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch balances',
          details: errorMessage,
          hint: errorHint || errorDetails
        },
        { status: 500 }
      );
    }

    // Handle case where balanceData is null or empty
    if (!balanceData || (Array.isArray(balanceData) && balanceData.length === 0)) {
      return NextResponse.json(
        {
          user_id: userId,
          total_paid: 0,
          total_owed: 0,
          net_balance: 0,
          owes_to: [],
          owed_by: [],
          computed_at: new Date().toISOString(),
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        }
      );
    }

    const balance = balanceData as UserBalanceResponse[];

    if (!balance || balance.length === 0) {
      return NextResponse.json(
        {
          user_id: userId,
          total_paid: 0,
          total_owed: 0,
          net_balance: 0,
          owes_to: [],
          owed_by: [],
          computed_at: new Date().toISOString(),
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        }
      );
    }

    const userBalance = balance[0];

    // Get all user IDs from owes_to and owed_by
    const userIds = [
      ...(userBalance.owes_to || []).map((d) => d.user_id),
      ...(userBalance.owed_by || []).map((d) => d.user_id),
    ];

    // Fetch profiles for users in the debt/credit lists
    let profiles: Array<{ id: string; full_name: string | null; email: string | null }> = [];
    
    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await serviceSupabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', [...new Set(userIds)]);

      if (!profilesError && profilesData) {
        profiles = profilesData.map((profile) => ({
          id: profile.id,
          full_name: profile.full_name || null,
          email: profile.email || null,
        }));
      }
    }

    // Helper function to get user name
    const getUserName = (userId: string): string => {
      const profile = profiles.find((p) => p.id === userId);
      return profile?.full_name || profile?.email || `User ${userId.substring(0, 8)}`;
    };

    // Enrich owes_to with user names
    const enrichedOwesTo: EnrichedUserDebt[] = (userBalance.owes_to || []).map((debt) => ({
      user_id: debt.user_id,
      user_name: getUserName(debt.user_id),
      amount: parseFloat(String(debt.amount)),
    }));

    // Enrich owed_by with user names
    const enrichedOwedBy: EnrichedUserDebt[] = (userBalance.owed_by || []).map((credit) => ({
      user_id: credit.user_id,
      user_name: getUserName(credit.user_id),
      amount: parseFloat(String(credit.amount)),
    }));

    // Return enriched response
    const response: FriendsBalanceResponse = {
      user_id: userBalance.user_id,
      total_paid: parseFloat(String(userBalance.total_paid)),
      total_owed: parseFloat(String(userBalance.total_owed)),
      net_balance: parseFloat(String(userBalance.net_balance)),
      owes_to: enrichedOwesTo,
      owed_by: enrichedOwedBy,
      computed_at: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error in friends route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

