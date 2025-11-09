'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Pencil, Trash2 } from 'lucide-react';
import { GroupMember } from './types';
import { useUpdateExpense, useDeleteExpense, type Expense } from '@/hooks/useExpenses';
import {
  Currency,
  SplitType,
  DEFAULT_SPLIT_TYPE,
  SPLIT_TYPE_CONFIG,
  getSplitTypeDescription,
} from './constants';
import ExpenseFormFields from './ExpenseFormFields';
import SplitMemberSelector from './SplitMemberSelector';
import SplitSummary from './SplitSummary';

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: GroupMember[];
  groupId: string;
  currentUserId: string | null;
  expense: Expense | null;
  onExpenseUpdated?: () => void;
  onExpenseDeleted?: () => void;
}

interface ExpenseFormData {
  title: string;
  currency: Currency;
  paidBy: string;
  amount: string;
}

export default function EditExpenseModal({
  isOpen,
  onClose,
  members,
  groupId,
  expense,
  onExpenseUpdated,
  onExpenseDeleted
}: EditExpenseModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [splitType, setSplitType] = useState<SplitType>(DEFAULT_SPLIT_TYPE);
  const [selectedSplitMembers, setSelectedSplitMembers] = useState<Set<string>>(new Set());
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  
  // REACT QUERY: Use mutation hooks
  const updateExpense = useUpdateExpense(groupId);
  const deleteExpense = useDeleteExpense(groupId);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<ExpenseFormData>();

  const amount = watch('amount');
  const paidBy = watch('paidBy');
  const currency = watch('currency');
  const totalPaid = parseFloat(amount) || 0;

  useEffect(() => {
    if (isOpen && expense) {
      setIsEditing(false);
      const firstSplit = expense.expense_splits[0];
      const detectedSplitType = firstSplit?.split_type === 'exact' ? SplitType.EXACT : SplitType.EQUAL;
      setSplitType(detectedSplitType);

      const splitUserIds = new Set(expense.expense_splits.map(s => s.user_id));
      setSelectedSplitMembers(splitUserIds);

      if (detectedSplitType === SplitType.EXACT) {
        const amounts: Record<string, string> = {};
        expense.expense_splits.forEach(split => {
          amounts[split.user_id] = split.amount.toString();
        });
        setExactAmounts(amounts);
      }

      const payer = expense.expense_payers[0];
      reset({
        title: expense.title,
        currency: expense.currency as Currency,
        paidBy: payer?.paid_by || '',
        amount: payer?.amount.toString() || '',
      });
    }
  }, [isOpen, expense, reset]);

  if (!isOpen || !expense) return null;

  const handleClose = () => {
    setIsEditing(false);
    setSubmitError('');
    setSplitType(DEFAULT_SPLIT_TYPE);
    setSelectedSplitMembers(new Set());
    setExactAmounts({});
    reset();
    onClose();
  };

  const handleDelete = async () => {
    if (!expense) return;
    
    if (!confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
      return;
    }

    setSubmitError('');

    try {
      const response = await fetch(`/api/groups/${groupId}/expenses?expense_id=${expense.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete expense');
      }
      
      if (onExpenseDeleted) {
        onExpenseDeleted();
      }
      handleClose();
    } catch (err: unknown) {
      console.error('Error deleting expense:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to delete expense');
    }
  };

  const toggleSplitMember = (userId: string) => {
    const newSelected = new Set(selectedSplitMembers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
      const newExactAmounts = { ...exactAmounts };
      delete newExactAmounts[userId];
      setExactAmounts(newExactAmounts);
    } else {
      newSelected.add(userId);
    }
    setSelectedSplitMembers(newSelected);
  };

  const updateExactAmount = (userId: string, amount: string) => {
    setExactAmounts({ ...exactAmounts, [userId]: amount });
  };

  const getTotalExactAmounts = (): number => {
    return Object.values(exactAmounts).reduce((sum, amt) => sum + (parseFloat(amt) || 0), 0);
  };

  const onSubmit = async (data: ExpenseFormData) => {
    setSubmitError('');

    try{
      const totalAmount = parseFloat(data.amount);
      const memberIds = Array.from(selectedSplitMembers);

      if (memberIds.length === 0) {
        throw new Error('Please select at least one member to split the expense with');
      }

      if (memberIds.length === 1 && memberIds[0] === paidBy) {
        throw new Error('Cannot split an expense only to the payer. Please include at least one other member.');
      }

      let splits;
      if (splitType === SplitType.EQUAL) {
        const baseAmount = Math.floor((totalAmount / memberIds.length) * 100) / 100; // Round down to 2 decimals
        const totalBase = baseAmount * memberIds.length;
        const remainder = Math.round((totalAmount - totalBase) * 100) / 100; // Calculate remainder
        
        splits = memberIds.map((userId, index) => {
          // Add remainder to the last split to ensure exact total
          const amount = index === memberIds.length - 1 
            ? parseFloat((baseAmount + remainder).toFixed(2))
            : parseFloat(baseAmount.toFixed(2));
          
          return {
            user_id: userId,
            amount: amount,
            split_type: SplitType.EQUAL,
          };
        });
      } else {
        const totalExact = getTotalExactAmounts();
        if (Math.abs(totalExact - totalAmount) > 0.01) {
          throw new Error(`Exact amounts must equal total paid`);
        }
        splits = memberIds.map(userId => ({
          user_id: userId,
          amount: parseFloat(exactAmounts[userId]),
          split_type: SplitType.EXACT,
        }));
      }

      const expenseData = {
        expense_id: expense.id,
        group_id: groupId,
        title: data.title.trim(),
        currency: data.currency,
        paid_by: data.paidBy,
        amount: totalAmount,
        splits
      };

      const response = await fetch(`/api/groups/${groupId}/expenses`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update expense');
      }
      
      if (onExpenseUpdated) onExpenseUpdated();
      handleClose();
    } catch (err: unknown) {
      console.error('Error updating expense:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to update expense');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose} />
        
        <div className="relative bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Expense' : 'View Expense'}
            </h2>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit expense"
                    disabled={deleteExpense.isPending}
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteExpense.isPending}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete expense"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </>
              )}
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              <ExpenseFormFields
                register={register}
                errors={errors}
                members={members}
                isDisabled={!isEditing || updateExpense.isPending}
                watchedAmount={amount}
                watchedCurrency={currency}
              />

              <SplitMemberSelector
                members={members}
                selectedMembers={selectedSplitMembers}
                onToggleMember={toggleSplitMember}
                splitType={splitType}
                exactAmounts={exactAmounts}
                onUpdateExactAmount={updateExactAmount}
                totalAmount={totalPaid}
                currency={currency}
                isDisabled={!isEditing || updateExpense.isPending}
                paidBy={paidBy}
              />

              <SplitSummary
                splitType={splitType}
                selectedMembersCount={selectedSplitMembers.size}
                totalAmount={totalPaid}
                totalExactAmounts={getTotalExactAmounts()}
                currency={currency}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Split Type</label>
                <select
                  value={splitType}
                  onChange={(e) => setSplitType(e.target.value as SplitType)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-700"
                  disabled={!isEditing || updateExpense.isPending}
                >
                  {Object.entries(SPLIT_TYPE_CONFIG).map(([type, config]) => (
                    <option key={type} value={type}>{config.label}</option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-2">{getSplitTypeDescription(splitType)}</p>
              </div>

              {submitError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{submitError}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
                >
                  Close
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
                    disabled={updateExpense.isPending}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateExpense.isPending || selectedSplitMembers.size === 0 || (selectedSplitMembers.size === 1 && Array.from(selectedSplitMembers)[0] === paidBy)}
                    className="flex-1 px-4 py-3 bg-linear-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updateExpense.isPending ? 'Updating...' : 'Update Expense'}
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

