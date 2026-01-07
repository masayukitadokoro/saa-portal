'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Video,
  Calendar,
  Users,
  BarChart3,
  BookOpen,
  User,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
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
          href: '/student/videos/kagaku',
          progress: categoryProgress.find((c) => c.category === 'kagaku')?.progressPercent,
        },
        {
          id: 'taizen',
          label: '起業大全',
          href: '/student/videos/taizen',
          progress: categoryProgress.find((c) => c.category === 'taizen')?.progressPercent,
        },
        {
          id: 'sanbo',
          label: '起業参謀',
          href: '/student/videos/sanbo',
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
      id: 'guide',
      label: 'ガイド',
      icon: <BookOpen className="w-5 h-5" />,
      href: '/student/guide',
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
    return pathname === href || pathname.startsWith(href + '/');
  };

  const isMenuExpanded = (menuId: string) => expandedMenus.includes(menuId);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-6">
        <Link href="/student" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-xl">🚀</span>
          </div>
          <div>
            <div className="font-bold text-white">SAA現役生</div>
            <div className="text-xs text-slate-400">ポータル</div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        {menuItems.map((item) => (
          <div key={item.id} className="mb-1">
            {item.children ? (
              <>
                <button
                  onClick={() => toggleMenu(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                    isMenuExpanded(item.id)
                      ? 'bg-white/10 text-white'
                      : 'text-slate-300 hover:bg-white/5'
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
                  <div className="ml-4 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.id}
                        href={child.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive(child.href)
                            ? 'bg-indigo-500/20 text-indigo-300 border-l-2 border-indigo-400'
                            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                        }`}
                      >
                        <span>{child.label}</span>
                        {child.progress !== undefined && (
                          <span className="text-xs opacity-70">{child.progress}%</span>
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-indigo-500/20 text-indigo-300 border-l-2 border-indigo-400'
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-white/10">
        <Link
          href="/student/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm">設定</span>
        </Link>
        <button
          onClick={() => {
            // TODO: ログアウト処理
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">ログアウト</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-gradient-to-b from-slate-900 to-slate-800 fixed h-full z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 text-white hover:bg-white/10 rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-white text-xl">🚀</span>
          <span className="font-bold text-white">SAA</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
          {userName?.charAt(0) || '?'}
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <span className="text-white font-bold">メニュー</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-white hover:bg-white/10 rounded-lg"
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
