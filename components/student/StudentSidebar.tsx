'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Video,
  Calendar,
  BarChart3,
  BookOpen,
  User,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  FolderOpen,
  Clock,
  Bookmark,
} from 'lucide-react';
import type { CategoryProgress } from '@/types/student-dashboard';

interface StudentSidebarProps {
  categoryProgress?: CategoryProgress[];
  userName?: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  children?: { id: string; label: string; href: string; progress?: number }[];
}

export function StudentSidebar({ categoryProgress = [], userName }: StudentSidebarProps) {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['videos']);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]
    );
  };

  const menuItems: MenuItem[] = [
    {
      id: 'home',
      label: 'ホーム',
      icon: <Home className="w-5 h-5" />,
      href: '/student',
    },
    {
      id: 'videos',
      label: '動画',
      icon: <Video className="w-5 h-5" />,
      children: [
        {
          id: 'kagaku',
          label: '起業の科学',
          href: '/student/videos/kagaku/learn',
          progress: categoryProgress.find((c) => c.category === 'kagaku')?.progressPercent,
        },
        {
          id: 'taizen',
          label: '起業大全',
          href: '/student/videos/taizen/learn',
          progress: categoryProgress.find((c) => c.category === 'taizen')?.progressPercent,
        },
        {
          id: 'sanbo',
          label: '起業参謀',
          href: '/student/videos/sanbo/learn',
          progress: categoryProgress.find((c) => c.category === 'sanbo')?.progressPercent,
        },
      ],
    },
    {
      id: 'scm',
      label: 'SCM',
      icon: <BarChart3 className="w-5 h-5" />,
      href: '/student/scm',
    },
    {
      id: 'schedule',
      label: 'スケジュール',
      icon: <Calendar className="w-5 h-5" />,
      href: '/student/schedule',
    },
    {
      id: 'submissions',
      label: '課題提出',
      icon: <FolderOpen className="w-5 h-5" />,
      href: '/student/submissions',
    },
    {
      id: 'guide',
      label: 'ガイド',
      icon: <BookOpen className="w-5 h-5" />,
      href: '/student/guide',
    },
    {
      id: 'history',
      label: '学習履歴',
      icon: <Clock className="w-5 h-5" />,
      href: '/student/history',
    },
    {
      id: 'bookmarks',
      label: '保存した動画',
      icon: <Bookmark className="w-5 h-5" />,
      href: '/student/bookmarks',
    },
    {
      id: 'mypage',
      label: 'マイページ',
      icon: <User className="w-5 h-5" />,
      href: '/student/mypage',
    },
  ];

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === '/student') return pathname === '/student' || pathname === '/student/dashboard';
    return pathname === href || pathname.startsWith(href + '/');
  };

  const isMenuExpanded = (menuId: string) => expandedMenus.includes(menuId);

  const SidebarContent = () => (
    <>
      <div className="pt-16" />

      <div className="mx-4 border-t border-gray-100 mb-2" />

      <nav className="flex-1 px-3">
        {menuItems.map((item) => (
          <div key={item.id} className="mb-0.5">
            {item.children ? (
              <>
                <button
                  onClick={() => toggleMenu(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors border-none cursor-pointer ${
                    isMenuExpanded(item.id)
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 bg-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  {isMenuExpanded(item.id) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                {isMenuExpanded(item.id) && (
                  <div className="ml-4 mt-0.5 space-y-0.5">
                    {item.children.map((child) => (
                      <Link
                        key={child.id}
                        href={child.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors no-underline ${
                          isActive(child.href)
                            ? 'bg-indigo-50 text-indigo-700 font-semibold border-l-2 border-indigo-500'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                        }`}
                      >
                        <span>{child.label}</span>
                        {child.progress !== undefined && (
                          <span className="text-xs text-gray-400">{child.progress}%</span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Link
                href={item.href || '#'}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors no-underline ${
                  isActive(item.href)
                    ? 'bg-indigo-50 text-indigo-700 font-semibold border-l-2 border-indigo-500'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.icon}
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <Link
          href="/student/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors no-underline"
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm">設定</span>
        </Link>
        <button
          onClick={() => {
            // TODO: ログアウト処理
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors border-none cursor-pointer bg-transparent"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">ログアウト</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-gray-200 fixed h-full z-20">
        <SidebarContent />
      </aside>

      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-between px-4 z-50 shadow-md">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 text-white hover:bg-white/10 rounded-lg border-none cursor-pointer bg-transparent"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-white text-lg">🚀</span>
          <span className="font-bold text-white text-[15px]">SAA学習ポータル</span>
        </div>
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
          {userName?.charAt(0) || '?'}
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <span className="text-gray-900 font-bold text-[15px]">メニュー</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg border-none cursor-pointer bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarContent />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
