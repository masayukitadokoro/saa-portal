'use client';

import { useEffect, useState } from 'react';
import { User, Mail, Lock, Building, Calendar, Clock, Bookmark, Play, Flame } from 'lucide-react';
import { StudentLayout } from '@/components/student/StudentLayout';
import { Card, CardHeader, VideoThumbnailCard } from '@/components/student/ui';
import type { VideoWithProgress } from '@/types/student-dashboard';

interface UserProfile {
  display_name: string;
  email: string;
  avatar_url?: string;
  company_name?: string;
  business_description?: string;
  founded_year?: number;
  slack_handle?: string;
  batch_name?: string;
}

interface LearningStats {
  total_watch_time_minutes: number;
  completed_videos: number;
  streak_days: number;
}

export default function MyPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [watchHistory, setWatchHistory] = useState<VideoWithProgress[]>([]);
  const [bookmarks, setBookmarks] = useState<VideoWithProgress[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // TODO: APIからデータ取得
    setProfile({
      display_name: '田中 太郎',
      email: 'tanaka@example.com',
      company_name: '株式会社サンプル',
      business_description: 'BtoB SaaS',
      founded_year: 2024,
      slack_handle: '@tanaka_taro',
      batch_name: 'Batch 9',
    });

    setStats({
      total_watch_time_minutes: 2732,
      completed_videos: 143,
      streak_days: 12,
    });

    setWatchHistory([
      { video_id: 'v-45', title: '#45 MVPの種類を知る2', category: 'kagaku', progress_percent: 60, is_completed: false, last_position_seconds: 360, duration: 601 },
      { video_id: 'v-42', title: '#42 WiseとChocozapの事例', category: 'kagaku', progress_percent: 100, is_completed: true, last_position_seconds: 545, duration: 545 },
      { video_id: 'v-39', title: '#39 プロトタイプを作る', category: 'kagaku', progress_percent: 100, is_completed: true, last_position_seconds: 630, duration: 630 },
      { video_id: 'v-38', title: '#38 仮説検証の進め方', category: 'kagaku', progress_percent: 100, is_completed: true, last_position_seconds: 480, duration: 480 },
    ]);

    setBookmarks([
      { video_id: 'v-23', title: '#23 単価設計の基本', category: 'kagaku', progress_percent: 100, is_completed: true, last_position_seconds: 520, duration: 520 },
      { video_id: 'v-56', title: '#56 LTV計算の実践', category: 'taizen', progress_percent: 100, is_completed: true, last_position_seconds: 480, duration: 480 },
      { video_id: 'v-78', title: '#78 採用戦略', category: 'sanbo', progress_percent: 30, is_completed: false, last_position_seconds: 180, duration: 600 },
    ]);

    setLoading(false);
  }, []);

  const formatWatchTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}時間${mins}分`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <StudentLayout pageTitle="マイページ">
      <div className="max-w-4xl mx-auto">
        {/* プロフィール */}
        <Card className="mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5" />
                プロフィール
              </h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
              >
                {isEditing ? 'キャンセル' : '編集'}
              </button>
            </div>

            <div className="flex items-start gap-6">
              {/* アバター */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                {profile?.display_name?.charAt(0) || '?'}
              </div>

              {/* プロフィール情報 */}
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-1">{profile?.display_name}</h3>
                <p className="text-gray-500 mb-1">{profile?.email}</p>
                <p className="text-indigo-600 text-sm">{profile?.batch_name}</p>

                <div className="mt-4 bg-gray-50 rounded-xl p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 w-24">氏名</span>
                      <span className="text-gray-900 font-medium">{profile?.display_name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 w-24">メール</span>
                      <span className="text-gray-900">{profile?.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 w-24">会社名</span>
                      <span className="text-gray-900">{profile?.company_name || '未設定'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 w-24">事業内容</span>
                      <span className="text-gray-900">{profile?.business_description || '未設定'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 w-24">創業年</span>
                      <span className="text-gray-900">{profile?.founded_year ? `${profile.founded_year}年` : '未設定'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 w-24">Slack</span>
                      <span className="text-gray-900">{profile?.slack_handle || '未設定'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* セキュリティ */}
        <Card className="mb-8">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5" />
              セキュリティ
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <span className="text-gray-700">パスワード</span>
                  <span className="ml-4 text-gray-400">••••••••••</span>
                </div>
                <button className="px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                  変更する
                </button>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <span className="text-gray-700">二段階認証</span>
                  <span className="ml-4 text-gray-400">未設定</span>
                </div>
                <button className="px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                  設定する
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* 学習統計 */}
        <Card className="mb-8">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              📊 学習統計
            </h2>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-indigo-50 rounded-xl p-4 text-center">
                <Clock className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-indigo-600">
                  {stats ? formatWatchTime(stats.total_watch_time_minutes) : '-'}
                </div>
                <div className="text-sm text-gray-500">総視聴時間</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <Play className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  {stats?.completed_videos || 0}本
                </div>
                <div className="text-sm text-gray-500">完了動画数</div>
              </div>
              <div className="bg-orange-50 rounded-xl p-4 text-center">
                <Flame className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-600">
                  {stats?.streak_days || 0}日
                </div>
                <div className="text-sm text-gray-500">連続学習日数</div>
              </div>
            </div>
          </div>
        </Card>

        {/* 視聴履歴 */}
        <Card className="mb-8" id="history">
          <CardHeader
            title="視聴履歴"
            icon={<Clock className="w-5 h-5 text-gray-500" />}
            action={
              <button className="text-sm text-indigo-600 hover:underline">
                すべて見る
              </button>
            }
          />
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {watchHistory.map((video) => (
                <VideoThumbnailCard key={video.video_id} video={video} />
              ))}
            </div>
          </div>
        </Card>

        {/* ブックマーク */}
        <Card>
          <CardHeader
            title="ブックマーク"
            icon={<Bookmark className="w-5 h-5 text-amber-500" />}
            action={
              <button className="text-sm text-indigo-600 hover:underline">
                すべて見る
              </button>
            }
          />
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {bookmarks.map((video) => (
                <VideoThumbnailCard key={video.video_id} video={video} />
              ))}
            </div>
          </div>
        </Card>
      </div>
    </StudentLayout>
  );
}
