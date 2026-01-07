'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Search, CheckCircle, Play, Clock, ArrowLeft } from 'lucide-react';
import { StudentLayout } from '@/components/student/StudentLayout';
import { Card, ProgressBar } from '@/components/student/ui';

interface Video {
  id: number;
  video_id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  duration?: number;
  display_order?: number;
  view_count?: number;
  progress_percent: number;
  is_completed: boolean;
  last_position_seconds: number;
}

interface CategoryInfo {
  id: number;
  slug: string;
  name: string;
  color: string;
}

interface CategoryStats {
  totalVideos: number;
  completedVideos: number;
  progressPercent: number;
}

export default function VideoCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categorySlug = params.category as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<CategoryInfo | null>(null);
  const [stats, setStats] = useState<CategoryStats | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);

  useEffect(() => {
    fetchVideos();
  }, [categorySlug]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/student/videos/${categorySlug}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/login');
          return;
        }
        throw new Error('Failed to fetch videos');
      }

      const data = await response.json();
      setCategory(data.category);
      setStats(data.stats);
      setVideos(data.videos);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('動画の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 検索フィルター
  const filteredVideos = videos.filter((video) =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // タイトルをフォーマット（番号_タイトル → 番号 タイトル）
  const formatTitle = (title: string, displayOrder?: number) => {
    if (displayOrder) {
      // 先頭の番号パターンを除去してdisplay_orderを使用
      const cleanTitle = title.replace(/^\d+(-\d+)?[_\s]+/, '');
      return `${displayOrder}. ${cleanTitle}`;
    }
    // display_orderがない場合は元のタイトルを整形
    return title.replace(/_/g, ' ');
  };

  // 時間をフォーマット
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <StudentLayout pageTitle="読み込み中...">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      </StudentLayout>
    );
  }

  if (error) {
    return (
      <StudentLayout pageTitle="エラー">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchVideos}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            再試行
          </button>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout pageTitle={category?.name || categorySlug}>
      <div className="max-w-5xl mx-auto">
        {/* 戻るリンク */}
        <button
          onClick={() => router.push('/student')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          ホームに戻る
        </button>

        {/* 進捗サマリー */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 学習進捗</h2>
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-sm text-gray-500">視聴完了:</span>
                <span
                  className="text-2xl font-bold"
                  style={{ color: category?.color || '#3B82F6' }}
                >
                  {stats?.completedVideos || 0}
                </span>
                <span className="text-gray-500">/ {stats?.totalVideos || 0}本</span>
                <span
                  className="text-lg font-semibold"
                  style={{ color: category?.color || '#3B82F6' }}
                >
                  ({stats?.progressPercent || 0}%)
                </span>
              </div>
              <ProgressBar
                progress={stats?.progressPercent || 0}
                color={category?.color || '#3B82F6'}
                size="lg"
              />
            </div>
            <div className="text-sm text-gray-500">
              残り {(stats?.totalVideos || 0) - (stats?.completedVideos || 0)}本
            </div>
          </div>
        </Card>

        {/* 検索 */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="動画を検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* 動画一覧 */}
        <Card className="overflow-hidden">
          <div className="p-4">
            {filteredVideos.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {searchTerm ? '検索結果がありません' : '動画がありません'}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredVideos.map((video) => (
                  <div
                    key={video.video_id}
                    onClick={() => router.push(`/videos/${video.video_id}`)}
                    className="bg-white rounded-lg overflow-hidden border border-gray-100 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
                  >
                    {/* サムネイル */}
                    <div
                      className="relative aspect-video flex items-center justify-center"
                      style={{
                        background: video.thumbnail_url
                          ? `url(${video.thumbnail_url}) center/cover`
                          : `linear-gradient(135deg, ${category?.color || '#3B82F6'}, #1E1B4B)`,
                      }}
                    >
                      {!video.thumbnail_url && (
                        <Play className="w-8 h-8 text-white/70 group-hover:scale-110 transition" />
                      )}
                      {video.is_completed && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          視聴済
                        </div>
                      )}
                      {!video.is_completed && video.progress_percent > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                          <div
                            className="h-full bg-white"
                            style={{ width: `${video.progress_percent}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* 情報 */}
                    <div className="p-3">
                      <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                        {formatTitle(video.title, video.display_order)}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        {video.duration && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {formatDuration(video.duration)}
                          </span>
                        )}
                        {video.progress_percent > 0 && !video.is_completed && (
                          <span className="text-xs text-indigo-600">
                            {video.progress_percent}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* 件数表示 */}
        <div className="mt-4 text-center text-sm text-gray-500">
          {searchTerm
            ? `${filteredVideos.length}件の動画が見つかりました`
            : `全${videos.length}本の動画`}
        </div>
      </div>
    </StudentLayout>
  );
}
