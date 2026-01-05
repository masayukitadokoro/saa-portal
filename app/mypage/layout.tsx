'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { 
  Menu,
  X,
  Home,
  History,
  Bookmark,
  User,
  Mail,
  Lock,
  CreditCard,
  Receipt,
  GraduationCap,
  LogOut,
  AlertTriangle
} from 'lucide-react';

interface MenuItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface UserInfo {
  name?: string;
  avatar?: string;
}

export default function MypageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const res = await fetch('/api/mypage/profile');
      if (res.ok) {
        const data = await res.json();
        setUserInfo({
          name: data.display_name || data.email?.split('@')[0],
          avatar: data.avatar_url,
        });
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  const menuSections: MenuSection[] = [
    {
      title: '学習',
      items: [
        { label: 'ダッシュボード', href: '/mypage', icon: <Home className="w-5 h-5" /> },
        { label: '視聴履歴', href: '/mypage/history', icon: <History className="w-5 h-5" /> },
        { label: 'ブックマーク', href: '/mypage/bookmarks', icon: <Bookmark className="w-5 h-5" /> },
      ],
    },
    {
      title: 'アカウント',
      items: [
        { label: 'ユーザー情報', href: '/mypage/settings/profile', icon: <User className="w-5 h-5" /> },
        { label: 'メールアドレス設定', href: '/mypage/settings/email', icon: <Mail className="w-5 h-5" /> },
        { label: 'パスワード設定', href: '/mypage/settings/password', icon: <Lock className="w-5 h-5" /> },
        { 
          label: 'ログアウト', 
          icon: <LogOut className="w-5 h-5" />, 
          onClick: handleLogoutClick,
          className: 'text-red-600 hover:bg-red-50 hover:text-red-700'
        },
      ],
    },
    {
      title: '有料サービス',
      items: [
        { label: '登録中のプラン', href: '/mypage/subscription', icon: <CreditCard className="w-5 h-5" /> },
        { label: 'お支払い情報', href: '/mypage/billing', icon: <Receipt className="w-5 h-5" /> },
      ],
    },
    {
      title: '特典',
      items: [
        { label: 'SAAアルムナイ', href: '/mypage/settings/alumni', icon: <GraduationCap className="w-5 h-5" /> },
      ],
    },
    {
      title: 'その他',
      items: [
        { label: '退会', href: '/mypage/withdraw', icon: <LogOut className="w-5 h-5" /> },
      ],
    },
  ];

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === '/mypage') {
      return pathname === '/mypage';
    }
    return pathname.startsWith(href);
  };

  const Sidebar = () => (
    <nav className="py-4">
      {menuSections.map((section, sectionIndex) => (
        <div key={section.title} className={sectionIndex > 0 ? 'mt-6' : ''}>
          <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {section.title}
          </h3>
          <ul className="space-y-1">
            {section.items.map((item) => (
              <li key={item.label}>
                {item.href ? (
                  <Link
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      isActive(item.href)
                        ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      setIsSidebarOpen(false);
                      item.onClick?.();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      item.className || 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  // settings配下ではサイドバーなしレイアウトを返す
  const isSettingsPage = pathname.startsWith('/mypage/settings');
  
  if (isSettingsPage) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
        
        {/* ログアウト確認モーダル */}
        {showLogoutModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div 
              className="absolute inset-0 bg-black/50"
              onClick={handleLogoutCancel}
            />
            <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  ログアウトしますか？
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  ログアウトすると、再度ログインが必要になります。
                </p>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={handleLogoutCancel}
                    disabled={isLoggingOut}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    いいえ
                  </button>
                  <button
                    onClick={handleLogoutConfirm}
                    disabled={isLoggingOut}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoggingOut ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>処理中...</span>
                      </>
                    ) : (
                      'はい'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 統一ヘッダー */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* 左: ロゴ（ホームへ） */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">🔬</span>
            </div>
            <span className="hidden sm:block font-bold text-gray-900">
              起業の科学<span className="text-rose-500">ポータル</span>
            </span>
          </Link>

          {/* 中央: マイページ */}
          <h1 className="text-base sm:text-lg font-bold text-gray-800">
            マイページ
          </h1>

          {/* 右: ハンバーガー（モバイル）+ ユーザー */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="hidden lg:flex items-center gap-2 px-2 py-1">
              {userInfo?.avatar ? (
                <Image
                  src={userInfo.avatar}
                  alt={userInfo.name || 'User'}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {userInfo?.name ? userInfo.name[0].toUpperCase() : <User className="w-4 h-4" />}
                </div>
              )}
              {userInfo?.name && (
                <span className="text-sm font-medium text-gray-700">
                  {userInfo.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* モバイルサイドバー（オーバーレイ） */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between px-4 h-14 border-b">
              <span className="font-semibold text-gray-900">メニュー</span>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 -mr-2 text-gray-600 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <Sidebar />
          </div>
        </div>
      )}

      <div className="lg:flex">
        {/* デスクトップサイドバー */}
        <aside className="hidden lg:block w-64 bg-white border-r min-h-[calc(100vh-56px)]">
          <Sidebar />
        </aside>

        {/* メインコンテンツ */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      {/* ログアウト確認モーダル */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* オーバーレイ */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={handleLogoutCancel}
          />
          
          {/* モーダル */}
          <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                ログアウトしますか？
              </h2>
              
              <p className="text-sm text-gray-500 mb-6">
                ログアウトすると、再度ログインが必要になります。
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={handleLogoutCancel}
                  disabled={isLoggingOut}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  いいえ
                </button>
                <button
                  onClick={handleLogoutConfirm}
                  disabled={isLoggingOut}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoggingOut ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>処理中...</span>
                    </>
                  ) : (
                    'はい'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
