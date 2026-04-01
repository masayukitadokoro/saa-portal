'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StudentLayout } from '@/components/student/StudentLayout';
import { Assignment, AssignmentsResponse, formatFileSize } from '@/types/submission';
import {
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Circle,
  AlertCircle,
  Upload,
  FileText,
  Link as LinkIcon,
  Loader2,
  Clock,
  ExternalLink,
  RotateCcw,
  Trash2,
  File,
  Image as ImageIcon,
} from 'lucide-react';

function groupByLecture(assignments: Assignment[]) {
  const map = new Map<string, { lectureNumber: number | null; lectureTitle: string; assignments: Assignment[] }>();
  for (const a of assignments) {
    const key = a.scheduleId;
    if (!map.has(key)) {
      map.set(key, { lectureNumber: a.lectureNumber, lectureTitle: a.lectureTitle, assignments: [] });
    }
    map.get(key)?.assignments.push(a);
  }
  return Array.from(map.values());
}

function StatusBadge({ assignment }: { assignment: Assignment }) {
  if (assignment.isSubmitted) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
        <CheckCircle2 className="w-2.5 h-2.5" />
        提出済
      </span>
    );
  }
  if (assignment.deadline) {
    const now = new Date();
    const dl = new Date(assignment.deadline);
    if (dl < now) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-red-700 bg-red-50 px-1.5 py-0.5 rounded">
          <AlertCircle className="w-2.5 h-2.5" />
          期限超過
        </span>
      );
    }
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
      <Circle className="w-2.5 h-2.5" />
      未提出
    </span>
  );
}

