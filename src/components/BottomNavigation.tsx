'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Users, Activity } from 'lucide-react';

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Groups',
      path: '/groups',
      icon: <Users className="w-6 h-6 mb-1" />,
    },
    {
      name: 'Friends',
      path: '/friends',
      icon: <Users className="w-6 h-6 mb-1" />,
    },
    {
      name: 'Activities',
      path: '/activities',
      icon: <Activity className="w-6 h-6 mb-1" />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-3 gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => router.push(item.path)}
                className={`flex flex-col items-center justify-center py-3 px-2 transition-colors ${
                  isActive
                    ? 'text-emerald-600 bg-emerald-50'
                    : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                {item.icon}
                <span className="text-xs font-medium">{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

