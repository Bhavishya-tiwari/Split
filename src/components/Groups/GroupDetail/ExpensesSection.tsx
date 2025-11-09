'use client';

import { useState } from 'react';
import { DollarSign, Loader2, User } from 'lucide-react';
import { GroupMember } from './types';
import AddExpenseModal from './AddExpenseModal';
import EditExpenseModal from './EditExpenseModal';
import { getCurrencySymbol, Currency } from './constants';
import { useExpenses, type Expense } from '@/hooks/useExpenses';

interface ExpensesSectionProps {
  members: GroupMember[];
  groupId: string;
  currentUserId: string | null;
}

export default function ExpensesSection({ members, groupId, currentUserId }: ExpensesSectionProps) {
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showEditExpenseModal, setShowEditExpenseModal] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageLimit = 50; // Show 50 expenses per page

  // REACT QUERY: Automatic caching, loading states, and pagination
  const { data, isLoading, error } = useExpenses(groupId, currentPage, pageLimit);

  const expenses = data?.expenses || [];
  const totalPages = data?.totalPages || 1;
  const totalCount = data?.count || 0;

  const handleExpenseAdded = () => {
    // React Query will automatically invalidate and refetch
    // Reset to page 1 when a new expense is added
    setCurrentPage(1);
  };

  const handleExpenseUpdated = () => {
    // React Query will automatically invalidate and refetch
    // Stay on current page when expense is updated
  };

  const handleExpenseDeleted = () => {
    // React Query will automatically invalidate and refetch
    // If we deleted the last item on a page, go back one page
    if (expenses.length === 1 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
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
            <p className="text-red-600 text-sm">
              {error instanceof Error ? error.message : 'Failed to load expenses'}
            </p>
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
          <>
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
                            Paid by: {payer.payer_profile?.full_name || payer.payer_profile?.email || 'Unknown'}
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
                                {split.split_user_profile?.full_name || split.split_user_profile?.email || 'Unknown'}
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
                          {expense.created_by_profile?.full_name || expense.created_by_profile?.email || 'Unknown'}
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

            {/* OPTIMIZED: Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * pageLimit) + 1} to {Math.min(currentPage * pageLimit, totalCount)} of {totalCount} expenses
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
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

