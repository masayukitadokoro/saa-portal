'use client';
import { formatVideoTitle } from '@/lib/formatTitle';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import LoginModal from '@/components/LoginModal';
import { History, Clock, ArrowLeft, CheckCircle } from 'lucide-react';

interface WatchHistoryItem {
  video_id: string;
  watched_at: string;
  completed: boolean;
  videos: {
    video_id: string;
    title: string;
    video_url: string;
    duration: number;
    display_order?: number;
    difficulty: string;
    category_id: number;
  };
}

export default function WatchHistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (!user) {
      setShowLoginModal(true);
      setLoading(false);
      return;
    }

    async function fetchHistory() {
      try {
        const res = await fetch('/api/watch-history?limit=50');
        if (res.ok) {
          const data = await res.json();
          setHistory(data.watchHistory || []);
        }
      } catch (error) {
        console.error('Error fetching watch history:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [user]);

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

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'たった今';
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;
    return date.toLocaleDateString('ja-JP');
  };

  // 日付でグループ化
  const groupByDate = (items: WatchHistoryItem[]) => {
    const groups: { [key: string]: WatchHistoryItem[] } = {};
    
    items.forEach(item => {
      const date = new Date(item.watched_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let key: string;
      if (date.toDateString() === today.toDateString()) {
        key = '今日';
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = '昨日';
      } else {
        key = date.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' });
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    
    return groups;
  };

  if (!user) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">視聴履歴を見るにはログインが必要です</p>
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

  const groupedHistory = groupByDate(history);

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
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <History className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">視聴履歴</h1>
              <p className="text-gray-500">{history.length}件の動画</p>
            </div>
          </div>
        </div>

        {/* 視聴履歴一覧 */}
        {history.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">視聴履歴はありません</p>
            <p className="text-sm text-gray-400">動画を視聴すると履歴に追加されます</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedHistory).map(([date, items]) => (
              <div key={date}>
                <h2 className="text-sm font-semibold text-gray-500 mb-3">{date}</h2>
                <div className="space-y-3">
                  {items.map((item) => (
                    <Link
                      key={item.video_id + item.watched_at}
                      href={`/videos/${item.video_id}`}
                      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow flex"
                    >
                      {/* サムネイル */}
                      <div className="w-40 h-24 relative flex-shrink-0">
                        <img
                          src={getThumbnailUrl(item.videos.video_url)}
                          alt={formatVideoTitle(item.videos.title, item.videos.display_order)}
                          className="w-full h-full object-cover"
                        />
                        {item.videos.duration && (
                          <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                            {formatDuration(item.videos.duration)}
                          </span>
                        )}
                        {item.completed && (
                          <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            完了
                          </div>
                        )}
                      </div>

                      {/* 動画情報 */}
                      <div className="flex-1 p-4">
                        <h3 className="font-semibold text-gray-900 hover:text-blue-600 line-clamp-2 mb-1">
                          {formatVideoTitle(item.videos.title, item.videos.display_order)}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {formatRelativeTime(item.watched_at)}に視聴
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
