'use client';
import { formatVideoTitle } from '@/lib/formatTitle';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Bookmark, 
  BookmarkX,
  Play,
  Eye,
  ArrowLeft
} from 'lucide-react';

interface BookmarkItem {
  id?: number;
  video_id: string;
  created_at: string;
  title?: string;
  thumbnail_url?: string;
  custom_thumbnail_url?: string;
  video_url?: string;
  duration?: number;
  view_count?: number;
  display_order?: number;
}

// YouTube IDを抽出する関数
function extractYouTubeId(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return match ? match[1] : null;
}

// YouTubeサムネイルURLを生成
function getYouTubeThumbnail(youtubeId: string): string {
  return `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`;
}

// 相対時間を計算
function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHour = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMin < 60) return `${diffMin}分前`;
  if (diffHour < 24) return `${diffHour}時間前`;
  if (diffDay === 0) return '今日';
  if (diffDay === 1) return '昨日';
  if (diffDay < 7) return `${diffDay}日前`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}週間前`;
  return `${Math.floor(diffDay / 30)}ヶ月前`;
}

// 時間フォーマット
function formatDuration(seconds?: number): string {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      const res = await fetch('/api/mypage/bookmarks?limit=100');
      if (res.ok) {
        const data = await res.json();
        setBookmarks(data.bookmarks || []);
      }
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (videoId: string) => {
    setRemovingId(videoId);
    try {
      const res = await fetch(`/api/mypage/bookmarks?video_id=${videoId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setBookmarks(prev => prev.filter(b => b.video_id !== videoId));
      }
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
    } finally {
      setRemovingId(null);
    }
  };

  // サムネイル取得（YouTubeフォールバック付き）
  const getThumbnail = (item: BookmarkItem): string | null => {
    if (item.custom_thumbnail_url) return item.custom_thumbnail_url;
    if (item.thumbnail_url) return item.thumbnail_url;
    if (item.video_url) {
      const ytId = extractYouTubeId(item.video_url);
      if (ytId) return getYouTubeThumbnail(ytId);
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Link href="/mypage" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="flex items-center gap-2 font-bold text-gray-900 text-lg">
            <Bookmark className="w-5 h-5 text-amber-500" />
            ブックマーク
          </h1>
          <span className="text-sm text-gray-500">({bookmarks.length}件)</span>
        </div>
      </div>

      {/* コンテンツ */}
      {loading ? (
        <div className="p-8 text-center text-gray-500">読み込み中...</div>
      ) : bookmarks.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {bookmarks.map((item) => {
            const thumbUrl = getThumbnail(item);
            
            return (
              <div
                key={item.video_id}
                className="flex gap-4 p-4 hover:bg-gray-50 transition-colors group"
              >
                {/* サムネイル */}
                <Link 
                  href={`/videos/${item.video_id}`}
                  className="relative w-48 flex-shrink-0 aspect-video rounded-lg overflow-hidden bg-gray-200"
                >
                  {thumbUrl ? (
                    <Image
                      src={thumbUrl}
                      alt={formatVideoTitle(item.title || '動画', item.display_order)}
                      fill
                      className="object-cover"
                      unoptimized={thumbUrl.includes('youtube.com') || thumbUrl.includes('ytimg.com')}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                  {item.duration && (
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-white text-xs rounded">
                      {formatDuration(item.duration)}
                    </span>
                  )}
                  {/* ホバー時の再生ボタン */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                      <Play className="w-6 h-6 text-gray-900 ml-1" />
                    </div>
                  </div>
                </Link>

                {/* 動画情報 */}
                <div className="flex-1 min-w-0">
                  <Link href={`/videos/${item.video_id}`}>
                    <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 text-base hover:text-blue-600 transition-colors">
                      {formatVideoTitle(item.title || '動画', item.display_order)}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {item.view_count?.toLocaleString() || 0}回視聴
                    </span>
                    <span>•</span>
                    <span>{getRelativeTime(item.created_at)}に保存</span>
                  </div>
                  
                  {/* アクション */}
                  <div className="flex items-center gap-2">
                    <Link 
                      href={`/videos/${item.video_id}`}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      視聴する
                    </Link>
                    <button
                      onClick={() => removeBookmark(item.video_id)}
                      disabled={removingId === item.video_id}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <BookmarkX className="w-4 h-4" />
                      {removingId === item.video_id ? '削除中...' : '削除'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center">
          <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2 text-lg">ブックマークがありません</p>
          <p className="text-sm text-gray-400 mb-4">気になる動画をブックマークして、後で見返しましょう</p>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Play className="w-4 h-4" />
            動画を見る
          </Link>
        </div>
      )}
    </div>
  );
}
