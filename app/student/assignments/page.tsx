// /app/student/assignments/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StudentLayout } from '@/components/student/StudentLayout';
import { Card } from '@/components/student/ui';
import { 
  FileText, 
  ChevronRight, 
  ChevronDown,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  FolderOpen,
  History,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface Assignment {
  id: string;
  schedule_id: string;
  schedule_title: string;
  schedule_date: string;
  title: string;
  description: string | null;
  is_required: boolean;
  deadline: string | null;
  folder_url: string | null;
  type: 'pre' | 'post';
  submission_status: 'submitted' | 'not_submitted' | 'overdue';
  latest_submission: {
    id: string;
    submitted_at: string;
    notes: string | null;
  } | null;
  submission_count: number;
}

interface ScheduleGroup {
  schedule_id: string;
  schedule_title: string;
  schedule_date: string;
  event_type: string;
  assignments: Assignment[];
}

interface Stats {
  total: number;
  submitted: number;
  pending: number;
  overdue: number;
}

const getStatusConfig = (status: Assignment['submission_status']) => {
  switch (status) {
    case 'submitted':
      return {
        icon: CheckCircle2,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        label: '提出済み',
      };
    case 'overdue':
      return {
        icon: AlertCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        label: '期限超過',
      };
    case 'not_submitted':
    default:
      return {
        icon: Clock,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        label: '未提出',
      };
  }
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function AssignmentsPage() {
  const { profile, loading: authLoading } = useAuth();
  const [grouped, setGrouped] = useState<ScheduleGroup[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, submitted: 0, pending: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [expandedSchedules, setExpandedSchedules] = useState<Set<string>>(new Set());
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/student/assignments');
      if (!res.ok) throw new Error('課題の取得に失敗しました');
      const data = await res.json();
      setGrouped(data.grouped || []);
      setStats(data.stats || { total: 0, submitted: 0, pending: 0, overdue: 0 });
      
      if (data.grouped?.length > 0) {
        setExpandedSchedules(new Set([data.grouped[0].schedule_id]));
        if (data.grouped[0].assignments?.length > 0) {
          setSelectedAssignment(data.grouped[0].assignments[0]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '課題の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissionHistory = async (assignmentId: string) => {
    try {
      setLoadingHistory(true);
      const res = await fetch(`/api/student/assignments/${assignmentId}/submit`);
      if (!res.ok) throw new Error('提出履歴の取得に失敗しました');
      const data = await res.json();
      setSubmissions(data.submissions || []);
    } catch (err) {
      console.error('提出履歴取得エラー:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAssignment) return;
    
    try {
      setSubmitting(true);
      const res = await fetch(`/api/student/assignments/${selectedAssignment.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submitted_at: new Date().toISOString() }),
      });
      
      if (!res.ok) throw new Error('提出記録に失敗しました');
      
      await fetchAssignments();
      await fetchSubmissionHistory(selectedAssignment.id);
      
    } catch (err) {
      alert(err instanceof Error ? err.message : '提出記録に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!authLoading && profile) {
      fetchAssignments();
    }
  }, [authLoading, profile]);

  useEffect(() => {
    if (selectedAssignment) {
      fetchSubmissionHistory(selectedAssignment.id);
    }
  }, [selectedAssignment?.id]);

  const toggleSchedule = (scheduleId: string) => {
    const newExpanded = new Set(expandedSchedules);
    if (newExpanded.has(scheduleId)) {
      newExpanded.delete(scheduleId);
    } else {
      newExpanded.add(scheduleId);
    }
    setExpandedSchedules(newExpanded);
  };

  if (authLoading || loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </StudentLayout>
    );
  }

  if (error) {
    return (
      <StudentLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchAssignments}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <RefreshCw className="w-4 h-4" />
            再読み込み
          </button>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-600" />
            学習の記録
          </h1>
          <p className="mt-1 text-gray-600">
            課題の提出状況を確認・記録できます
          </p>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-sm text-gray-600">全課題</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </Card>
          <Card className="p-4 border-l-4 border-green-500">
            <div className="text-sm text-gray-600">提出済み</div>
            <div className="text-2xl font-bold text-green-600">{stats.submitted}</div>
          </Card>
          <Card className="p-4 border-l-4 border-amber-500">
            <div className="text-sm text-gray-600">未提出</div>
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
          </Card>
          <Card className="p-4 border-l-4 border-red-500">
            <div className="text-sm text-gray-600">期限超過</div>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          </Card>
        </div>

        <div className="flex gap-6">
          <div className="w-80 flex-shrink-0">
            <Card className="overflow-hidden">
              <div className="p-4 bg-gray-50 border-b">
                <h2 className="font-semibold text-gray-900">課題一覧</h2>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {grouped.map((group) => (
                  <div key={group.schedule_id} className="border-b last:border-b-0">
                    <button
                      onClick={() => toggleSchedule(group.schedule_id)}
                      className="w-full px-4 py-3 flex items-center gap-2 hover:bg-gray-50 transition-colors"
                    >
                      {expandedSchedules.has(group.schedule_id) ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {group.schedule_title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(group.schedule_date)}
                        </div>
                      </div>
                    </button>

                    {expandedSchedules.has(group.schedule_id) && (
                      <div className="bg-gray-50 pb-2">
                        {group.assignments.map((assignment) => {
                          const statusConfig = getStatusConfig(assignment.submission_status);
                          const StatusIcon = statusConfig.icon;
                          const isSelected = selectedAssignment?.id === assignment.id;

                          return (
                            <button
                              key={assignment.id}
                              onClick={() => setSelectedAssignment(assignment)}
                              className={`w-full pl-10 pr-4 py-2 flex items-center gap-2 text-left transition-colors ${
                                isSelected
                                  ? 'bg-indigo-100 border-r-2 border-indigo-600'
                                  : 'hover:bg-gray-100'
                              }`}
                            >
                              <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                              <div className="flex-1 min-w-0">
                                <div className={`text-sm truncate ${isSelected ? 'text-indigo-900 font-medium' : 'text-gray-700'}`}>
                                  {assignment.title}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {assignment.type === 'pre' ? '講義前' : '講義後'}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}

                {grouped.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    課題がありません
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="flex-1">
            {selectedAssignment ? (
              <Card className="overflow-hidden">
                <div className="p-6 border-b">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">
                        {selectedAssignment.schedule_title}
                      </div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {selectedAssignment.title}
                      </h2>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      getStatusConfig(selectedAssignment.submission_status).bgColor
                    } ${getStatusConfig(selectedAssignment.submission_status).color}`}>
                      {getStatusConfig(selectedAssignment.submission_status).label}
                    </span>
                  </div>
                </div>

                <div className="p-6 border-b">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    課題の詳細
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-gray-600 w-20">種別</span>
                      <span className="text-gray-900">
                        {selectedAssignment.type === 'pre' ? '📝 講義前課題' : '📋 講義後課題'}
                      </span>
                    </div>
                    {selectedAssignment.deadline && (
                      <div className="flex items-center gap-4">
                        <span className="text-gray-600 w-20">提出期限</span>
                        <span className={`font-medium ${
                          new Date(selectedAssignment.deadline) < new Date() 
                            ? 'text-red-600' 
                            : 'text-gray-900'
                        }`}>
                          {formatDate(selectedAssignment.deadline)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 bg-gray-50 border-b">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    提出操作
                  </h3>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    {selectedAssignment.folder_url ? (
                      <a
                        href={selectedAssignment.folder_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-medium"
                      >
                        <ExternalLink className="w-5 h-5" />
                        Google Driveで提出する
                      </a>
                    ) : (
                      <div className="flex-1 px-4 py-3 bg-gray-100 text-gray-500 rounded-lg text-center">
                        提出フォルダが設定されていません
                      </div>
                    )}
                    
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || selectedAssignment.submission_status === 'submitted'}
                      className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                        selectedAssignment.submission_status === 'submitted'
                          ? 'bg-green-100 text-green-700 cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {submitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : selectedAssignment.submission_status === 'submitted' ? (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          提出済み
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          提出完了を記録
                        </>
                      )}
                    </button>
                  </div>
                  
                  <p className="mt-3 text-xs text-gray-500">
                    ※ Google Driveにファイルをアップロード後、「提出完了を記録」ボタンを押してください
                  </p>
                </div>

                <div className="p-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <History className="w-4 h-4" />
                    提出履歴
                  </h3>
                  
                  {loadingHistory ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                    </div>
                  ) : submissions.length > 0 ? (
                    <div className="space-y-2">
                      {submissions.map((sub, index) => (
                        <div
                          key={sub.id}
                          className={`flex items-center gap-3 p-3 rounded-lg ${
                            index === 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                          }`}
                        >
                          <CheckCircle2 className={`w-5 h-5 ${
                            index === 0 ? 'text-green-600' : 'text-gray-400'
                          }`} />
                          <div className="flex-1">
                            <div className={`text-sm font-medium ${
                              index === 0 ? 'text-green-800' : 'text-gray-700'
                            }`}>
                              {formatDateTime(sub.submitted_at)}
                            </div>
                            {sub.notes && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                {sub.notes}
                              </div>
                            )}
                          </div>
                          {index === 0 && (
                            <span className="text-xs text-green-600 font-medium">
                              最新
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-gray-500">
                      まだ提出がありません
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="p-12 text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>左の一覧から課題を選択してください</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
