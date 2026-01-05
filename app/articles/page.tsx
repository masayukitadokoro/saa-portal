'use client';
import { formatVideoTitle } from '@/lib/formatTitle';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Search, 
  Eye, 
  Calendar, 
  BookOpen,
  User,
  Loader2
} from 'lucide-react';

interface Article {
  video_id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  view_count?: number;
  display_order?: number;
  published_at?: string;
}

interface UserInfo {
  name?: string;
  avatar?: string;
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    fetchArticles();
    fetchUserInfo();
  }, []);

  const fetchArticles = async () => {
    try {
      const res = await fetch('/api/articles');
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || []);
      }
    } catch (error) {
      console.error('Failed to fetch articles:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* 左: ロゴ */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">🔬</span>
            </div>
            <span className="hidden sm:block font-bold text-gray-900">
              起業の科学<span className="text-rose-500">ポータル</span>
            </span>
          </Link>

          {/* 中央: ページタイトル */}
          <h1 className="text-base sm:text-lg font-bold text-gray-800">
            解説記事一覧
          </h1>

          {/* 右: 検索 + ユーザー */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="記事を検索..."
                className="pl-9 pr-4 py-1.5 w-48 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <Link
              href="/mypage"
              className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
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
                <span className="hidden md:block text-sm font-medium text-gray-700">
                  {userInfo.name}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* モバイル検索 */}
      <div className="sm:hidden px-4 py-3 bg-white border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="記事を検索..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <p className="text-sm text-gray-500 mb-6">{filteredArticles.length}件の記事</p>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">記事が見つかりませんでした</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map((article) => (
              <Link
                key={article.video_id}
                href={`/articles/${article.video_id}`}
                className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow group"
              >
                <div className="relative aspect-video bg-gray-200">
                  {article.thumbnail_url ? (
                    <Image
                      src={article.thumbnail_url}
                      alt={formatVideoTitle(article.title, article.display_order)}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h2 className="font-bold text-gray-900 line-clamp-2 group-hover:text-rose-600 transition-colors">
                    {formatVideoTitle(article.title, article.display_order)}
                  </h2>
                  {article.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {article.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    {article.view_count !== undefined && (
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {article.view_count.toLocaleString()}回視聴
                      </span>
                    )}
                    {article.published_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(article.published_at)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
