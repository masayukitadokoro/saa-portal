'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { StudentLayout } from '@/components/student/StudentLayout';
import {
  Upload, FileText, Link2, Clock, Eye, Download, Trash2, 
  CheckCircle2, AlertCircle, Loader2, File, FileSpreadsheet, 
  Presentation, Image, ExternalLink, X, History, FolderOpen,
  AlertTriangle, Info, ZoomIn, ZoomOut, RefreshCw, ArrowLeft,
  Filter, XCircle
} from 'lucide-react';

// ============================================
// 型定義
// ============================================
interface Submission {
  id: string;
  file_name: string | null;
  file_path: string | null;
  file_size: number | null;
  file_type: string | null;
  url_link: string | null;
  url_type: string | null;
  submitted_at: string;
  file_url?: string | null;
  status: string;
}

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
  latest_submission: Submission | null;
  submission_count: number;
}

// ============================================
// ユーティリティ関数
// ============================================
const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ja-JP', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const formatDateShort = (dateStr: string): string => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const getDaysUntilDeadline = (deadline: string | null): number | null => {
  if (!deadline) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  const diffTime = deadlineDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const formatDeadlineRelative = (deadline: string | null): { text: string; urgent: boolean } | null => {
  const days = getDaysUntilDeadline(deadline);
  if (days === null) return null;
  if (days < 0) return { text: '期限超過', urgent: true };
  if (days === 0) return { text: '今日まで', urgent: true };
  if (days === 1) return { text: '明日まで', urgent: true };
  if (days <= 3) return { text: `あと${days}日`, urgent: true };
  if (days <= 7) return { text: `あと${days}日（${formatDateShort(deadline!)}まで）`, urgent: false };
  return { text: `${formatDateShort(deadline!)}まで`, urgent: false };
};

const getUrlTypeLabel = (urlType: string | null): string => {
  switch (urlType) {
    case 'google_slides': return 'Google スライド';
    case 'google_docs': return 'Google ドキュメント';
    case 'google_sheets': return 'Google スプレッドシート';
    case 'google_drive': return 'Google ドライブ';
    default: return '外部リンク';
  }
};

const ALLOWED_EXTENSIONS = ['pdf', 'pptx', 'ppt', 'xlsx', 'xls', 'docx', 'doc', 'png', 'jpg', 'jpeg'];
const validateFileType = (fileName: string): boolean => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ext ? ALLOWED_EXTENSIONS.includes(ext) : false;
};

// ============================================
// FileIcon コンポーネント
// ============================================
const FileIcon = ({ type, className = "w-5 h-5" }: { type: string | null; className?: string }) => {
  switch (type?.toLowerCase()) {
    case 'pdf': return <FileText className={`${className} text-red-500`} />;
    case 'pptx': case 'ppt': case 'google_slides': return <Presentation className={`${className} text-orange-500`} />;
    case 'xlsx': case 'xls': case 'google_sheets': return <FileSpreadsheet className={`${className} text-green-600`} />;
    case 'docx': case 'doc': case 'google_docs': return <FileText className={`${className} text-blue-500`} />;
    case 'jpg': case 'jpeg': case 'png': case 'gif': return <Image className={`${className} text-purple-500`} />;
    case 'url': return <Link2 className={`${className} text-indigo-500`} />;
    default: return <File className={`${className} text-gray-400`} />;
  }
};

// ============================================
// トースト通知コンポーネント
// ============================================
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-gray-700';
  const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? AlertCircle : Info;

  return (
    <div className={`fixed top-20 right-4 z-[100] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl text-white ${bgColor} animate-slide-in`}>
      <Icon className="w-5 h-5" />
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70"><X className="w-4 h-4" /></button>
    </div>
  );
};

