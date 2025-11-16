'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Loader2, ArrowRight, TrendingDown, DollarSign } from 'lucide-react';
import { createClientForBrowser } from '@/utils/supabase/client';
import { useFriendsBalances } from '@/hooks/useFriendsBalances';

export default function FriendsPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data, isLoading, error } = useFriendsBalances();

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClientForBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/');
        return;
      }

      setLoading(false);
    };

    checkUser();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Calculate net balances per user (combining owes_to and owed_by)
  const netBalances = new Map<string, { user_id: string; user_name: string; amount: number }>();

  if (data) {
    // Add amounts from owes_to (negative - you owe them)
    data.owes_to.forEach((item) => {
      netBalances.set(item.user_id, {
        user_id: item.user_id,
        user_name: item.user_name,
        amount: -item.amount, // Negative because you owe them
      });
    });

    // Add amounts from owed_by (positive - they owe you)
    data.owed_by.forEach((item) => {
      const existing = netBalances.get(item.user_id);
      if (existing) {
        // If user exists in both lists, calculate net
        existing.amount += item.amount;
      } else {
        // New entry
        netBalances.set(item.user_id, {
          user_id: item.user_id,
          user_name: item.user_name,
          amount: item.amount, // Positive because they owe you
        });
      }
    });
  }

  // Convert to array and filter out zero balances
  const balanceDetails = Array.from(netBalances.values())
    .filter((item) => Math.abs(item.amount) > 0.01)
    .sort((a, b) => b.amount - a.amount); // Sort by amount (positive first)

  const hasDetails = balanceDetails.length > 0;
  const isSettled = data && Math.abs(data.net_balance) < 0.01 && !hasDetails;
  const hasNoFriends = !isLoading && !error && (!data || (!hasDetails && isSettled && data.total_paid === 0 && data.total_owed === 0));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Friends</h2>
        <p className="text-gray-600">View your balances across all groups</p>
      </div>

      {/* Total Balance Card */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Total Balance</h3>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
          </div>
        )}

        {error && (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <p className="text-red-600 text-sm font-semibold mb-1">
              {error instanceof Error ? error.message : 'Failed to load balance'}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Please try refreshing the page.
            </p>
          </div>
        )}

        {!isLoading && !error && data && (
          <div className="space-y-6">
            {/* Combined Details Section */}
            {hasDetails && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="h-4 w-4 text-gray-600" />
                  <h4 className="text-sm font-semibold text-gray-700">Details</h4>
                </div>
                <div className="space-y-2">
                  {balanceDetails.map((item) => {
                    const isPositive = item.amount > 0;
                    return (
                      <div
                        key={item.user_id}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          isPositive ? 'bg-green-50' : 'bg-red-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <ArrowRight
                            className={`h-3 w-3 ${
                              isPositive ? 'text-green-500 rotate-180' : 'text-red-500'
                            }`}
                          />
                          <span className="text-sm font-medium text-gray-700">{item.user_name}</span>
                        </div>
                        <span
                          className={`text-sm font-semibold ${
                            isPositive ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {isPositive ? '+' : ''}₹{Math.abs(item.amount).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All Settled Up */}
            {isSettled && (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm font-semibold text-green-600">All settled up! 🎉</p>
              </div>
            )}

            {/* Final Summary */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-semibold text-gray-900">Net Balance</span>
                <span
                  className={`text-xl font-bold ${
                    data.net_balance > 0.01
                      ? 'text-green-600'
                      : data.net_balance < -0.01
                        ? 'text-red-600'
                        : 'text-gray-600'
                  }`}
                >
                  {data.net_balance > 0.01 && '+'}
                  ₹{data.net_balance.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                <span>Paid: ₹{data.total_paid.toFixed(2)}</span>
                <span>Owed: ₹{data.total_owed.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {data.net_balance > 0.01
                  ? 'You are owed money'
                  : data.net_balance < -0.01
                    ? 'You owe money'
                    : 'You are all settled'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Friends List */}
      {hasNoFriends && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">Your Friends</h3>
          </div>
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 mb-4">No friends with balances yet</p>
            <p className="text-sm text-gray-500">
              Start splitting expenses in groups to see balances here
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
