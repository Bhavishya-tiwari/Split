'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Edit2 } from 'lucide-react';
import { GroupMember } from './types';
import axios from 'axios';
import {
  Currency,
  SplitType,
  DEFAULT_SPLIT_TYPE,
  CURRENCY_CONFIG,
  SPLIT_TYPE_CONFIG,
  getCurrencySymbol,
  getSplitTypeDescription,
} from './constants';

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: GroupMember[];
  groupId: string;
  currentUserId: string | null;
  expense: ExpenseToEdit | null;
  onExpenseUpdated?: () => void;
}

interface ExpenseToEdit {
  id: string;
  title: string;
  currency: string;
  expense_payers: Array<{
    paid_by: string;
    amount: number;
  }>;
  expense_splits: Array<{
    user_id: string;
    amount: number;
    split_type: string;
  }>;
}

interface SplitInput {
  userId: string;
  splitType: SplitType;
  value?: string;
}

interface ExpenseFormData {
  title: string;
  currency: Currency;
  paidBy: string;
  amount: string;
  splits: SplitInput[];
}

export default function EditExpenseModal({
  isOpen,
  onClose,
  members,
  groupId,
  currentUserId,
  expense,
  onExpenseUpdated
}: EditExpenseModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [splitType, setSplitType] = useState<SplitType>(DEFAULT_SPLIT_TYPE);
  const [selectedSplitMembers, setSelectedSplitMembers] = useState<Set<string>>(new Set());
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});

  // Initialize form with expense data
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<ExpenseFormData>();

  // Load expense data when modal opens
  useEffect(() => {
    if (isOpen && expense) {
      // Reset to view mode when modal opens
      setIsEditing(false);
      
      // Determine split type from existing splits
      const firstSplit = expense.expense_splits[0];
      const detectedSplitType = firstSplit?.split_type === 'exact' ? SplitType.EXACT : SplitType.EQUAL;
      setSplitType(detectedSplitType);

      // Set selected members and amounts
      const splitUserIds = new Set(expense.expense_splits.map(s => s.user_id));
      setSelectedSplitMembers(splitUserIds);

      // For exact splits, populate amounts
      if (detectedSplitType === SplitType.EXACT) {
        const amounts: Record<string, string> = {};
        expense.expense_splits.forEach(split => {
          amounts[split.user_id] = split.amount.toString();
        });
        setExactAmounts(amounts);
      }

      // Reset form with expense data
      const payer = expense.expense_payers[0];
      reset({
        title: expense.title,
        currency: expense.currency as Currency,
        paidBy: payer?.paid_by || '',
        amount: payer?.amount.toString() || '',
      });
    }
  }, [isOpen, expense, reset]);

  const amount = watch('amount');
  const totalPaid = parseFloat(amount) || 0;

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

  const handleEnableEditing = () => {
    setIsEditing(true);
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
    setExactAmounts({
      ...exactAmounts,
      [userId]: amount
    });
  };

  const getTotalExactAmounts = (): number => {
    return Object.values(exactAmounts).reduce((sum, amount) => {
      return sum + (parseFloat(amount) || 0);
    }, 0);
  };

  const calculateSplits = (): SplitInput[] => {
    const splits: SplitInput[] = [];
    const memberIds = Array.from(selectedSplitMembers);
    
    if (memberIds.length === 0) {
      throw new Error('Please select at least one member to split the expense with');
    }

    const paidBy = watch('paidBy');
    if (memberIds.length === 1 && memberIds[0] === paidBy) {
      const payerMember = members.find(m => m.profiles.id === paidBy);
      const payerName = payerMember?.profiles.display_name || payerMember?.profiles.email || 'the payer';
      throw new Error(`Cannot split an expense only to ${payerName}. Please include at least one other member.`);
    }

    if (splitType === SplitType.EQUAL) {
      const splitAmount = totalPaid / memberIds.length;
      memberIds.forEach(userId => {
        splits.push({
          userId,
          splitType: SplitType.EQUAL,
          value: splitAmount.toFixed(2)
        });
      });
    } else if (splitType === SplitType.EXACT) {
      const totalExact = getTotalExactAmounts();
      
      const missingAmounts = memberIds.filter(userId => !exactAmounts[userId] || parseFloat(exactAmounts[userId]) <= 0);
      if (missingAmounts.length > 0) {
        throw new Error('Please enter exact amounts for all selected members');
      }
      
      if (Math.abs(totalExact - totalPaid) > 0.01) {
        throw new Error(`Exact amounts (${getCurrencySymbol(watch('currency'))}${totalExact.toFixed(2)}) must equal total paid (${getCurrencySymbol(watch('currency'))}${totalPaid.toFixed(2)})`);
      }
      
      memberIds.forEach(userId => {
        splits.push({
          userId,
          splitType: SplitType.EXACT,
          value: parseFloat(exactAmounts[userId]).toFixed(2)
        });
      });
    }

    return splits;
  };

  const onSubmit = async (data: ExpenseFormData) => {
    setSubmitError('');
    setIsSubmitting(true);

    try {
      if (!data.paidBy) {
        throw new Error('Please select who paid for this expense');
      }

      const totalAmount = parseFloat(data.amount);
      if (!data.amount || totalAmount <= 0) {
        throw new Error('Please enter a valid expense amount greater than 0');
      }

      const splits = calculateSplits();

      // Prepare expense data for update
      const expenseData = {
        expense_id: expense.id,
        group_id: groupId,
        title: data.title.trim(),
        currency: data.currency,
        paid_by: data.paidBy,
        amount: totalAmount,
        splits: splits.map(s => ({
          user_id: s.userId,
          amount: parseFloat(s.value || '0'),
          split_type: s.splitType,
          percentage: null,
          shares: null
        }))
      };

      // Call the API to update the expense
      const response = await axios.put(`/api/groups/${groupId}/expenses`, expenseData);
      
      if (response.status === 200) {
        if (onExpenseUpdated) {
          onExpenseUpdated();
        }
        handleClose();
      }
    } catch (err: unknown) {
      console.error('Error updating expense:', err);
      if (err instanceof Error) {
        setSubmitError(err.message);
      } else if (axios.isAxiosError(err)) {
        setSubmitError(err.response?.data?.error || 'Failed to update expense');
      } else {
        setSubmitError('Failed to update expense');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Expense' : 'View Expense'}
            </h2>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <button
                  onClick={handleEnableEditing}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit expense"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Expense Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  {...register('title', {
                    required: 'Title is required',
                    minLength: {
                      value: 3,
                      message: 'Title must be at least 3 characters'
                    }
                  })}
                  placeholder="e.g., Dinner at restaurant, Movie tickets"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-700"
                  disabled={!isEditing || isSubmitting}
                />
                {errors.title && (
                  <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              {/* Currency */}
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  id="currency"
                  {...register('currency')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-700"
                  disabled={!isEditing || isSubmitting}
                >
                  {Object.entries(CURRENCY_CONFIG).map(([code, config]) => (
                    <option key={code} value={code}>
                      {config.name} ({config.symbol})
                    </option>
                  ))}
                </select>
              </div>

              {/* Payer and Amount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="paidBy" className="block text-sm font-medium text-gray-700 mb-2">
                    Who Paid? <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="paidBy"
                    {...register('paidBy', {
                      required: 'Please select who paid'
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-700"
                    disabled={!isEditing || isSubmitting}
                  >
                    <option value="">Select member</option>
                    {members.map((member) => (
                      <option key={member.profiles.id} value={member.profiles.id}>
                        {member.profiles.display_name || member.profiles.email}
                      </option>
                    ))}
                  </select>
                  {errors.paidBy && (
                    <p className="text-red-600 text-sm mt-1">{errors.paidBy.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="amount"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register('amount', {
                      required: 'Amount is required',
                      min: {
                        value: 0.01,
                        message: 'Amount must be greater than 0'
                      }
                    })}
                    onWheel={(e) => e.currentTarget.blur()}
                    onTouchMove={(e) => e.currentTarget.blur()}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-700"
                    disabled={!isEditing || isSubmitting}
                  />
                  {errors.amount && (
                    <p className="text-red-600 text-sm mt-1">{errors.amount.message}</p>
                  )}
                </div>
              </div>

              {/* Total Amount Display */}
              {totalPaid > 0 && (
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <p className="text-sm font-medium text-emerald-900">
                    Total Amount: {getCurrencySymbol(watch('currency'))} {totalPaid.toFixed(2)}
                  </p>
                </div>
              )}

              {/* Split Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Split With <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2 mb-4">
                  {members.map((member) => (
                    <div
                      key={member.profiles.id}
                      className="border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <label className="flex items-center gap-3 p-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSplitMembers.has(member.profiles.id)}
                          onChange={() => toggleSplitMember(member.profiles.id)}
                          className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 disabled:opacity-50"
                          disabled={!isEditing || isSubmitting}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {member.profiles.display_name || member.profiles.email}
                          </p>
                          <p className="text-sm text-gray-500">{member.profiles.email}</p>
                        </div>
                      </label>
                      
                      {splitType === SplitType.EQUAL && selectedSplitMembers.has(member.profiles.id) && totalPaid > 0 && (
                        <div className="px-3 pb-3 pt-0">
                          <div className="flex items-center justify-between p-2 bg-emerald-50 rounded">
                            <span className="text-sm text-emerald-700">Owes:</span>
                            <span className="text-sm font-bold text-emerald-900">
                              {getCurrencySymbol(watch('currency'))} {(totalPaid / selectedSplitMembers.size).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}

                      {splitType === SplitType.EXACT && selectedSplitMembers.has(member.profiles.id) && (
                        <div className="px-3 pb-3 pt-0">
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600 whitespace-nowrap">
                              Amount:
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={exactAmounts[member.profiles.id] || ''}
                              onChange={(e) => updateExactAmount(member.profiles.id, e.target.value)}
                              onWheel={(e) => e.currentTarget.blur()}
                              onTouchMove={(e) => e.currentTarget.blur()}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm disabled:bg-gray-50 disabled:text-gray-700"
                              disabled={!isEditing || isSubmitting}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {selectedSplitMembers.size === 0 && (
                  <p className="text-red-600 text-sm">Please select at least one member</p>
                )}
                
                {selectedSplitMembers.size === 1 && Array.from(selectedSplitMembers)[0] === watch('paidBy') && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                    <span className="text-amber-600 text-sm">⚠️</span>
                    <p className="text-sm text-amber-700">
                      Cannot split an expense only to the payer. Please include at least one other member.
                    </p>
                  </div>
                )}
                
                {splitType === SplitType.EQUAL && selectedSplitMembers.size > 0 && totalPaid > 0 && (
                  <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-xs font-medium text-emerald-900 mb-2">Equal Split Summary</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-700">Total amount:</span>
                      <span className="font-medium text-emerald-900">
                        {getCurrencySymbol(watch('currency'))} {totalPaid.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-emerald-700">Split among:</span>
                      <span className="font-medium text-emerald-900">
                        {selectedSplitMembers.size} {selectedSplitMembers.size === 1 ? 'person' : 'people'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-1 pt-2 border-t border-emerald-200">
                      <span className="text-emerald-700 font-medium">Each person owes:</span>
                      <span className="font-bold text-emerald-900">
                        {getCurrencySymbol(watch('currency'))} {(totalPaid / selectedSplitMembers.size).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {splitType === SplitType.EXACT && selectedSplitMembers.size > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs font-medium text-blue-900 mb-2">Validation Summary</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-700">Sum of split amounts:</span>
                      <span className={`font-bold ${Math.abs(getTotalExactAmounts() - totalPaid) > 0.01 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {getCurrencySymbol(watch('currency'))} {getTotalExactAmounts().toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-blue-700">Total amount entered:</span>
                      <span className="font-medium text-blue-900">
                        {getCurrencySymbol(watch('currency'))} {totalPaid.toFixed(2)}
                      </span>
                    </div>
                    {Math.abs(getTotalExactAmounts() - totalPaid) > 0.01 ? (
                      <div className="flex items-start gap-2 mt-2 p-2 bg-red-50 rounded border border-red-200">
                        <span className="text-red-600 text-xs">⚠️</span>
                        <p className="text-xs text-red-700">
                          Split amounts must equal the total amount. Adjust your split amounts to match.
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-2 p-2 bg-emerald-50 rounded border border-emerald-200">
                        <span className="text-emerald-600 text-xs">✓</span>
                        <p className="text-xs text-emerald-700 font-medium">
                          Split amounts match the total amount!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Split Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Split Type
                </label>
                <select
                  value={splitType}
                  onChange={(e) => setSplitType(e.target.value as SplitType)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-700"
                  disabled={!isEditing || isSubmitting}
                >
                  {Object.entries(SPLIT_TYPE_CONFIG).map(([type, config]) => (
                    <option key={type} value={type}>
                      {config.label}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-2">
                  {getSplitTypeDescription(splitType)}
                </p>
              </div>

              {submitError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{submitError}</p>
                </div>
              )}
            </div>

            {/* Footer */}
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
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isSubmitting || 
                      selectedSplitMembers.size === 0 ||
                      (selectedSplitMembers.size === 1 && Array.from(selectedSplitMembers)[0] === watch('paidBy'))
                    }
                    className="flex-1 px-4 py-3 bg-linear-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Updating...' : 'Update Expense'}
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

