interface GroupStatsCardProps {
  totalExpenses?: number;
  totalAmount?: string;
  yourShare?: string;
}

export default function GroupStatsCard({
  totalExpenses = 0,
  totalAmount = '$0.00',
  yourShare = '$0.00',
}: GroupStatsCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Stats</h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Expenses</span>
          <span className="text-sm font-semibold text-gray-900">{totalExpenses}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Amount</span>
          <span className="text-sm font-semibold text-gray-900">{totalAmount}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Your Share</span>
          <span className="text-sm font-semibold text-gray-900">{yourShare}</span>
        </div>
      </div>
    </div>
  );
}
