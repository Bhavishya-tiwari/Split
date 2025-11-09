'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { GroupMember } from './types';
import axios from 'axios';
import {
  Currency,
  SplitType,
  DEFAULT_CURRENCY,
  DEFAULT_SPLIT_TYPE,
  SPLIT_TYPE_CONFIG,
  getSplitTypeDescription,
} from './constants';
import ExpenseFormFields from './ExpenseFormFields';
import SplitMemberSelector from './SplitMemberSelector';
import SplitSummary from './SplitSummary';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: GroupMember[];
  groupId: string;
  currentUserId: string | null;
  onExpenseAdded?: () => void;
}

interface ExpenseFormData {
  title: string;
  currency: Currency;
  paidBy: string;
  amount: string;
}

export default function AddExpenseModal({
  isOpen,
  onClose,
  members,
  groupId,
  currentUserId,
  onExpenseAdded
}: AddExpenseModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [splitType, setSplitType] = useState<SplitType>(DEFAULT_SPLIT_TYPE);
  const [selectedSplitMembers, setSelectedSplitMembers] = useState<Set<string>>(new Set());
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ExpenseFormData>({
    defaultValues: {
      title: '',
      currency: DEFAULT_CURRENCY,
      paidBy: currentUserId || '',
      amount: '',
    }
  });

  const amount = watch('amount');
  const paidBy = watch('paidBy');
  const currency = watch('currency');
  const totalPaid = parseFloat(amount) || 0;

  if (!isOpen) return null;

  const handleClose = () => {
    setSubmitError('');
    setSplitType(DEFAULT_SPLIT_TYPE);
    setSelectedSplitMembers(new Set());
    setExactAmounts({});
    onClose();
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
    setIsSubmitting(true);

    try {
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
        group_id: groupId,
        title: data.title.trim(),
        currency: data.currency,
        paid_by: data.paidBy,
        amount: totalAmount,
        splits
      };

      const response = await axios.post(`/api/groups/${groupId}/expenses`, expenseData);
      
      if (response.status === 201) {
        if (onExpenseAdded) onExpenseAdded();
        handleClose();
      }
    } catch (err: unknown) {
      console.error('Error creating expense:', err);
      if (err instanceof Error) {
        setSubmitError(err.message);
      } else if (axios.isAxiosError(err)) {
        setSubmitError(err.response?.data?.error || 'Failed to create expense');
      } else {
        setSubmitError('Failed to create expense');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose} />
        
        <div className="relative bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Add New Expense</h2>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              <ExpenseFormFields
                register={register}
                errors={errors}
                members={members}
                isDisabled={isSubmitting}
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
                isDisabled={isSubmitting}
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  disabled={isSubmitting}
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
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || selectedSplitMembers.size === 0 || (selectedSplitMembers.size === 1 && Array.from(selectedSplitMembers)[0] === paidBy)}
                  className="flex-1 px-4 py-3 bg-linear-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating...' : 'Create Expense'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

