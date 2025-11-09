'use client';

import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { GroupMember } from './types';
import { Currency, CURRENCY_CONFIG, getCurrencySymbol } from './constants';

interface ExpenseFormData {
  title: string;
  currency: Currency;
  paidBy: string;
  amount: string;
}

interface ExpenseFormFieldsProps {
  register: UseFormRegister<ExpenseFormData>;
  errors: FieldErrors<ExpenseFormData>;
  members: GroupMember[];
  isDisabled: boolean;
  watchedAmount: string;
  watchedCurrency: Currency;
}

export default function ExpenseFormFields({
  register,
  errors,
  members,
  isDisabled,
  watchedAmount,
  watchedCurrency
}: ExpenseFormFieldsProps) {
  const totalPaid = parseFloat(watchedAmount) || 0;

  return (
    <>
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
          disabled={isDisabled}
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
          disabled={isDisabled}
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
            disabled={isDisabled}
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
            disabled={isDisabled}
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
            Total Amount: {getCurrencySymbol(watchedCurrency)} {totalPaid.toFixed(2)}
          </p>
        </div>
      )}
    </>
  );
}

