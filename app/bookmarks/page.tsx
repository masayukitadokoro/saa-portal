'use client';
import { formatVideoTitle } from '@/lib/formatTitle';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import LoginModal from '@/components/LoginModal';
import { Bookmark, Clock, ArrowLeft, Trash2 } from 'lucide-react';

interface BookmarkItem {
  video_id: string;
  created_at: string;
  videos: {
    video_id: string;
    title: string;
    video_url: string;
    duration: number;
    display_order?: number;
    difficulty: string;
    category_id: number;
    categories: {
      id: number;
      name: string;
      slug: string;
    };
  };
}

export default function BookmarksPage() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (!user) {
      setShowLoginModal(true);
      setLoading(false);
      return;
    }

    async function fetchBookmarks() {
      try {
        const res = await fetch('/api/bookmarks');
        if (res.ok) {
          const data = await res.json();
          setBookmarks(data.bookmarks || []);
        }
      } catch (error) {
        console.error('Error fetching bookmarks:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchBookmarks();
  }, [user]);

  const removeBookmark = async (videoId: string) => {
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: videoId })
      });
      
      if (res.ok) {
        setBookmarks(prev => prev.filter(b => b.video_id !== videoId));
      }
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getYouTubeId = (url: string): string | null => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match ? match[1] : null;
  };

  const getThumbnailUrl = (videoUrl: string): string => {
    const id = getYouTubeId(videoUrl);
    if (id) return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
    return '/placeholder-video.png';
  };

  if (!user) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">ブックマークを見るにはログインが必要です</p>
          </div>
        </div>
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      </>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            ホームに戻る
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Bookmark className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ブックマーク</h1>
              <p className="text-gray-500">{bookmarks.length}件の動画</p>
            </div>
          </div>
        </div>

        {/* ブックマーク一覧 */}
        {bookmarks.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">ブックマークした動画はありません</p>
            <p className="text-sm text-gray-400">動画ページで🔖アイコンをクリックして保存しましょう</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.video_id}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="flex">
                  {/* サムネイル */}
                  <Link href={`/videos/${bookmark.video_id}`} className="flex-shrink-0">
                    <div className="w-40 h-24 relative">
                      <img
                        src={getThumbnailUrl(bookmark.videos.video_url)}
                        alt={formatVideoTitle(bookmark.videos.title, bookmark.videos.display_order)}
                        className="w-full h-full object-cover"
                      />
                      {bookmark.videos.duration && (
                        <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                          {formatDuration(bookmark.videos.duration)}
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* 動画情報 */}
                  <div className="flex-1 p-4 flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <Link href={`/videos/${bookmark.video_id}`}>
                        <h3 className="font-semibold text-gray-900 hover:text-blue-600 line-clamp-2 mb-1">
                          {formatVideoTitle(bookmark.videos.title, bookmark.videos.display_order)}
                        </h3>
                      </Link>
                      {bookmark.videos.categories && (
                        <Link
                          href={`/category/${bookmark.videos.categories.slug}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {bookmark.videos.categories.name}
                        </Link>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(bookmark.created_at).toLocaleDateString('ja-JP')} に保存
                      </p>
                    </div>

                    {/* 削除ボタン */}
                    <button
                      onClick={() => removeBookmark(bookmark.video_id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      title="ブックマークを削除"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
