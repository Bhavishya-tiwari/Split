'use client';

import { useRouter } from 'next/navigation';
import { X, User, LogOut } from 'lucide-react';
import { createClientForBrowser } from '@/utils/supabase/client';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SideMenu({ isOpen, onClose }: SideMenuProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClientForBrowser();
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleProfile = () => {
    onClose();
    router.push('/profile');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Menu Panel */}
      <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform">
        <div className="flex flex-col h-full">
          {/* Menu Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 p-4">
            <nav className="space-y-2">
              {/* Profile Option */}
              <button
                onClick={handleProfile}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <User className="w-5 h-5" />
                <span className="font-medium">Profile</span>
              </button>

              {/* Log Out Option */}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Log out</span>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}