// ============================================
// アップロード進捗バー
// ============================================
const UploadProgressBar = ({ progress, fileName }: { progress: number | null; fileName: string }) => {
  if (progress === null) return null;
  return (
    <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-indigo-700 truncate">{fileName}</span>
        <span className="text-sm text-indigo-600">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-indigo-200 rounded-full h-2">
        <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${Math.min(progress, 100)}%` }} />
      </div>
    </div>
  );
};

// ============================================
// 削除確認モーダル
// ============================================
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, fileName, isDeleting }: { isOpen: boolean; onClose: () => void; onConfirm: () => void; fileName: string; isDeleting: boolean }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isDeleting) onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose, isDeleting]);

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70]">
      <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-full"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
          <h3 className="text-lg font-bold text-gray-900">ファイルを削除しますか？</h3>
        </div>
        <p className="font-medium text-gray-900 bg-gray-100 px-3 py-2 rounded-lg mb-4 break-all">{fileName}</p>
        <p className="text-red-600 text-sm mb-6">⚠️ この操作は取り消せません。</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} disabled={isDeleting} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium disabled:opacity-50">キャンセル</button>
          <button onClick={onConfirm} disabled={isDeleting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 flex items-center gap-2">
            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
            削除する
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// URL公開確認モーダル
// ============================================
const UrlPublicCheckModal = ({ isOpen, onClose, onConfirm, urlType, urlLink, isSubmitting }: { isOpen: boolean; onClose: () => void; onConfirm: () => void; urlType: string; urlLink: string; isSubmitting: boolean }) => {
  const [isChecked, setIsChecked] = useState(false);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) { onClose(); setIsChecked(false); }
      if (e.key === 'Enter' && isChecked && !isSubmitting) { onConfirm(); setIsChecked(false); }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, isChecked, onClose, onConfirm, isSubmitting]);

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70]">
      <div className="bg-white rounded-xl p-6 max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-100 rounded-full"><Info className="w-6 h-6 text-amber-600" /></div>
          <h3 className="text-lg font-bold text-gray-900">共有設定を確認してください</h3>
        </div>
        <div className="mb-4">
          <p className="text-gray-600 mb-3">
            提出する<span className="font-bold text-indigo-600">{getUrlTypeLabel(urlType)}</span>が
            <span className="font-bold text-gray-900">「リンクを知っている全員」</span>に共有されていることを確認してください。
          </p>
          <div className="p-3 bg-gray-50 rounded-lg border text-sm">
            <p className="text-gray-500 mb-1">提出するリンク:</p>
            <p className="text-gray-900 break-all font-mono text-xs">{urlLink}</p>
          </div>
        </div>
        <label className="flex items-center gap-3 mb-6 cursor-pointer group">
          <input type="checkbox" checked={isChecked} onChange={(e) => setIsChecked(e.target.checked)} disabled={isSubmitting} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
          <span className="text-gray-700 group-hover:text-gray-900">共有設定を確認しました</span>
        </label>
        <div className="flex gap-3 justify-end">
          <button onClick={() => { onClose(); setIsChecked(false); }} disabled={isSubmitting} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium disabled:opacity-50">キャンセル</button>
          <button onClick={() => { onConfirm(); setIsChecked(false); }} disabled={!isChecked || isSubmitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 flex items-center gap-2">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            提出する
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// プレビューモーダル
// ============================================
const PreviewModal = ({ isOpen, onClose, file, onDelete, onDownload }: { isOpen: boolean; onClose: () => void; file: Submission | null; onDelete: () => void; onDownload: () => void }) => {
  const [zoom, setZoom] = useState(100);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      setImageError(false);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !file) return null;

  const isUrl = file.url_link !== null;
  const isPdf = file.file_type === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(file.file_type?.toLowerCase() || '');
  const displayName = file.file_name || file.url_link || '';
  const canPreview = (isPdf || isImage) && file.file_url;

  return (
    <>
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] mx-4 overflow-hidden flex flex-col shadow-2xl">
          <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-3 min-w-0">
              <FileIcon type={isUrl ? file.url_type : file.file_type} className="w-6 h-6 flex-shrink-0" />
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 truncate">{file.file_name || getUrlTypeLabel(file.url_type)}</h3>
                <p className="text-sm text-gray-500">{formatDate(file.submitted_at)}{file.file_size && <> • {formatFileSize(file.file_size)}</>}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition" title="閉じる (ESC)"><X className="w-6 h-6 text-gray-500" /></button>
          </div>

          <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center min-h-[400px]">
            {isUrl ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-lg max-w-md w-full">
                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileIcon type={file.url_type} className="w-10 h-10" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">{getUrlTypeLabel(file.url_type)}</h4>
                <p className="text-gray-500 text-sm mb-6 break-all font-mono bg-gray-50 p-3 rounded-lg">{file.url_link}</p>
                <a href={file.url_link || ''} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition text-lg">
                  <ExternalLink className="w-5 h-5" />リンクを開く
                </a>
              </div>
            ) : canPreview && !imageError ? (
              <div className="p-6 w-full flex justify-center">
                <div className="bg-white shadow-lg rounded-lg overflow-hidden" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}>
                  {isPdf ? (
                    <iframe src={file.file_url || ''} className="w-[800px] h-[600px]" />
                  ) : (
                    <img src={file.file_url || ''} alt={file.file_name || 'Preview'} className="max-w-full max-h-[600px] object-contain" onError={() => setImageError(true)} />
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center shadow-lg max-w-md">
                <FileIcon type={file.file_type} className="w-24 h-24 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">{file.file_name}</p>
                <p className="text-gray-500 text-sm mb-4">{file.file_size && formatFileSize(file.file_size)}</p>
                <p className="text-gray-400 text-sm">ダウンロードして確認してください。</p>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {canPreview && (
                <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1 border">
                  <button onClick={() => setZoom(z => Math.max(50, z - 25))} className="p-1 hover:bg-gray-100 rounded"><ZoomOut className="w-5 h-5 text-gray-600" /></button>
                  <span className="text-sm text-gray-600 min-w-[50px] text-center">{zoom}%</span>
                  <button onClick={() => setZoom(z => Math.min(200, z + 25))} className="p-1 hover:bg-gray-100 rounded"><ZoomIn className="w-5 h-5 text-gray-600" /></button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!isUrl && (
                <button onClick={onDownload} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                  <Download className="w-5 h-5" />ダウンロード
                </button>
              )}
              <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium">
                <Trash2 className="w-5 h-5" />削除
              </button>
            </div>
          </div>
        </div>
      </div>
      <DeleteConfirmModal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={() => { setShowDeleteConfirm(false); onDelete(); onClose(); }} fileName={displayName} isDeleting={false} />
    </>
  );
};

// ============================================
// メインコンテンツ（Suspenseでラップする必要あり）
// ============================================
function SubmissionsContent() {
  const searchParams = useSearchParams();
  const scheduleIdParam = searchParams.get('schedule');  // 講義でフィルタ
  const assignmentIdParam = searchParams.get('assignment');  // 特定課題を選択
  
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const [previewFile, setPreviewFile] = useState<Submission | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; fileName: string; submissionId: string }>({ isOpen: false, fileName: '', submissionId: '' });
  const [urlCheckModal, setUrlCheckModal] = useState<{ isOpen: boolean; url: string; urlType: string }>({ isOpen: false, url: '', urlType: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [dragOver, setDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadFileName, setUploadFileName] = useState('');

  // フィルタリング: scheduleIdParamがある場合はその講義の課題のみ表示
  const filteredAssignments = scheduleIdParam 
    ? assignments.filter(a => a.schedule_id === scheduleIdParam)
    : assignments;

  const selected = assignments.find(a => a.id === selectedId);
  
  // フィルタされた講義タイトルを取得
  const filteredScheduleTitle = scheduleIdParam && filteredAssignments.length > 0
    ? filteredAssignments[0].schedule_title
    : null;

  const sortedAssignments = [...filteredAssignments].sort((a, b) => {
    if ((a.submission_status === 'submitted') === (b.submission_status === 'submitted')) return 0;
    return a.submission_status === 'submitted' ? 1 : -1;
  });

  // 課題一覧を取得
  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/student/assignments');
      if (!res.ok) throw new Error('課題一覧の取得に失敗しました');
      const data = await res.json();
      setAssignments(data.assignments || []);
      
      // URLパラメータで指定された課題があれば選択
      if (assignmentIdParam && data.assignments?.find((a: Assignment) => a.id === assignmentIdParam)) {
        setSelectedId(assignmentIdParam);
      } else if (scheduleIdParam) {
        // scheduleIdでフィルタされた課題から最初の未提出を選択
        const filtered = data.assignments?.filter((a: Assignment) => a.schedule_id === scheduleIdParam);
        const firstNotSubmitted = filtered?.find((a: Assignment) => a.submission_status !== 'submitted');
        if (firstNotSubmitted) {
          setSelectedId(firstNotSubmitted.id);
        } else if (filtered?.length > 0) {
          setSelectedId(filtered[0].id);
        }
      } else {
        // デフォルト: 最初の未提出課題を選択
        const firstNotSubmitted = data.assignments?.find((a: Assignment) => a.submission_status !== 'submitted');
        if (firstNotSubmitted) {
          setSelectedId(firstNotSubmitted.id);
        } else if (data.assignments?.length > 0) {
          setSelectedId(data.assignments[0].id);
        }
      }
    } catch (error) {
      console.error(error);
      setToast({ message: '課題一覧の取得に失敗しました', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [assignmentIdParam, scheduleIdParam]);

  // 提出履歴を取得
  const fetchSubmissions = useCallback(async (assignmentId: string) => {
    try {
      setLoadingSubmissions(true);
      const res = await fetch(`/api/student/assignments/${assignmentId}/submit`);
      if (!res.ok) throw new Error('提出履歴の取得に失敗しました');
      const data = await res.json();
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error(error);
      setToast({ message: '提出履歴の取得に失敗しました', type: 'error' });
    } finally {
      setLoadingSubmissions(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  useEffect(() => {
    if (selectedId) {
      fetchSubmissions(selectedId);
    }
  }, [selectedId, fetchSubmissions]);

  // ファイルアップロード
  const handleFileUpload = async (file: File) => {
    if (!selectedId || !selected) return;

    if (!validateFileType(file.name)) {
      setToast({ message: `対応していないファイル形式です。対応形式: ${ALLOWED_EXTENSIONS.join(', ').toUpperCase()}`, type: 'error' });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setToast({ message: 'ファイルサイズは50MB以下にしてください', type: 'error' });
      return;
    }

    setUploadFileName(file.name);
    setUploadProgress(0);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev === null || prev >= 90) return prev;
          return prev + Math.random() * 20;
        });
      }, 200);

      const res = await fetch(`/api/student/assignments/${selectedId}/submit`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '提出に失敗しました');
      }

      setTimeout(() => {
        setUploadProgress(null);
        setUploadFileName('');
        setToast({ message: '提出が完了しました', type: 'success' });
        fetchAssignments();
        fetchSubmissions(selectedId);
      }, 500);

    } catch (error: any) {
      setUploadProgress(null);
      setUploadFileName('');
      setToast({ message: error.message || '提出に失敗しました', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // URL提出
  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return;
    let urlType = 'other';
    if (urlInput.includes('docs.google.com/presentation')) urlType = 'google_slides';
    else if (urlInput.includes('docs.google.com/document')) urlType = 'google_docs';
    else if (urlInput.includes('docs.google.com/spreadsheets')) urlType = 'google_sheets';
    else if (urlInput.includes('drive.google.com')) urlType = 'google_drive';
    setUrlCheckModal({ isOpen: true, url: urlInput, urlType });
  };

  const confirmUrlSubmit = async () => {
    if (!selectedId) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/student/assignments/${selectedId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url_link: urlCheckModal.url }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '提出に失敗しました');
      }

      setUrlInput('');
      setUrlCheckModal({ isOpen: false, url: '', urlType: '' });
      setToast({ message: '提出が完了しました', type: 'success' });
      fetchAssignments();
      fetchSubmissions(selectedId);

    } catch (error: any) {
      setToast({ message: error.message || '提出に失敗しました', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 削除
  const handleDeleteFile = (submissionId: string, fileName: string) => {
    setDeleteModal({ isOpen: true, fileName, submissionId });
  };

  const confirmDelete = async () => {
    if (!selectedId) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/student/assignments/${selectedId}/submit?submissionId=${deleteModal.submissionId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '削除に失敗しました');
      }

      setDeleteModal({ isOpen: false, fileName: '', submissionId: '' });
      setToast({ message: 'ファイルを削除しました', type: 'success' });
      fetchAssignments();
      fetchSubmissions(selectedId);

    } catch (error: any) {
      setToast({ message: error.message || '削除に失敗しました', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  // ダウンロード
  const handleDownload = (file: Submission) => {
    if (file.file_url) {
      window.open(file.file_url, '_blank');
      setToast({ message: 'ダウンロードを開始しました', type: 'success' });
    } else {
      setToast({ message: 'ダウンロードリンクが見つかりません', type: 'error' });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @keyframes slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* フィルタバナー: 特定の講義でフィルタリング中の場合 */}
      {scheduleIdParam && filteredScheduleTitle && (
        <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-indigo-600" />
            <div>
              <p className="text-sm text-indigo-600 font-medium">講義でフィルタ中</p>
              <p className="text-indigo-900 font-bold">{filteredScheduleTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link 
              href={`/student/schedule/${scheduleIdParam}`}
              className="flex items-center gap-2 px-3 py-2 text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              講義に戻る
            </Link>
            <Link 
              href="/student/submissions"
              className="flex items-center gap-2 px-3 py-2 bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-50 rounded-lg text-sm font-medium"
            >
              <XCircle className="w-4 h-4" />
              フィルタ解除
            </Link>
          </div>
        </div>
      )}

      <div className="flex gap-6">
        {/* 左サイドバー */}
        <div className="w-80 bg-white rounded-xl shadow-sm border flex-shrink-0">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-indigo-600" />
                {scheduleIdParam ? 'この講義の課題' : '課題一覧'}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                提出済み {filteredAssignments.filter(a => a.submission_status === 'submitted').length} / 全{filteredAssignments.length}件
              </p>
            </div>
            <button onClick={fetchAssignments} className="p-2 hover:bg-gray-100 rounded-lg" title="更新">
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
            {sortedAssignments.map((assignment) => {
              const deadlineInfo = assignment.submission_status !== 'submitted' ? formatDeadlineRelative(assignment.deadline) : null;
              const isSubmitted = assignment.submission_status === 'submitted';
              const isHighlighted = assignment.id === assignmentIdParam;
              
              return (
                <div
                  key={assignment.id}
                  onClick={() => { setSelectedId(assignment.id); setActiveTab('submit'); }}
                  className={`p-4 border-b cursor-pointer transition ${
                    selectedId === assignment.id 
                      ? isSubmitted ? 'bg-green-50 border-l-4 border-l-green-500' : 'bg-amber-50 border-l-4 border-l-amber-500'
                      : isHighlighted
                        ? 'bg-indigo-50 border-l-4 border-l-indigo-500'
                        : 'hover:bg-gray-50'
                  } ${!isSubmitted && selectedId !== assignment.id && !isHighlighted ? 'bg-amber-50/30' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {isSubmitted ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{assignment.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {!scheduleIdParam && <>{assignment.schedule_title} • </>}
                        {assignment.type === 'pre' ? '事前課題' : '講義後課題'}
                      </p>
                      {isSubmitted && assignment.latest_submission && (
                        <p className="text-xs text-green-600 mt-1">{formatDate(assignment.latest_submission.submitted_at).split(' ')[0]} 提出</p>
                      )}
                      {deadlineInfo && (
                        <p className={`text-xs mt-1 flex items-center gap-1 ${deadlineInfo.urgent ? 'text-red-600 font-medium' : 'text-amber-600'}`}>
                          <Clock className="w-3 h-3" />{deadlineInfo.text}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredAssignments.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <FolderOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>課題がありません</p>
              </div>
            )}
          </div>
        </div>

        {/* 右メイン */}
        <div className="flex-1">
          {selected ? (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-indigo-50 to-white border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <Link 
                        href={`/student/schedule/${selected.schedule_id}`}
                        className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded font-medium hover:bg-indigo-200 transition"
                      >
                        {selected.schedule_title}
                      </Link>
                      <span>•</span>
                      <span>{selected.type === 'pre' ? '事前課題' : '講義後課題'}</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{selected.title}</h2>
                    {selected.description && <p className="text-gray-600 mt-2">{selected.description}</p>}
                    {selected.submission_status !== 'submitted' && formatDeadlineRelative(selected.deadline) && (
                      <p className={`text-sm mt-2 flex items-center gap-1 ${formatDeadlineRelative(selected.deadline)?.urgent ? 'text-red-600 font-medium' : 'text-amber-600'}`}>
                        <Clock className="w-4 h-4" />期限: {formatDeadlineRelative(selected.deadline)?.text}
                      </p>
                    )}
                  </div>
                  {selected.submission_status === 'submitted' ? (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> 提出済み</span>
                  ) : (
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium flex items-center gap-1"><Clock className="w-4 h-4" /> 未提出</span>
                  )}
                </div>
              </div>

              <div className="flex border-b">
                <button onClick={() => setActiveTab('submit')} className={`flex-1 py-3 text-sm font-medium transition ${activeTab === 'submit' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                  <Upload className="w-4 h-4 inline mr-2" />提出する
                </button>
                <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 text-sm font-medium transition ${activeTab === 'history' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                  <History className="w-4 h-4 inline mr-2" />提出履歴 ({submissions.length})
                </button>
              </div>

              <div className="p-6">
                {activeTab === 'submit' ? (
                  <div className="space-y-4">
                    <UploadProgressBar progress={uploadProgress} fileName={uploadFileName} />

                    {uploadProgress === null && (
                      <div
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer ${dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50'}`}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('file-input')?.click()}
                      >
                        <Upload className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
                        <p className="text-gray-700 font-medium">{selected.submission_status === 'submitted' ? '別のファイルで再提出' : 'ファイルをドラッグ&ドロップ'}</p>
                        <p className="text-gray-400 text-xs mt-3">PDF, PPTX, XLSX, DOCX, PNG, JPG (最大50MB)</p>
                        <input id="file-input" type="file" className="hidden" accept=".pdf,.pptx,.ppt,.xlsx,.xls,.docx,.doc,.png,.jpg,.jpeg" onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); e.target.value = ''; }} />
                      </div>
                    )}

                    <div className="flex items-center gap-3"><div className="flex-1 h-px bg-gray-200"></div><span className="text-gray-400 text-sm">または</span><div className="flex-1 h-px bg-gray-200"></div></div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2"><Link2 className="w-4 h-4" />URLリンクで提出</label>
                      <div className="flex gap-2">
                        <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://docs.google.com/..." className="flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                        <button onClick={handleUrlSubmit} disabled={!urlInput.trim() || isSubmitting} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">提出</button>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">Google Docs, Slides, Sheets, Driveのリンクに対応</p>
                    </div>

                    {selected.submission_status === 'submitted' && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-700">💡 既に提出済みです。提出履歴タブで提出内容を確認できます。新しいファイルを提出すると再提出として記録されます。</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {loadingSubmissions ? (
                      <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
                    ) : submissions.length > 0 ? (
                      <div className="space-y-3">
                        {submissions.map((sub, idx) => (
                          <div key={sub.id} className={`p-4 rounded-xl border ${idx === 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex items-center gap-3">
                              <FileIcon type={sub.url_link ? sub.url_type : sub.file_type} className="w-8 h-8 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-gray-900 truncate">{sub.file_name || getUrlTypeLabel(sub.url_type)}</p>
                                  {idx === 0 && <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded font-medium">最新</span>}
                                </div>
                                <p className="text-sm text-gray-500">{formatDate(sub.submitted_at)}{sub.file_size && <> • {formatFileSize(sub.file_size)}</>}</p>
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                {sub.url_link ? (
                                  <a href={sub.url_link} target="_blank" rel="noopener noreferrer" className="p-2 text-indigo-600 hover:bg-white rounded-lg"><ExternalLink className="w-5 h-5" /></a>
                                ) : (
                                  <>
                                    <button onClick={() => setPreviewFile(sub)} className="p-2 text-gray-500 hover:bg-white rounded-lg"><Eye className="w-5 h-5" /></button>
                                    <button onClick={() => handleDownload(sub)} className="p-2 text-gray-500 hover:bg-white rounded-lg"><Download className="w-5 h-5" /></button>
                                  </>
                                )}
                                <button onClick={() => handleDeleteFile(sub.id, sub.file_name || sub.url_link || '')} className="p-2 text-red-500 hover:bg-red-100 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <History className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                        <p className="font-medium">提出履歴はありません</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
              <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">左のリストから課題を選択してください</p>
            </div>
          )}
        </div>
      </div>

      <PreviewModal isOpen={!!previewFile} onClose={() => setPreviewFile(null)} file={previewFile} onDelete={() => { if (previewFile) { handleDeleteFile(previewFile.id, previewFile.file_name || previewFile.url_link || ''); setPreviewFile(null); } }} onDownload={() => previewFile && handleDownload(previewFile)} />
      <DeleteConfirmModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, fileName: '', submissionId: '' })} onConfirm={confirmDelete} fileName={deleteModal.fileName} isDeleting={isDeleting} />
      <UrlPublicCheckModal isOpen={urlCheckModal.isOpen} onClose={() => setUrlCheckModal({ isOpen: false, url: '', urlType: '' })} onConfirm={confirmUrlSubmit} urlType={urlCheckModal.urlType} urlLink={urlCheckModal.url} isSubmitting={isSubmitting} />
    </>
  );
}

// ============================================
// メインコンポーネント（Suspenseでラップ）
// ============================================
export default function SubmissionsPage() {
  return (
    <StudentLayout pageTitle="課題提出">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      }>
        <SubmissionsContent />
      </Suspense>
    </StudentLayout>
  );
}
