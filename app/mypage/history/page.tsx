'use client';
import { formatVideoTitle } from '@/lib/formatTitle';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  History, 
  Play,
  Eye,
  Trash2,
  ArrowLeft
} from 'lucide-react';

interface VideoInfo {
  video_id: string;
  title: string;
  thumbnail_url?: string;
  custom_thumbnail_url?: string;
  video_url?: string;
  duration?: number;
  view_count?: number;
  display_order?: number;
}

interface HistoryItem {
  id: number;
  video_id: string;
  watched_at: string;
  progress_seconds?: number;
  video?: VideoInfo;
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

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/mypage/history?limit=100');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!confirm('すべての視聴履歴を削除しますか？この操作は取り消せません。')) {
      return;
    }
    
    setClearing(true);
    try {
      const res = await fetch('/api/mypage/history', { method: 'DELETE' });
      if (res.ok) {
        setHistory([]);
      }
    } catch (error) {
      console.error('Failed to clear history:', error);
    } finally {
      setClearing(false);
    }
  };

  // サムネイル取得（YouTubeフォールバック付き）
  const getThumbnail = (item: HistoryItem): string | null => {
    const video = item.video;
    if (video?.custom_thumbnail_url) return video.custom_thumbnail_url;
    if (video?.thumbnail_url) return video.thumbnail_url;
    if (video?.video_url) {
      const ytId = extractYouTubeId(video.video_url);
      if (ytId) return getYouTubeThumbnail(ytId);
    }
    return null;
  };

  // 日付でグループ化
  const groupedHistory = history.reduce((groups, item) => {
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
    
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<string, HistoryItem[]>);

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Link href="/mypage" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="flex items-center gap-2 font-bold text-gray-900 text-lg">
            <History className="w-5 h-5 text-blue-600" />
            視聴履歴
          </h1>
          <span className="text-sm text-gray-500">({history.length}件)</span>
        </div>
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            disabled={clearing}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            すべて削除
          </button>
        )}
      </div>

      {/* コンテンツ */}
      {loading ? (
        <div className="p-8 text-center text-gray-500">読み込み中...</div>
      ) : history.length > 0 ? (
        <div>
          {Object.entries(groupedHistory).map(([date, items]) => (
            <div key={date}>
              <div className="px-4 py-2 bg-gray-50 text-sm font-medium text-gray-600 border-b border-gray-100">
                {date}
              </div>
              <div className="divide-y divide-gray-100">
                {items.map((item) => {
                  const thumbUrl = getThumbnail(item);
                  const video = item.video;
                  const progress = getProgressPercent(item.progress_seconds, video?.duration);
                  
                  return (
                    <Link
                      key={item.id}
                      href={`/videos/${item.video_id}`}
                      className="flex gap-4 p-4 hover:bg-gray-50 transition-colors"
                    >
                      {/* サムネイル */}
                      <div className="relative w-48 flex-shrink-0 aspect-video rounded-lg overflow-hidden bg-gray-200">
                        {thumbUrl ? (
                          <Image
                            src={thumbUrl}
                            alt={formatVideoTitle(video?.title || '動画', video?.display_order)}
                            fill
                            className="object-cover"
                            unoptimized={thumbUrl.includes('youtube.com') || thumbUrl.includes('ytimg.com')}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-10 h-10 text-gray-400" />
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
                        <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 text-base">
                          {formatVideoTitle(video?.title || '動画', video?.display_order)}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            {video?.view_count?.toLocaleString() || 0}回視聴
                          </span>
                          <span>•</span>
                          <span>{getRelativeTime(item.watched_at)}に視聴</span>
                        </div>
                        
                        {progress > 0 && progress < 100 && (
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-64">
                              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-sm text-gray-500">{progress}%視聴済み</span>
                            <span className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg">
                              続きを見る
                            </span>
                          </div>
                        )}
                        {progress >= 100 && (
                          <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                            視聴完了
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center">
          <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2 text-lg">視聴履歴がありません</p>
          <p className="text-sm text-gray-400 mb-4">動画を視聴すると、ここに履歴が表示されます</p>
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
