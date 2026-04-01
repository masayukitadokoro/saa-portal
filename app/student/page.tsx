'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Video,
  ChevronRight,
  Play,
  Loader2,
  ArrowRight,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { StudentLayout } from '@/components/student/StudentLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  CATEGORY_NAMES,
  CATEGORY_COLORS,
  getEventStyle,
} from '@/lib/constants/schedule';
import {
  formatDateShort,
  formatTime,
  getDaysUntil,
} from '@/lib/utils/date';
import type { CategoryProgress } from '@/types/student-dashboard';

interface ScheduleEvent {
  id: string;
  date: string;
  endDate?: string;
  name: string;
  eventType: string;
  zoomUrl: string | null;
}

const CATEGORY_SLUGS: Record<string, string> = {
  kagaku: '起業の科学',
  taizen: '起業大全',
  sanbo: '起業参謀',
};

export default function StudentDashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [categoryProgress, setCategoryProgress] = useState<CategoryProgress[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<ScheduleEvent[]>([]);
  const [continueWatching, setContinueWatching] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!authLoading && user) fetchData();
  }, [authLoading, user]);

  const fetchData = async () => {
    try {
      const [dashRes, schedRes] = await Promise.all([
        fetch('/api/student/dashboard'),
        fetch('/api/student/schedule?upcoming=true'),
      ]);

      if (dashRes.ok) {
        const d = await dashRes.json();
        setCategoryProgress(d.categoryProgress || []);
        setContinueWatching(d.continueWatching);
      }

      if (schedRes.ok) {
        const s = await schedRes.json();
        setUpcomingEvents((s.events || []).slice(0, 3));
      }
    } catch {}
    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      </StudentLayout>
    );
  }

  const totalVideos = categoryProgress.reduce((s, c) => s + c.total, 0);
  const completedVideos = categoryProgress.reduce((s, c) => s + c.completed, 0);
  const overallPercent = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">
            {profile?.display_name || 'ようこそ'}さん、おかえりなさい
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            SAA学習ポータル
          </p>
        </div>

        {/* Top row: Progress + Next Event */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Category Progress */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Video className="w-4 h-4 text-indigo-500" />
                カテゴリ別進捗
              </h2>
              <span className="text-xs text-gray-500">
                {completedVideos}/{totalVideos}本 完了（{overallPercent}%）
              </span>
            </div>

            <div className="space-y-3">
              {categoryProgress.map((cat) => {
                const percent = cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 0;
                const name = CATEGORY_SLUGS[cat.category] || cat.category;
                return (
                  <Link
                    key={cat.category}
                    href={`/student/videos/${cat.category}/learn`}
                    className="block group no-underline"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 group-hover:text-indigo-600 transition">
                        {name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {cat.completed}/{cat.total}本 ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all bg-indigo-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </Link>
                );
              })}

              {categoryProgress.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  進捗データがありません
                </p>
              )}
            </div>
          </div>

          {/* Next Events */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                次のイベント
              </h2>
              <Link
                href="/student/schedule"
                className="text-xs text-indigo-500 hover:text-indigo-700 no-underline flex items-center gap-0.5"
              >
                スケジュール
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {upcomingEvents.map((ev) => {
                const d = new Date(ev.date);
                const daysUntil = getDaysUntil(ev.date);
                const style = getEventStyle(ev.eventType);
                return (
                  <Link
                    key={ev.id}
                    href="/student/schedule"
                    className="block no-underline"
                  >
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition -mx-1">
                      {/* Date badge */}
                      <div className="w-10 text-center flex-shrink-0">
                        <div className="text-lg font-semibold text-gray-800 leading-none">
                          {d.getDate()}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {d.toLocaleDateString('ja-JP', { weekday: 'short' })}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: style?.color || '#6366f1' }}
                          />
                          <span className="text-[11px] font-medium" style={{ color: style?.color || '#6366f1' }}>
                            {style?.label || ev.eventType}
                          </span>
                          {daysUntil !== undefined && daysUntil >= 0 && daysUntil <= 7 && (
                            <span className="text-[10px] text-gray-400 ml-auto">
                              {daysUntil === 0 ? '今日' : `${daysUntil}日後`}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {ev.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatTime(ev.date)}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}

              {upcomingEvents.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  予定されているイベントはありません
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Continue Watching */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Play className="w-4 h-4 text-indigo-500" />
              続きから再生
            </h2>
          </div>

          {continueWatching ? (
            <Link
              href={`/student/videos/${continueWatching.category}/learn?step=${continueWatching.chapter}-${continueWatching.step}&video=${continueWatching.videoIndex || 0}`}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition -mx-1 no-underline"
            >
              {/* Thumbnail */}
              <div className="w-40 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                {continueWatching.thumbnail_url ? (
                  <img
                    src={continueWatching.thumbnail_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <Video className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center">
                    <Play className="w-5 h-5 text-indigo-600 ml-0.5" />
                  </div>
                </div>
                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                  <div
                    className="h-full bg-indigo-500"
                    style={{ width: `${continueWatching.progress_percent || 0}%` }}
                  />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                  {continueWatching.title}
                </p>
                <p className="text-xs text-gray-500">
                  {CATEGORY_SLUGS[continueWatching.category] || continueWatching.category}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${continueWatching.progress_percent || 0}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-gray-400">
                    {continueWatching.progress_percent || 0}%
                  </span>
                </div>
              </div>

              <ArrowRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
            </Link>
          ) : (
            <div className="text-center py-6">
              <Video className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400 mb-3">
                まだ動画を視聴していません
              </p>
              <Link
                href="/student/videos/kagaku/learn"
                className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 no-underline"
              >
                学習を始める
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
