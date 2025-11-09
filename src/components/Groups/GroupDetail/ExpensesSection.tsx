'use client';

import { useState, useEffect, useCallback } from 'react';
import { DollarSign, Loader2, User } from 'lucide-react';
import { GroupMember } from './types';
import AddExpenseModal from './AddExpenseModal';
import EditExpenseModal from './EditExpenseModal';
import { getCurrencySymbol, Currency } from './constants';
import axios from 'axios';

interface ExpensesSectionProps {
  members: GroupMember[];
  groupId: string;
  currentUserId: string | null;
}

interface ExpensePayer {
  id: string;
  amount: number;
  paid_by: string;
  payer_profile: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface ExpenseSplit {
  id: string;
  user_id: string;
  amount: number;
  split_type: string;
  percentage: number | null;
  shares: number | null;
  split_user_profile: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface Expense {
  id: string;
  title: string;
  group_id: string;
  currency: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  created_by_profile: {
    id: string;
    full_name: string;
    email: string;
  };
  expense_payers: ExpensePayer[];
  expense_splits: ExpenseSplit[];
}

export default function ExpensesSection({ members, groupId, currentUserId }: ExpensesSectionProps) {
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showEditExpenseModal, setShowEditExpenseModal] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get(`/api/groups/${groupId}/expenses`);
      setExpenses(response.data.expenses || []);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Failed to load expenses');
      } else {
        setError('Failed to load expenses');
      }
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (groupId) {
      fetchExpenses();
    }
  }, [groupId, fetchExpenses]);

  const handleExpenseAdded = () => {
    fetchExpenses();
  };

  const handleExpenseUpdated = () => {
    fetchExpenses();
  };

  const handleExpenseDeleted = () => {
    fetchExpenses();
  };

  const handleEditExpense = (expense: Expense) => {
    setExpenseToEdit(expense);
    setShowEditExpenseModal(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalAmount = (expense: Expense): number => {
    return expense.expense_payers.reduce((sum, payer) => sum + payer.amount, 0);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Expenses</h3>
          <button
            onClick={() => setShowAddExpenseModal(true)}
            className="px-4 py-2 bg-linear-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md"
          >
            Add Expense
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={fetchExpenses}
              className="mt-2 text-red-700 underline text-sm font-medium"
            >
              Try again
            </button>
          </div>
        )}
        
        {/* Empty State */}
        {!isLoading && !error && expenses.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-gray-600 font-medium">No expenses yet</p>
            <p className="text-sm text-gray-400 mt-1">Add your first expense to get started</p>
          </div>
        )}

        {/* Expenses List */}
        {!isLoading && !error && expenses.length > 0 && (
          <div className="space-y-4">
            {expenses.map((expense) => {
              const totalAmount = getTotalAmount(expense);
              const payer = expense.expense_payers[0]; // Assuming single payer for now
              
              return (
                <div
                  key={expense.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer"
                  onClick={() => handleEditExpense(expense)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900">{expense.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(expense.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className="text-2xl font-bold text-emerald-600">
                        {getCurrencySymbol(expense.currency as Currency)} {totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Payer Info */}
                  {payer && (
                    <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">
                          Paid by: {payer.payer_profile.full_name || payer.payer_profile.email}
                        </span>
                        <span className="text-sm text-blue-700 ml-auto">
                          {getCurrencySymbol(expense.currency as Currency)} {payer.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Splits */}
                  {expense.expense_splits.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                        Split Among ({expense.expense_splits.length})
                      </p>
                      <div className="space-y-2">
                        {expense.expense_splits.map((split) => (
                          <div
                            key={split.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <span className="text-sm text-gray-700">
                              {split.split_user_profile.full_name || split.split_user_profile.email}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 px-2 py-1 bg-white rounded border border-gray-200">
                                {split.split_type}
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {getCurrencySymbol(expense.currency as Currency)} {split.amount.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Creator Info */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Created by{' '}
                      <span className="font-medium">
                        {expense.created_by_profile.full_name || expense.created_by_profile.email}
                      </span>
                      {expense.updated_at !== expense.created_at && (
                        <span className="ml-2">
                          • Updated {formatDate(expense.updated_at)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddExpenseModal
        isOpen={showAddExpenseModal}
        onClose={() => setShowAddExpenseModal(false)}
        members={members}
        groupId={groupId}
        currentUserId={currentUserId}
        onExpenseAdded={handleExpenseAdded}
      />

      <EditExpenseModal
        isOpen={showEditExpenseModal}
        onClose={() => {
          setShowEditExpenseModal(false);
          setExpenseToEdit(null);
        }}
        members={members}
        groupId={groupId}
        currentUserId={currentUserId}
        expense={expenseToEdit}
        onExpenseUpdated={handleExpenseUpdated}
        onExpenseDeleted={handleExpenseDeleted}
      />
    </>
  );
}

