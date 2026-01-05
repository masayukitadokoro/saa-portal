'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import VideoGrid from '@/components/VideoGrid';
import { Category, Video } from '@/types';
import { Search, User } from 'lucide-react';

interface UserInfo {
  name?: string;
  avatar?: string;
}

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [category, setCategory] = useState<Category | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    loadVideos();
    fetchUserInfo();
  }, [slug, sort]);

  async function loadVideos() {
    setIsLoading(true);
    
    const searchParams = new URLSearchParams({ sort });

    try {
      const res = await fetch(`/api/categories/${slug}/videos?${searchParams}`);
      const data = await res.json();

      setCategory(data.category);
      setVideos(data.videos || []);
    } catch (error) {
      console.error('Failed to load videos:', error);
    } finally {
      setIsLoading(false);
    }
  }

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

  // 検索フィルタリング
  const filteredVideos = searchQuery
    ? videos.filter(v => v.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : videos;

  if (isLoading && !category) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500" />
        </div>
      </div>
    );
  }

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
            動画一覧
          </h1>

          {/* 右: 検索 + ユーザー */}
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="動画を検索..."
                className="w-48 pl-9 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-full
                         focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
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

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* 動画数 + ソート */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-600">
            {filteredVideos.length}件の動画
          </p>
          
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-1.5
                     focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="newest">新しい順</option>
            <option value="oldest">古い順</option>
            <option value="popular">人気順</option>
          </select>
        </div>

        {/* モバイル検索バー */}
        <div className="sm:hidden mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="動画を検索..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500" />
          </div>
        ) : (
          <VideoGrid videos={filteredVideos} showBookmark={true} />
        )}
      </main>
    </div>
  );
}
