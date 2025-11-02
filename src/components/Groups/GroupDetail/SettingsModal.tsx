import { Settings, X, Edit2, Trash2, ChevronRight } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function SettingsModal({
  isOpen,
  isDeleting,
  onClose,
  onEdit,
  onDelete
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-linear-to-r from-emerald-500 to-teal-600 px-6 py-5 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">Group Settings</h3>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-3">
          <button
            onClick={onEdit}
            className="w-full group px-5 py-4 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:border-emerald-500 hover:bg-emerald-50 transition-all duration-200 text-left flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                <Edit2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Edit Group</div>
                <div className="text-xs text-gray-500">Update name and description</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
          </button>

          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="w-full group px-5 py-4 border-2 border-red-200 bg-red-50 text-red-700 rounded-xl font-medium hover:border-red-500 hover:bg-red-100 transition-all duration-200 text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-200 rounded-lg flex items-center justify-center group-hover:bg-red-300 transition-colors">
                <Trash2 className="w-5 h-5 text-red-700" />
              </div>
              <div>
                <div className="font-semibold text-red-900">
                  {isDeleting ? 'Deleting...' : 'Delete Group'}
                </div>
                <div className="text-xs text-red-600">Permanently remove this group</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-red-400 group-hover:text-red-600 transition-colors" />
          </button>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

