'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  History, 
  Bookmark, 
  ChevronRight, 
  Play,
  User,
  Eye
} from 'lucide-react';
import { formatVideoTitle } from '@/lib/formatTitle';

interface VideoInfo {
  video_id: string;
  title: string;
  thumbnail_url?: string;
  custom_thumbnail_url?: string;
  video_url?: string;
  duration?: number;
  view_count?: number;
}

interface HistoryItem {
  id: number;
  video_id: string;
  watched_at: string;
  progress_seconds?: number;
  video?: VideoInfo;
}

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
}

interface UserProfile {
  display_name?: string;
  email?: string;
  avatar_url?: string;
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

// 視聴進捗率を計算
function getProgressPercent(progressSeconds?: number, duration?: number): number {
  if (!progressSeconds || !duration) return 0;
  return Math.min(100, Math.round((progressSeconds / duration) * 100));
}

export default function MyPageDashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [last24HoursWatchedCount, setLast24HoursWatchedCount] = useState(0);
  const [totalBookmarks, setTotalBookmarks] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, historyRes, bookmarksRes, statsRes] = await Promise.all([
        fetch('/api/mypage/profile'),
        fetch('/api/mypage/history?limit=5'),
        fetch('/api/mypage/bookmarks?limit=5'),
        fetch('/api/mypage/stats'),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data);
      }

      if (historyRes.ok) {
        const data = await historyRes.json();
        setHistory(data.history || []);
      }

      if (bookmarksRes.ok) {
        const data = await bookmarksRes.json();
        setBookmarks(data.bookmarks || []);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setLast24HoursWatchedCount(data.last24HoursWatchedCount || 0);
        setTotalBookmarks(data.totalBookmarks || 0);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  // サムネイル取得（履歴用 - YouTubeフォールバック付き）
  const getHistoryThumbnail = (item: HistoryItem): string | null => {
    const video = item.video;
    if (video?.custom_thumbnail_url) return video.custom_thumbnail_url;
    if (video?.thumbnail_url) return video.thumbnail_url;
    if (video?.video_url) {
      const ytId = extractYouTubeId(video.video_url);
      if (ytId) return getYouTubeThumbnail(ytId);
    }
    return null;
  };

  // サムネイル取得（ブックマーク用 - YouTubeフォールバック付き）
  const getBookmarkThumbnail = (item: BookmarkItem): string | null => {
    if (item.custom_thumbnail_url) return item.custom_thumbnail_url;
    if (item.thumbnail_url) return item.thumbnail_url;
    if (item.video_url) {
      const ytId = extractYouTubeId(item.video_url);
      if (ytId) return getYouTubeThumbnail(ytId);
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* プロフィールカード */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {profile?.display_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {profile?.display_name || 'ユーザー'}
              </h1>
              <p className="text-sm text-gray-500">{profile?.email}</p>
            </div>
          </div>
          <Link
            href="/mypage/profile"
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <User className="w-4 h-4" />
            プロフィール編集
          </Link>
        </div>

        {/* 統計 */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <History className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{last24HoursWatchedCount}</p>
              <p className="text-xs text-gray-500">過去1日で視聴した動画</p>
            </div>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Bookmark className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalBookmarks}</p>
              <p className="text-xs text-gray-500">ブックマーク</p>
            </div>
          </div>
        </div>
      </div>

      {/* 視聴履歴セクション */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="flex items-center gap-2 font-bold text-gray-900">
            <History className="w-5 h-5 text-blue-600" />
            最近視聴した動画
          </h2>
          <Link
            href="/mypage/history"
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            すべて見る
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">読み込み中...</div>
        ) : history.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {history.map((item) => {
              const thumbUrl = getHistoryThumbnail(item);
              const video = item.video;
              const progress = getProgressPercent(item.progress_seconds, video?.duration);
              
              return (
                <Link
                  key={item.id}
                  href={`/videos/${item.video_id}`}
                  className="flex gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  {/* サムネイル */}
                  <div className="relative w-40 flex-shrink-0 aspect-video rounded-lg overflow-hidden bg-gray-200">
                    {thumbUrl ? (
                      <Image
                        src={thumbUrl}
                        alt={video?.title || '動画'}
                        fill
                        className="object-cover"
                        unoptimized={thumbUrl.includes('youtube.com') || thumbUrl.includes('ytimg.com')}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    {video?.duration && (
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-white text-xs rounded">
                        {formatDuration(video.duration)}
                      </span>
                    )}
                    {progress > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-300">
                        <div className="h-full bg-red-600" style={{ width: `${progress}%` }} />
                      </div>
                    )}
                  </div>

                  {/* 動画情報 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 line-clamp-2 mb-1">
                      {formatVideoTitle(video?.title || '動画')}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {video?.view_count?.toLocaleString() || 0}回視聴
                      </span>
                      <span>•</span>
                      <span>{getRelativeTime(item.watched_at)}に視聴</span>
                    </div>
                    {progress > 0 && progress < 100 && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden max-w-48">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{progress}%視聴済み</span>
                      </div>
                    )}
                    {progress >= 100 && (
                      <span className="inline-block mt-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        視聴完了
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">まだ視聴履歴がありません</p>
            <Link href="/" className="text-sm text-blue-600 hover:text-blue-700">
              動画を見る →
            </Link>
          </div>
        )}
      </div>

      {/* ブックマークセクション */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="flex items-center gap-2 font-bold text-gray-900">
            <Bookmark className="w-5 h-5 text-amber-500" />
            ブックマーク
          </h2>
          <Link
            href="/mypage/bookmarks"
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            すべて見る
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">読み込み中...</div>
        ) : bookmarks.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {bookmarks.map((item) => {
              const thumbUrl = getBookmarkThumbnail(item);
              
              return (
                <Link
                  key={item.video_id}
                  href={`/videos/${item.video_id}`}
                  className="flex gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  {/* サムネイル */}
                  <div className="relative w-40 flex-shrink-0 aspect-video rounded-lg overflow-hidden bg-gray-200">
                    {thumbUrl ? (
                      <Image
                        src={thumbUrl}
                        alt={item.title || '動画'}
                        fill
                        className="object-cover"
                        unoptimized={thumbUrl.includes('youtube.com') || thumbUrl.includes('ytimg.com')}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    {item.duration && (
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-white text-xs rounded">
                        {formatDuration(item.duration)}
                      </span>
                    )}
                  </div>

                  {/* 動画情報 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 line-clamp-2 mb-1">
                      {formatVideoTitle(item.title || '動画')}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {item.view_count?.toLocaleString() || 0}回視聴
                      </span>
                      <span>•</span>
                      <span>{getRelativeTime(item.created_at)}に保存</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">まだブックマークがありません</p>
            <p className="text-sm text-gray-400">気になる動画をブックマークして、後で見返しましょう</p>
          </div>
        )}
      </div>
    </div>
  );
}
