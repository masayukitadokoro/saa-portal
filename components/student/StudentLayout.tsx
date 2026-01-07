'use client';

import { ReactNode } from 'react';
import { StudentSidebar } from './StudentSidebar';
import { Bell } from 'lucide-react';
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
      <div className="lg:ml-64">
        {/* Desktop Header */}
        <header className="hidden lg:flex h-16 bg-white border-b border-gray-200 items-center justify-between px-8 sticky top-0 z-30">
          <h1 className="text-lg font-semibold text-gray-900">{pageTitle}</h1>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                {userName?.charAt(0) || '?'}
              </div>
              <span className="text-sm font-medium text-gray-700">{userName}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8 pt-20 lg:pt-8">{children}</main>
      </div>
    </div>
  );
}
