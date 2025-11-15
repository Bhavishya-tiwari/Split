'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import BottomNavigation from '@/components/BottomNavigation';
import SideMenu from '@/components/SideMenu';

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
// todo 
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex flex-col pb-20">
      <Navbar onMenuOpen={() => setIsMenuOpen(true)} />

      <main className="flex-1">{children}</main>

      <BottomNavigation />

      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </div>
  );
}
