'use client';

import { useState } from 'react';
import { DollarSign } from 'lucide-react';
import { GroupMember } from './types';
import AddExpenseModal from './AddExpenseModal';

interface ExpensesSectionProps {
  members: GroupMember[];
  groupId: string;
  currentUserId: string | null;
}

export default function ExpensesSection({ members, groupId, currentUserId }: ExpensesSectionProps) {
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);

  const handleExpenseAdded = () => {
    // TODO: Refresh expenses list
    console.log('Expense added successfully');
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
        
        {/* Empty State */}
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-8 h-8 text-emerald-500" />
          </div>
          <p className="text-gray-600 font-medium">No expenses yet</p>
          <p className="text-sm text-gray-400 mt-1">Add your first expense to get started</p>
        </div>
      </div>

      <AddExpenseModal
        isOpen={showAddExpenseModal}
        onClose={() => setShowAddExpenseModal(false)}
        members={members}
        groupId={groupId}
        currentUserId={currentUserId}
        onExpenseAdded={handleExpenseAdded}
      />
    </>
  );
}

