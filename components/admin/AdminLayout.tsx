'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, Calendar, FileText, BarChart3
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { profile, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/');
    }
  }, [loading, isAdmin, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  // パターンE: シンプル4メニュー型
  const menuItems = [
    { 
      icon: BarChart3, 
      label: 'ダッシュボード', 
      href: '/admin',
      description: '統計・概要'
    },
    { 
      icon: Calendar, 
      label: 'イベント管理', 
      href: '/admin/events',
      description: '講義・OH・認定式'
    },
    { 
      icon: Users, 
      label: '受講生管理', 
      href: '/admin/students',
      description: '受講生・TA・出席'
    },
    { 
      icon: FileText, 
      label: 'コンテンツ管理', 
      href: '/admin/contents',
      description: '動画・記事・資料'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* サイドバー */}
      <aside className="w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white fixed h-full">
        <div className="p-6">
          <h1 className="text-xl font-bold">SAA管理画面</h1>
          <p className="text-sm text-slate-400 mt-1">{profile?.display_name}</p>
        </div>
        
        <nav className="mt-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/admin' && pathname?.startsWith(item.href));
            
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-6 py-4 text-sm transition ${
                  isActive
                    ? 'bg-white/10 border-l-4 border-purple-500 text-white'
                    : 'text-slate-300 hover:bg-white/5 border-l-4 border-transparent'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <div>
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-slate-400">{item.description}</div>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-0 right-0 px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
          >
            ← ポータルに戻る
          </Link>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