function getFileIcon(fileType: string | null) {
  if (!fileType) return <File className="w-4 h-4 text-gray-400" />;
  const t = fileType.toLowerCase();
  if (t.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
  if (t.includes('image') || t.includes('png') || t.includes('jpg')) return <ImageIcon className="w-4 h-4 text-blue-500" />;
  return <FileText className="w-4 h-4 text-gray-500" />;
}

export default function SubmissionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [stats, setStats] = useState({ total: 0, submitted: 0, pending: 0, progressRate: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedLectures, setExpandedLectures] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const r = await fetch('/api/student/submissions');
      const d: AssignmentsResponse = await r.json();
      setAssignments(d.assignments || []);
      setStats(d.stats || { total: 0, submitted: 0, pending: 0, progressRate: 0 });

      if (d.assignments?.length > 0) {
        const firstUnsubmitted = d.assignments.find((a) => !a.isSubmitted);
        const toSelect = firstUnsubmitted || d.assignments[0];
        setSelectedId(toSelect.id);
        setExpandedLectures(new Set([toSelect.scheduleId]));
      }
    } catch {}
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) fetchData();
  }, [authLoading, user, fetchData]);

  const selected = assignments.find((a) => a.id === selectedId) || null;
  const lectures = groupByLecture(assignments);

  const toggleLecture = (scheduleId: string) => {
    setExpandedLectures((prev) => {
      const next = new Set(prev);
      if (next.has(scheduleId)) next.delete(scheduleId);
      else next.add(scheduleId);
      return next;
    });
  };

  const selectAssignment = (a: Assignment) => {
    setSelectedId(a.id);
    setExpandedLectures((prev) => new Set(prev).add(a.scheduleId));
    setMessage(null);
    setUrlInput('');
  };

  const detectUrlType = (url: string) => {
    if (url.includes('docs.google.com/document')) return 'google_docs';
    if (url.includes('docs.google.com/presentation')) return 'google_slides';
    if (url.includes('docs.google.com/spreadsheets')) return 'google_sheets';
    return 'other';
  };

  const handleFileUpload = async (file: globalThis.File) => {
    if (!selected) return;
    setUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('scheduleId', selected.scheduleId);
      formData.append('assignmentType', selected.type);
      formData.append('assignmentTitle', selected.title);
      const r = await fetch('/api/student/submissions/upload', { method: 'POST', body: formData });
      const d = await r.json();
      if (d.success) {
        setMessage({ type: 'success', text: '提出しました' });
        await fetchData();
      } else {
        setMessage({ type: 'error', text: d.error || '提出に失敗しました' });
      }
    } catch {
      setMessage({ type: 'error', text: '提出に失敗しました' });
    }
    setUploading(false);
  };

  const handleUrlSubmit = async () => {
    if (!selected || !urlInput.trim()) return;
    setUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('scheduleId', selected.scheduleId);
      formData.append('assignmentType', selected.type);
      formData.append('assignmentTitle', selected.title);
      formData.append('urlLink', urlInput.trim());
      formData.append('urlType', detectUrlType(urlInput.trim()));
      const r = await fetch('/api/student/submissions/upload', { method: 'POST', body: formData });
      const d = await r.json();
      if (d.success) {
        setMessage({ type: 'success', text: '提出しました' });
        setUrlInput('');
        await fetchData();
      } else {
        setMessage({ type: 'error', text: d.error || '提出に失敗しました' });
      }
    } catch {
      setMessage({ type: 'error', text: '提出に失敗しました' });
    }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
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

  return (
    <StudentLayout>
      <div className="flex min-h-[calc(100vh-64px)]">
        {/* Sidebar: Lecture-grouped tree */}
        <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
          <div className="py-3 px-3">
            {/* Progress header */}
            <div className="px-2 mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                課題
              </p>
              <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                <span>{stats.submitted}/{stats.total} 提出</span>
                <span>{stats.progressRate}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${stats.progressRate}%` }}
                />
              </div>
            </div>

            {/* Lecture tree */}
            <nav className="space-y-0.5">
              {lectures.map((lec) => {
                const isExpanded = expandedLectures.has(lec.assignments[0]?.scheduleId);
                const scheduleId = lec.assignments[0]?.scheduleId;
                const allSubmitted = lec.assignments.every((a) => a.isSubmitted);
                const hasSelected = lec.assignments.some((a) => a.id === selectedId);

                return (
                  <div key={scheduleId}>
                    <button
                      onClick={() => toggleLecture(scheduleId)}
                      className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-[13px] rounded-md transition hover:bg-gray-50 ${
                        hasSelected && !isExpanded
                          ? 'text-indigo-600 font-medium'
                          : 'text-gray-700'
                      }`}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      )}
                      <span className="truncate flex-1 text-left">
                        {lec.lectureNumber ? `定例${lec.lectureNumber}` : lec.lectureTitle.substring(0, 12)}
                      </span>
                      {allSubmitted && (
                        <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="ml-3 border-l border-gray-100 pl-1 space-y-px mt-0.5 mb-1">
                        {lec.assignments.map((a) => (
                          <button
                            key={a.id}
                            onClick={() => selectAssignment(a)}
                            className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-[11px] rounded-md transition text-left ${
                              a.id === selectedId
                                ? 'bg-indigo-50 text-indigo-700 font-medium'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                            }`}
                          >
                            <span className="text-[10px] text-gray-400 flex-shrink-0 w-5">
                              {a.type === 'pre' ? '事前' : '事後'}
                            </span>
                            <span className="truncate flex-1">{a.title}</span>
                            <StatusBadge assignment={a} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {assignments.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">
                  課題がありません
                </p>
              )}
            </nav>
          </div>
        </aside>

        {/* Main: Assignment detail + submission */}
        <main className="flex-1 overflow-y-auto">
          {selected ? (
            <div className="max-w-2xl mx-auto px-8 py-8">
              {/* Header */}
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                <span>
                  {selected.lectureNumber
                    ? `定例講義${selected.lectureNumber}`
                    : selected.lectureTitle}
                </span>
                <span>•</span>
                <span>
                  {selected.type === 'pre' ? '事前課題' : '講義後課題'}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="text-xl font-bold text-gray-900">
                  {selected.title}
                </h1>
                <StatusBadge assignment={selected} />
              </div>

              {selected.description && (
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  {selected.description}
                </p>
              )}

              {selected.deadline && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
                  <Clock className="w-4 h-4" />
                  <span>
                    期限:{' '}
                    {new Date(selected.deadline).toLocaleDateString('ja-JP', {
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short',
                    })}
                  </span>
                </div>
              )}

              {/* Submission area */}
              {selected.isSubmitted && selected.submission ? (
                <div>
                  {/* Current submission */}
                  <div className="border border-green-200 bg-green-50/50 rounded-xl p-5 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-800">
                        提出済み
                      </span>
                      <span className="text-xs text-green-600">
                        {new Date(
                          selected.submission.submittedAt
                        ).toLocaleDateString('ja-JP', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* File info */}
                    {selected.submission.fileName && (
                      <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                        {getFileIcon(selected.submission.fileType)}
                        <span>{selected.submission.fileName}</span>
                        {selected.submission.fileSize && (
                          <span className="text-gray-400 text-xs">
                            ({formatFileSize(selected.submission.fileSize)})
                          </span>
                        )}
                      </div>
                    )}

                    {/* URL info */}
                    {selected.submission.urlLink && (
                      <a
                        href={selected.submission.urlLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        <span className="truncate">
                          {selected.submission.urlLink}
                        </span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    )}
                  </div>

                  {/* Resubmit toggle */}
                  <details className="group">
                    <summary className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 cursor-pointer py-2">
                      <RotateCcw className="w-3.5 h-3.5" />
                      再提出する
                    </summary>
                    <div className="mt-2">
                      <SubmissionForm
                        dragOver={dragOver}
                        setDragOver={setDragOver}
                        handleDrop={handleDrop}
                        handleFileUpload={handleFileUpload}
                        urlInput={urlInput}
                        setUrlInput={setUrlInput}
                        handleUrlSubmit={handleUrlSubmit}
                        uploading={uploading}
                        fileInputRef={fileInputRef}
                      />
                    </div>
                  </details>
                </div>
              ) : (
                <SubmissionForm
                  dragOver={dragOver}
                  setDragOver={setDragOver}
                  handleDrop={handleDrop}
                  handleFileUpload={handleFileUpload}
                  urlInput={urlInput}
                  setUrlInput={setUrlInput}
                  handleUrlSubmit={handleUrlSubmit}
                  uploading={uploading}
                  fileInputRef={fileInputRef}
                />
              )}

              {/* Message */}
              {message && (
                <div
                  className={`mt-4 p-3 rounded-lg text-sm ${
                    message.type === 'success'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {message.text}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
              <p>左のリストから課題を選択してください</p>
            </div>
          )}
        </main>
      </div>
    </StudentLayout>
  );
}

function SubmissionForm({
  dragOver,
  setDragOver,
  handleDrop,
  handleFileUpload,
  urlInput,
  setUrlInput,
  handleUrlSubmit,
  uploading,
  fileInputRef,
}: {
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleFileUpload: (file: globalThis.File) => void;
  urlInput: string;
  setUrlInput: (v: string) => void;
  handleUrlSubmit: () => void;
  uploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
          dragOver
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        {uploading ? (
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
        ) : (
          <>
            <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              ファイルをドラッグ&ドロップ
            </p>
            <p className="text-xs text-gray-400 mt-1">
              PDF, PPTX, XLSX, DOCX, PNG, JPG（最大50MB）
            </p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.pptx,.xlsx,.docx,.png,.jpg,.jpeg"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }}
        />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">または</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* URL input */}
      <div>
        <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
          <LinkIcon className="w-3 h-3" />
          URLリンクで提出
        </p>
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://docs.google.com/..."
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
          />
          <button
            onClick={handleUrlSubmit}
            disabled={uploading || !urlInput.trim()}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            提出
          </button>
        </div>
        <p className="text-[11px] text-gray-400 mt-1">
          Google Docs, Slides, Sheets, Driveに対応
        </p>
      </div>
    </div>
  );
}
