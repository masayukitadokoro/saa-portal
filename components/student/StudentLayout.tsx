'use client';

import { ReactNode } from 'react';
import { StudentSidebar } from './StudentSidebar';
import type { CategoryProgress } from '@/types/student-dashboard';

interface StudentLayoutProps {
  children: ReactNode;
  categoryProgress?: CategoryProgress[];
  userName?: string;
  pageTitle?: string;
}

export function StudentLayout({
  children,
  categoryProgress,
  userName,
  pageTitle,
}: StudentLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <StudentSidebar categoryProgress={categoryProgress} userName={userName} />

      {/* Main Content */}
      <div>
        {/* Desktop Header - purple gradient, center title only */}
        <header className="hidden lg:flex h-14 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 items-center justify-center sticky top-0 z-50 shadow-md">
          <div className="flex items-center gap-2">
            <span className="text-white text-lg">🚀</span>
            <span className="font-bold text-white text-[16px]">SAA学習ポータル</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8 pt-20 lg:pt-8 lg:ml-64">{children}</main>
      </div>
    </div>
  );
}
