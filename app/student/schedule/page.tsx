'use client';

import { useEffect, useState, useMemo } from 'react';
import { Video, Filter, ChevronRight } from 'lucide-react';
import { StudentLayout } from '@/components/student/StudentLayout';
import { Card } from '@/components/student/ui';
import { 
  EVENT_STYLES,
  getZoomUrl,
  getEventStyle,
} from '@/lib/constants/schedule';
import { 
  formatDateParts, 
  formatTime, 
  getDaysUntil,
} from '@/lib/utils/date';
import type { ScheduleEvent, EventType } from '@/lib/notion';

type FilterType = 'all' | EventType;

export default function SchedulePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/student/schedule?type=all');
      if (!response.ok) throw new Error('Failed to fetch schedule');
      
      const data = await response.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('スケジュールの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 1月のイベントを除外 + フィルタリング
  const filteredEvents = useMemo(() => {
    let result = events.filter(e => {
      const date = new Date(e.date);
      // 1月のイベントを除外
      if (date.getMonth() === 0) return false;
      return true;
    });
    
    if (filter !== 'all') {
      result = result.filter(e => e.eventType === filter);
    }
    
    return result;
  }, [events, filter]);

  // 次のイベント（今日以降で最も近いイベント）のIDを取得
  const nextEventId = useMemo(() => {
    const now = new Date();
    const futureEvents = filteredEvents.filter(e => new Date(e.date) >= now);
    if (futureEvents.length === 0) return null;
    return futureEvents[0].id;
  }, [filteredEvents]);

  // 月ごとにグループ化
  const groupedByMonth = filteredEvents.reduce((acc, event) => {
    if (!event.date) return acc;
    const date = new Date(event.date);
    const monthKey = `${date.getFullYear()}年${date.getMonth() + 1}月`;
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(event);
    return acc;
  }, {} as Record<string, ScheduleEvent[]>);

  if (loading) {
    return (
      <StudentLayout pageTitle="スケジュール">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      </StudentLayout>
    );
  }

  if (error) {
    return (
      <StudentLayout pageTitle="スケジュール">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchSchedule}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            再試行
          </button>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout pageTitle="スケジュール">
      <div className="max-w-4xl mx-auto">
        {/* フィルター */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <Filter className="w-5 h-5 text-gray-500" />
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            全て
          </button>
          {(Object.keys(EVENT_STYLES) as EventType[]).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                filter === type
                  ? `${EVENT_STYLES[type].bgColor} text-white`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {EVENT_STYLES[type].emoji} {EVENT_STYLES[type].label}
            </button>
          ))}
        </div>

        {/* タイムライン */}
        {Object.entries(groupedByMonth).map(([month, monthEvents]) => (
          <div key={month} className="mb-10">
            {/* 月ヘッダー - 大きく表示 */}
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{month}</h2>
              <div className="flex-1 h-px bg-gray-300" />
            </div>

            {/* イベントリスト */}
            <div className="relative">
              {/* タイムラインの線 */}
              <div className="absolute left-[52px] top-0 bottom-0 w-0.5 bg-gray-200" />

              {monthEvents.map((event) => {
                const style = getEventStyle(event.eventType);
                const { day, weekday } = formatDateParts(event.date);
                const daysUntil = getDaysUntil(event.date);
                const isPast = !daysUntil;
                const isNextEvent = event.id === nextEventId;

                return (
                  <div 
                    key={event.id} 
                    className={`relative flex gap-4 mb-4 ${isPast ? 'opacity-50' : ''}`}
                  >
                    {/* 日付 */}
                    <div className={`w-12 text-right flex-shrink-0 ${isNextEvent ? 'text-indigo-600' : ''}`}>
                      <div className={`text-lg font-bold ${isNextEvent ? 'text-indigo-600' : 'text-gray-900'}`}>
                        {day}日
                      </div>
                      <div className={`text-sm ${isNextEvent ? 'text-indigo-500' : 'text-gray-500'}`}>
                        ({weekday})
                      </div>
                    </div>

                    {/* ドット - 次のイベントは大きく */}
                    <div className={`
                      ${isNextEvent ? 'w-4 h-4 ring-4 ring-indigo-100' : 'w-3 h-3 ring-4 ring-white'} 
                      rounded-full ${isNextEvent ? 'bg-indigo-600' : style.bgColor} 
                      mt-2 flex-shrink-0 relative z-10
                    `} />

                    {/* イベントカード */}
                    <Card className={`
                      flex-1 p-4 transition-all
                      ${isNextEvent ? 'ring-2 ring-indigo-500 bg-indigo-50/50' : ''}
                    `}>
                      {/* 次のイベントラベル */}
                      {isNextEvent && (
                        <div className="flex items-center gap-1 mb-2">
                          <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs font-bold rounded">
                            📍 次のイベント
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className={`text-sm font-medium ${style.color}`}>
                            {style.emoji} {style.label}
                          </span>
                          <h3 className={`font-bold mt-1 ${isNextEvent ? 'text-indigo-900' : 'text-gray-900'}`}>
                            {event.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {formatTime(event.date)}
                            {event.endDate && ` - ${formatTime(event.endDate)}`}
                            {event.venue && ` | ${event.venue}`}
                          </p>
                        </div>
                        {daysUntil && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            daysUntil === '今日' ? 'bg-red-100 text-red-700' :
                            daysUntil === '明日' ? 'bg-orange-100 text-orange-700' :
                            isNextEvent ? 'bg-indigo-100 text-indigo-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {daysUntil}
                          </span>
                        )}
                      </div>

                      {/* アクションボタン - Zoomのみ表示 */}
                      {event.venue === 'Zoom' && !isPast && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          <a
                            href={getZoomUrl(event.eventType)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`
                              inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition
                              ${isNextEvent 
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'}
                            `}
                          >
                            <Video className="w-4 h-4" />
                            Zoom参加
                          </a>
                        </div>
                      )}
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filteredEvents.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {filter === 'all' ? 'スケジュールがありません' : `${EVENT_STYLES[filter].label}のスケジュールがありません`}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
