'use client';

import { GroupMember } from './types';
import { Currency, SplitType, getCurrencySymbol } from './constants';

interface SplitMemberSelectorProps {
  members: GroupMember[];
  selectedMembers: Set<string>;
  onToggleMember: (userId: string) => void;
  splitType: SplitType;
  exactAmounts: Record<string, string>;
  onUpdateExactAmount: (userId: string, amount: string) => void;
  totalAmount: number;
  currency: Currency;
  isDisabled: boolean;
  paidBy: string;
}

export default function SplitMemberSelector({
  members,
  selectedMembers,
  onToggleMember,
  splitType,
  exactAmounts,
  onUpdateExactAmount,
  totalAmount,
  currency,
  isDisabled,
  paidBy
}: SplitMemberSelectorProps) {
  return (
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
                checked={selectedMembers.has(member.profiles.id)}
                onChange={() => onToggleMember(member.profiles.id)}
                className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 disabled:opacity-50"
                disabled={isDisabled}
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {member.profiles.display_name || member.profiles.email}
                </p>
                <p className="text-sm text-gray-500">{member.profiles.email}</p>
              </div>
            </label>
            
            {/* Equal split amount display */}
            {splitType === SplitType.EQUAL && selectedMembers.has(member.profiles.id) && totalAmount > 0 && (
              <div className="px-3 pb-3 pt-0">
                <div className="flex items-center justify-between p-2 bg-emerald-50 rounded">
                  <span className="text-sm text-emerald-700">Owes:</span>
                  <span className="text-sm font-bold text-emerald-900">
                    {getCurrencySymbol(currency)} {(totalAmount / selectedMembers.size).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Exact amount input */}
            {splitType === SplitType.EXACT && selectedMembers.has(member.profiles.id) && (
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
                    onChange={(e) => onUpdateExactAmount(member.profiles.id, e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    onTouchMove={(e) => e.currentTarget.blur()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm disabled:bg-gray-50 disabled:text-gray-700"
                    disabled={isDisabled}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Validation messages */}
      {selectedMembers.size === 0 && (
        <p className="text-red-600 text-sm">Please select at least one member</p>
      )}
      
      {selectedMembers.size === 1 && Array.from(selectedMembers)[0] === paidBy && (
        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <span className="text-amber-600 text-sm">⚠️</span>
          <p className="text-sm text-amber-700">
            Cannot split an expense only to the payer. Please include at least one other member.
          </p>
        </div>
      )}
    </div>
  );
}

