'use client';

import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { Menu, Search, X, User } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  query?: string;
  onQueryChange?: (value: string) => void;
  onSearch?: () => void;
  onMenuToggle?: () => void;
  showSearch?: boolean;
  showLogout?: boolean;  // ★追加: ログアウトボタン表示制御
}

export default function Header({ 
  query = '', 
  onQueryChange, 
  onSearch, 
  onMenuToggle,
  showSearch = true,
  showLogout = true  // ★デフォルトはtrue（トップページ用）
}: HeaderProps) {
  const { user, signOut, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch();
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 gap-4">
          
          {/* 左側: ハンバーガーメニュー + ロゴ */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
                onMenuToggle?.();
              }}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              aria-label="メニュー"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
            <Link href="/" className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900 whitespace-nowrap">
                動画コンテンツ検索
              </span>
            </Link>
          </div>

          {/* 中央: 検索バー（showSearch=trueの場合のみ表示） */}
          {showSearch && onQueryChange && onSearch && (
            <div className="flex-1 max-w-2xl hidden sm:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => onQueryChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="PMF"
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full
                           text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           placeholder-gray-400"
                />
              </div>
            </div>
          )}

          {/* 右側: 認証ボタン */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {isLoading ? (
              <div className="w-24 h-9 bg-gray-100 rounded-lg animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                {/* マイページリンク */}
                <Link
                  href="/mypage"
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 
                           hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {user.email?.[0]?.toUpperCase() || '?'}
                  </div>
                  <span className="hidden md:block">
                    {user.email?.split('@')[0]}
                  </span>
                </Link>
                
                {/* ログアウトボタン - showLogout=trueの場合のみ表示 */}
                {showLogout && (
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 
                             border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    ログアウト
                  </button>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="px-4 py-1.5 text-sm font-medium text-blue-600 
                         border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors
                         whitespace-nowrap"
              >
                ログイン / サインアップ
              </Link>
            )}
          </div>
        </div>

        {/* モバイル用検索バー（showSearch=trueの場合のみ表示） */}
        {showSearch && onQueryChange && onSearch && (
          <div className="pb-3 sm:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="PMF"
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full
                         text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         placeholder-gray-400"
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
