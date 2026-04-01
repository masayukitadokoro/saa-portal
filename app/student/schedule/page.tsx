'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StudentLayout } from '@/components/student/StudentLayout';
import {
  Video,
  FileText,
  ExternalLink,
  Loader2,
  Calendar,
  Clock,
  User,
  MapPin,
  Link as LinkIcon,
  BookOpen,
  FolderOpen,
  PlayCircle,
  MessageSquare,
} from 'lucide-react';

type EventType = 'regular' | 'expert' | 'office_hour' | 'special' | 'other';

interface ScheduleEvent {
  id: string;
  date: string;
  endDate?: string;
  name: string;
  eventType: EventType;
  venue: string | null;
  preSurveyUrl: string | null;
  postSurveyUrl: string | null;
  lectureVideoUrl: string | null;
  materialUrl: string | null;
  submissionFolderUrl: string | null;
  zoomUrl: string | null;
}

const EVENT_TYPE_CONFIG: Record<
  EventType,
  { label: string; color: string; dotClass: string }
> = {
  regular: {
    label: '定例講義',
    color: 'text-red-600',
    dotClass: 'bg-red-400',
  },
  expert: {
    label: '専門家講義',
    color: 'text-green-600',
    dotClass: 'bg-green-500',
  },
  office_hour: {
    label: 'オフィスアワー',
    color: 'text-blue-600',
    dotClass: 'bg-blue-400',
  },
  special: {
    label: '特別講義',
    color: 'text-amber-600',
    dotClass: 'bg-amber-400',
  },
  other: {
    label: 'その他',
    color: 'text-gray-600',
    dotClass: 'bg-gray-400',
  },
};

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function formatTimeRange(start: string, end?: string): string {
  const s = formatTime(start);
  if (!end) return s;
  return `${s} - ${formatTime(end)}`;
}

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${DAY_NAMES[d.getDay()]}）`;
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
}

function groupByMonth(
  events: ScheduleEvent[]
): { month: string; events: ScheduleEvent[] }[] {
  const groups: Map<string, ScheduleEvent[]> = new Map();
  for (const ev of events) {
    const key = getMonthKey(ev.date);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)?.push(ev);
  }
  return Array.from(groups.entries()).map(([month, events]) => ({
    month,
    events,
  }));
}

function extractInstructor(name: string): string | null {
  const match = name.match(/[：:]\s*(.+)/);
  return match ? match[1] : null;
}

export default function SchedulePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!authLoading && user) {
      fetch('/api/student/schedule')
        .then((r) => r.json())
        .then((d) => {
          if (d.events) {
            setEvents(d.events);
            if (d.events.length > 0) {
              const now = new Date();
              const upcoming = d.events.find(
                (e: ScheduleEvent) => new Date(e.date) >= now
              );
              setSelectedId(
                upcoming ? upcoming.id : d.events[0].id
              );
            }
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [authLoading, user]);

  const selected = events.find((e) => e.id === selectedId) || null;
  const grouped = groupByMonth(events);

  if (authLoading || loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="flex min-h-[calc(100vh-64px)]">
        {/* Sidebar: Date-badge list */}
        <aside className="w-60 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
          <div className="py-3">
            {grouped.map((group) => (
              <div key={group.month}>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 pt-3 pb-1">
                  {group.month}
                </p>
                {group.events.map((ev) => {
                  const d = new Date(ev.date);
                  const day = d.getDate();
                  const dow = DAY_NAMES[d.getDay()];
                  const config = EVENT_TYPE_CONFIG[ev.eventType];
                  const isActive = ev.id === selectedId;

                  return (
                    <button
                      key={ev.id}
                      onClick={() => setSelectedId(ev.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition ${
                        isActive
                          ? 'bg-indigo-50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {/* Date badge */}
                      <div className="w-9 flex-shrink-0 text-center">
                        <div
                          className={`text-[17px] font-semibold leading-none ${
                            isActive
                              ? 'text-indigo-600'
                              : 'text-gray-800'
                          }`}
                        >
                          {day}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {dow}
                        </div>
                      </div>

                      {/* Event info */}
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-[12px] font-medium truncate ${
                            isActive
                              ? 'text-indigo-700'
                              : 'text-gray-800'
                          }`}
                        >
                          {ev.name}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span
                            className={`w-[5px] h-[5px] rounded-full flex-shrink-0 ${config.dotClass}`}
                          />
                          <span className="text-[10px] text-gray-400 truncate">
                            {formatTime(ev.date)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}

            {events.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">
                スケジュールがありません
              </p>
            )}
          </div>
        </aside>

        {/* Main: Event detail */}
        <main className="flex-1 overflow-y-auto">
          {selected ? (
            <div className="max-w-3xl mx-auto px-8 py-8">
              {/* Category badge */}
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`w-2 h-2 rounded-full ${EVENT_TYPE_CONFIG[selected.eventType].dotClass}`}
                />
                <span
                  className={`text-sm font-medium ${EVENT_TYPE_CONFIG[selected.eventType].color}`}
                >
                  {EVENT_TYPE_CONFIG[selected.eventType].label}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {selected.name}
              </h1>

              {/* Meta info */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{formatFullDate(selected.date)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>
                    {formatTimeRange(
                      selected.date,
                      selected.endDate
                    )}
                  </span>
                </div>
                {selected.venue && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{selected.venue}</span>
                  </div>
                )}
              </div>

              {/* Zoom button */}
              {selected.zoomUrl && (
                <a
                  href={selected.zoomUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium mb-8"
                >
                  <Video className="w-4 h-4" />
                  講義にZoom参加する
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              {/* Resources section */}
              <div className="space-y-3">
                {/* Pre-lecture materials */}
                {selected.materialUrl && (
                  <div className="border border-gray-200 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-3">
                      <FileText className="w-4 h-4 text-gray-400" />
                      講義資料
                    </h3>
                    <a
                      href={selected.materialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      資料を開く
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Recording */}
                {selected.lectureVideoUrl && (
                  <div className="border border-gray-200 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-3">
                      <PlayCircle className="w-4 h-4 text-gray-400" />
                      アーカイブ動画
                    </h3>
                    <a
                      href={selected.lectureVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      <Video className="w-3.5 h-3.5" />
                      動画を視聴する
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Surveys */}
                {(selected.preSurveyUrl ||
                  selected.postSurveyUrl ||
                  selected.submissionFolderUrl) && (
                  <div className="border border-gray-200 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-3">
                      <MessageSquare className="w-4 h-4 text-gray-400" />
                      アンケート・提出
                    </h3>
                    <div className="space-y-2">
                      {selected.preSurveyUrl && (
                        <a
                          href={selected.preSurveyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                          事前アンケート
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {selected.postSurveyUrl && (
                        <a
                          href={selected.postSurveyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                          講義後アンケート
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {selected.submissionFolderUrl && (
                        <a
                          href={selected.submissionFolderUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          提出フォルダ
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* No resources message */}
                {!selected.materialUrl &&
                  !selected.lectureVideoUrl &&
                  !selected.preSurveyUrl &&
                  !selected.postSurveyUrl &&
                  !selected.submissionFolderUrl && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      この講義の資料はまだ登録されていません
                    </div>
                  )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
              <p>左のリストからイベントを選択してください</p>
            </div>
          )}
        </main>
      </div>
    </StudentLayout>
  );
}
