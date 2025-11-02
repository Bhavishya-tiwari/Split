import { DollarSign } from 'lucide-react';

interface ExpensesSectionProps {
  onAddExpense: () => void;
}

export default function ExpensesSection({ onAddExpense }: ExpensesSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Expenses</h3>
        <button
          onClick={onAddExpense}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md"
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
  );
}

