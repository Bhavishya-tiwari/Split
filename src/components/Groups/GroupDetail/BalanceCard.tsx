'use client';

import { useSettlements } from '@/hooks/useSettlements';
import { Loader2, ArrowRight, TrendingDown, DollarSign } from 'lucide-react';

interface BalanceCardProps {
  groupId: string;
  currentUserId: string | null;
}

export default function BalanceCard({ groupId, currentUserId }: BalanceCardProps) {
  const { data, isLoading, error } = useSettlements(groupId);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load balance';
    const isFunctionError = errorMessage.includes('function') || errorMessage.includes('migration');
    
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Balance</h3>
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
            <TrendingDown className="h-6 w-6 text-red-600" />
          </div>
          <p className="text-red-600 text-sm font-semibold mb-1">{errorMessage}</p>
          {isFunctionError && (
            <p className="text-xs text-gray-500 mt-2">
              Please ensure the get_user_balance function is created in your database.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!data || !currentUserId) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Balance</h3>
        <p className="text-gray-500 text-sm">Please sign in to view your balance</p>
      </div>
    );
  }

  const { owes_to, owed_by, net_balance, total_paid, total_owed } = data;

  // Calculate net balances per user (combining owes_to and owed_by)
  const netBalances = new Map<string, { user_id: string; user_name: string; amount: number }>();

  // Add amounts from owes_to (negative - you owe them)
  owes_to.forEach((item) => {
    netBalances.set(item.user_id, {
      user_id: item.user_id,
      user_name: item.user_name,
      amount: -item.amount, // Negative because you owe them
    });
  });

  // Add amounts from owed_by (positive - they owe you)
  owed_by.forEach((item) => {
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

  // Convert to array and filter out zero balances
  const balanceDetails = Array.from(netBalances.values())
    .filter((item) => Math.abs(item.amount) > 0.01)
    .sort((a, b) => b.amount - a.amount); // Sort by amount (positive first)

  const hasDetails = balanceDetails.length > 0;
  const isSettled = Math.abs(net_balance) < 0.01 && !hasDetails;

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Your Balance</h3>

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
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      isPositive ? 'bg-green-50' : 'bg-red-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ArrowRight
                        className={`h-3 w-3 ${
                          isPositive ? 'text-green-500 rotate-180' : 'text-red-500'
                        }`}
                      />
                      <span className="text-sm text-gray-700">{item.user_name}</span>
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
                net_balance > 0.01
                  ? 'text-green-600'
                  : net_balance < -0.01
                    ? 'text-red-600'
                    : 'text-gray-600'
              }`}
            >
              {net_balance > 0.01 && '+'}
              ₹{net_balance.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
            <span>Paid: ₹{total_paid.toFixed(2)}</span>
            <span>Owed: ₹{total_owed.toFixed(2)}</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {net_balance > 0.01
              ? 'You are owed money'
              : net_balance < -0.01
                ? 'You owe money'
                : 'You are all settled'}
          </p>
        </div>
      </div>
    </div>
  );
}
