'use client';

import { Currency, SplitType, getCurrencySymbol } from './constants';

interface SplitSummaryProps {
  splitType: SplitType;
  selectedMembersCount: number;
  totalAmount: number;
  totalExactAmounts: number;
  currency: Currency;
}

export default function SplitSummary({
  splitType,
  selectedMembersCount,
  totalAmount,
  totalExactAmounts,
  currency
}: SplitSummaryProps) {
  if (selectedMembersCount === 0) return null;

  // Equal split summary
  if (splitType === SplitType.EQUAL && totalAmount > 0) {
    return (
      <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
        <p className="text-xs font-medium text-emerald-900 mb-2">Equal Split Summary</p>
        <div className="flex justify-between text-sm">
          <span className="text-emerald-700">Total amount:</span>
          <span className="font-medium text-emerald-900">
            {getCurrencySymbol(currency)} {totalAmount.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-emerald-700">Split among:</span>
          <span className="font-medium text-emerald-900">
            {selectedMembersCount} {selectedMembersCount === 1 ? 'person' : 'people'}
          </span>
        </div>
        <div className="flex justify-between text-sm mt-1 pt-2 border-t border-emerald-200">
          <span className="text-emerald-700 font-medium">Each person owes:</span>
          <span className="font-bold text-emerald-900">
            {getCurrencySymbol(currency)} {(totalAmount / selectedMembersCount).toFixed(2)}
          </span>
        </div>
      </div>
    );
  }

  // Exact split validation summary
  if (splitType === SplitType.EXACT) {
    const isValid = Math.abs(totalExactAmounts - totalAmount) <= 0.01;
    
    return (
      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs font-medium text-blue-900 mb-2">Validation Summary</p>
        <div className="flex justify-between text-sm">
          <span className="text-blue-700">Sum of split amounts:</span>
          <span className={`font-bold ${!isValid ? 'text-red-600' : 'text-emerald-600'}`}>
            {getCurrencySymbol(currency)} {totalExactAmounts.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-blue-700">Total amount entered:</span>
          <span className="font-medium text-blue-900">
            {getCurrencySymbol(currency)} {totalAmount.toFixed(2)}
          </span>
        </div>
        {!isValid ? (
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
    );
  }

  return null;
}

