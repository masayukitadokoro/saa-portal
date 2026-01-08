'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, Video, MessageSquare, FileText, ChevronRight, Flame, AlertCircle, Play } from 'lucide-react';
import { StudentLayout } from '@/components/student/StudentLayout';
import { Card, CardHeader } from '@/components/student/ui';
import { PieChart, PieChartSmall, PieChartLarge } from '@/components/ui/PieChart';
import { 
  CATEGORY_NAMES, 
  CATEGORY_COLORS, 
  CATEGORY_SLUG_MAP,
  getZoomUrl,
  getEventStyle,
} from '@/lib/constants/schedule';
import { 
  formatDateShort, 
  formatTime, 
  getDaysUntil,
  formatDuration,
} from '@/lib/utils/date';
import type { CategoryProgress } from '@/types/student-dashboard';
import type { ScheduleEvent } from '@/lib/notion';

export default function StudentDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [categoryProgress, setCategoryProgress] = useState<CategoryProgress[]>([]);
  const [upcomingSchedule, setUpcomingSchedule] = useState<ScheduleEvent[]>([]);
  const [recentlyWatched, setRecentlyWatched] = useState<any[]>([]);
  const [continueWatching, setContinueWatching] = useState<any>(null);
  const [streakDays, setStreakDays] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // ダッシュボードデータ取得
      const dashRes = await fetch('/api/student/dashboard');
      if (dashRes.ok) {
        const data = await dashRes.json();
        setCategoryProgress(data.categoryProgress || []);
        setRecentlyWatched((data.recentlyWatched || []).slice(0, 4));
        setContinueWatching(data.continueWatching);
        setStreakDays(data.streakDays || 0); // TODO: 実際のストリーク計算
      }

      // スケジュール取得（今後2週間）
      const schedRes = await fetch('/api/student/schedule?upcoming=true');
      if (schedRes.ok) {
        const data = await schedRes.json();
        const now = new Date();
        const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        const filtered = (data.events || [])
          .filter((e: ScheduleEvent) => {
            const eventDate = new Date(e.date);
            return eventDate >= now && eventDate <= twoWeeksLater;
          })
          .slice(0, 5);
        setUpcomingSchedule(filtered);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 全体進捗計算
  const totalVideos = categoryProgress.reduce((sum, c) => sum + c.totalVideos, 0);
  const completedVideos = categoryProgress.reduce((sum, c) => sum + c.completedVideos, 0);
  const totalPercent = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

  // 期限タスク
  const deadlineTasks = upcomingSchedule
    .filter(e => e.postSurveyUrl || e.preSurveyUrl)
    .slice(0, 3)
    .map(e => ({
      id: e.id,
      title: e.postSurveyUrl ? `${e.name} アンケート回答` : `${e.name} 質問投稿`,
      deadline: e.date,
      url: e.postSurveyUrl || e.preSurveyUrl,
      type: e.postSurveyUrl ? 'survey' : 'question',
    }));

  if (loading) {
    return (
      <StudentLayout pageTitle="ホーム" categoryProgress={[]}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout categoryProgress={categoryProgress} pageTitle="ホーム">
      <div className="max-w-7xl mx-auto">
        {/* 上段: 2x2 グリッド（モバイルは1列） */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* 次のイベント */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                次のイベント
              </h2>
              <Link href="/student/schedule" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                スケジュール <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            {upcomingSchedule.length > 0 ? (
              <div className="space-y-3">
                {/* メインイベント */}
                <div className="bg-gray-50 rounded-lg p-4">
                  {(() => {
                    const event = upcomingSchedule[0];
                    const style = getEventStyle(event.eventType);
                    const daysUntil = getDaysUntil(event.date);
                    return (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-medium ${style.color}`}>
                            {style.emoji} {style.label}
                          </span>
                          {daysUntil && (
                            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                              daysUntil === '今日' ? 'bg-red-100 text-red-700' :
                              daysUntil === '明日' ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {daysUntil}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1">{event.name}</h3>
                        <p className="text-sm text-gray-500 mb-3">
                          📆 {formatDateShort(event.date)} {formatTime(event.date)}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {event.venue === 'Zoom' && (
                            <a href={getZoomUrl(event.eventType)} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700">
                              <Video className="w-3 h-3" /> Zoom
                            </a>
                          )}
                          {event.preSurveyUrl && (
                            <a href={event.preSurveyUrl} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded text-xs font-medium hover:bg-amber-600">
                              <MessageSquare className="w-3 h-3" /> 質問
                            </a>
                          )}
                          {event.materialUrl && (
                            <a href={event.materialUrl} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300">
                              <FileText className="w-3 h-3" /> 資料
                            </a>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
                {/* サブイベント */}
                {upcomingSchedule.slice(1, 3).map((event) => {
                  const style = getEventStyle(event.eventType);
                  return (
                    <div key={event.id} className="flex items-center gap-3 text-sm">
                      <span className={`w-2 h-2 rounded-full ${style.bgColor}`} />
                      <span className="text-gray-500">{formatDateShort(event.date)}</span>
                      <span className="text-gray-900 truncate flex-1">{event.name}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm py-8 text-center">今後2週間のイベントはありません</p>
            )}
          </Card>

          {/* 全体進捗 */}
          <Card className="p-5">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
              📊 全体進捗
            </h2>
            <div className="flex items-center gap-6">
              <PieChartLarge percent={totalPercent} color="#6366F1" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {completedVideos}<span className="text-base font-normal text-gray-500">/{totalVideos}本</span>
                </p>
                <p className="text-sm text-gray-500 mb-2">視聴完了</p>
                <div className="flex items-center gap-2 text-orange-500">
                  <Flame className="w-5 h-5" />
                  <span className="font-bold">連続 {streakDays} 日学習中</span>
                </div>
              </div>
            </div>
            <Link href="/student/videos/kagaku" 
              className="mt-4 block w-full text-center py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100">
              学習を続ける →
            </Link>
          </Card>

          {/* 期限のあるタスク */}
          <Card className="p-5">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              期限のあるタスク
            </h2>
            {deadlineTasks.length > 0 ? (
              <div className="space-y-3">
                {deadlineTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">{task.title}</p>
                      <p className="text-xs text-gray-500">期限: {formatDateShort(task.deadline)}</p>
                    </div>
                    <a href={task.url || '#'} target="_blank" rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-amber-500 text-white rounded text-xs font-medium hover:bg-amber-600 flex-shrink-0">
                      {task.type === 'survey' ? '回答' : '投稿'}
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm py-4 text-center">期限のあるタスクはありません</p>
            )}
          </Card>

          {/* 続きから再生 */}
          <Card className="p-5">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Play className="w-5 h-5 text-purple-600" />
              続きから再生
            </h2>
            {continueWatching ? (
              <div>
                <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center mb-3 relative overflow-hidden">
                  {continueWatching.thumbnail_url ? (
                    <img src={continueWatching.thumbnail_url} alt="" className="w-full h-full object-cover opacity-80" />
                  ) : (
                    <Video className="w-12 h-12 text-gray-600" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="w-6 h-6 text-gray-900 ml-1" />
                    </div>
                  </div>
                </div>
                <h3 className="font-medium text-gray-900 truncate mb-2">{continueWatching.title}</h3>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600 rounded-full" style={{ width: `${continueWatching.progress_percent}%` }} />
                  </div>
                  <span className="text-sm text-gray-500">{continueWatching.progress_percent}%</span>
                </div>
                <button onClick={() => router.push(`/videos/${continueWatching.video_id}`)}
                  className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
                  続きを見る →
                </button>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-gray-500 text-sm mb-3">視聴中の動画はありません</p>
                <Link href="/student/videos/kagaku" className="text-indigo-600 text-sm hover:underline">
                  動画を探す →
                </Link>
              </div>
            )}
          </Card>
        </div>

        {/* カテゴリ別進捗 */}
        <Card className="p-5 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">📚 カテゴリ別進捗</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {categoryProgress.map((cat) => (
              <Link key={cat.category} href={`/student/videos/${cat.category}`}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <PieChartSmall 
                  percent={cat.progressPercent} 
                  color={CATEGORY_COLORS[cat.category] || '#6366F1'} 
                />
                <div>
                  <p className="font-medium text-gray-900">{CATEGORY_NAMES[cat.category]}</p>
                  <p className="text-sm text-gray-500">{cat.completedVideos}/{cat.totalVideos}本</p>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* 最近の学習履歴 */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" />
              最近の学習履歴
            </h2>
            <Link href="/student/mypage#history" className="text-sm text-indigo-600 hover:underline">
              すべて見る
            </Link>
          </div>
          {recentlyWatched.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentlyWatched.map((video, idx) => (
                <div key={video.video_id} 
                  onClick={() => router.push(`/videos/${video.video_id}`)}
                  className="cursor-pointer group">
                  <div className="relative">
                    {idx === 0 && (
                      <span className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded">
                        🆕 最新
                      </span>
                    )}
                    {idx > 0 && (
                      <span className="absolute top-2 left-2 z-10 w-6 h-6 bg-gray-800/80 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {idx + 1}
                      </span>
                    )}
                    <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center overflow-hidden">
                      {video.thumbnail_url ? (
                        <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition" />
                      ) : (
                        <Video className="w-8 h-8 text-gray-600" />
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-900 truncate">{video.title}</p>
                  <p className="text-xs text-gray-500">
                    {video.duration ? formatDuration(video.duration) : ''}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm py-4 text-center">視聴履歴がありません</p>
          )}
        </Card>
      </div>
    </StudentLayout>
  );
}
