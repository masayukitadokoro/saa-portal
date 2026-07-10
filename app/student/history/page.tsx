'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { StudentLayout } from '@/components/student/StudentLayout';
import {
  Clock,
  Video,
  FileText,
  BarChart3,
  Loader2,
  Play,
  Upload,
  CheckCircle2,
  Filter,
} from 'lucide-react';

type ActivityType = 'video' | 'submission' | 'scm';

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  subtitle: string;
  timestamp: string;
  meta?: string;
}

const STORAGE_KEY_RESULTS = 'scm_results_history';

const CATEGORY_NAMES: Record<string, string> = {
  kagaku: '起業の科学',
  taizen: '起業大全',
  sanbo: '起業参謀',
};

const TYPE_CONFIG: Record<ActivityType, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  video: {
    label: '動画視聴',
    icon: <Play className="w-3.5 h-3.5" />,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  submission: {
    label: '課題提出',
    icon: <Upload className="w-3.5 h-3.5" />,
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  scm: {
    label: 'SCM受験',
    icon: <BarChart3 className="w-3.5 h-3.5" />,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
};

function groupByDate(activities: Activity[]): { date: string; activities: Activity[] }[] {
  const map = new Map<string, Activity[]>();
  for (const a of activities) {
    const d = new Date(a.timestamp);
    const key = d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
    if (!map.has(key)) map.set(key, []);
    map.get(key)?.push(a);
  }
  return Array.from(map.entries()).map(([date, activities]) => ({ date, activities }));
}

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ActivityType | 'all'>('all');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!authLoading && user) fetchAll();
  }, [authLoading, user]);

  const fetchAll = async () => {
    const all: Activity[] = [];

    try {
      const res = await fetch('/api/bookmarks?limit=100');
      if (res.ok) {
        const d = await res.json();
        // Use bookmarks as a proxy for watched videos for now
      }
    } catch {}

    // Submissions
    try {
      const res = await fetch('/api/student/submissions');
      if (res.ok) {
        const d = await res.json();
        (d.assignments || []).forEach((a: any) => {
          if (a.isSubmitted && a.submission) {
            all.push({
              id: `sub-${a.id}`,
              type: 'submission',
              title: a.title,
              subtitle: a.lectureTitle,
              timestamp: a.submission.submittedAt,
              meta: a.type === 'pre' ? '事前課題' : '講義後課題',
            });
          }
        });
      }
    } catch {}

    // SCM results from localStorage
    try {
      const resultsStr = localStorage.getItem(STORAGE_KEY_RESULTS);
      if (resultsStr) {
        const results = JSON.parse(resultsStr);
        results.forEach((r: any, i: number) => {
          all.push({
            id: `scm-${r.id}`,
            type: 'scm',
            title: `SCM 第${i + 1}回受験`,
            subtitle: `総合スコア: ${r.totalPercentage}%`,
            timestamp: r.takenAt,
          });
        });
      }
    } catch {}

    // Sort by timestamp descending
    all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setActivities(all);
    setLoading(false);
  };

  const filtered = filter === 'all' ? activities : activities.filter((a) => a.type === filter);
  const grouped = groupByDate(filtered);

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
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            <h1 className="text-xl font-bold text-gray-900">学習履歴</h1>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            {[
              { key: 'all' as const, label: '全て' },
              { key: 'submission' as const, label: '課題' },
              { key: 'scm' as const, label: 'SCM' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                  filter === f.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">学習履歴はまだありません</p>
            <p className="text-sm text-gray-400">
              動画の視聴や課題の提出を始めるとここに表示されます
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map((group) => (
              <div key={group.date}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  {group.date}
                </p>
                <div className="space-y-1.5">
                  {group.activities.map((a) => {
                    const config = TYPE_CONFIG[a.type];
                    return (
                      <div
                        key={a.id}
                        className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl"
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bg} ${config.color}`}
                        >
                          {config.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {a.title}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {a.subtitle}
                            {a.meta && (
                              <span className="ml-2 text-gray-300">
                                • {a.meta}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="text-[11px] text-gray-400 flex-shrink-0">
                          {new Date(a.timestamp).toLocaleTimeString('ja-JP', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
