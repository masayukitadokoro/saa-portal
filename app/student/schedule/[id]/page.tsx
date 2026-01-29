'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Video, FileText, BookOpen, MessageSquare, 
  FolderOpen, PlayCircle, Check, Play, Book, AlertTriangle,
  Clock, User, Target, List
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ScheduleDetail, ScheduleProgress } from '@/types/schedule';

export default function ScheduleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchScheduleDetail(params.id as string);
    }
  }, [params.id]);

  const fetchScheduleDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/student/schedule/${id}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setSchedule(data.schedule);
    } catch (err) {
      setError('講義情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (type: string, value: boolean) => {
    if (!schedule) return;
    try {
      const res = await fetch(`/api/student/schedule/${schedule.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, value }),
      });
      if (res.ok) {
        const data = await res.json();
        setSchedule(prev => prev ? { ...prev, progress: data.progress } : null);
      }
    } catch (err) {
      console.error('Progress update failed:', err);
    }
  };

  const toggleVideoWatched = async (videoId: number, currentState: boolean) => {
    if (!schedule) return;
    try {
      const res = await fetch('/api/history', {
        method: currentState ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
      });
      if (res.ok) {
        setSchedule(prev => {
          if (!prev) return null;
          const updatedVideos = prev.relatedVideos.map(v => 
            v.id === videoId ? { ...v, isWatched: !currentState } : v
          );
          const videosWatched = updatedVideos.filter(v => v.isWatched).length;
          return {
            ...prev,
            relatedVideos: updatedVideos,
            progress: { ...prev.progress, videosWatched, videosTotal: updatedVideos.length }
          };
        });
      }
    } catch (err) {
      console.error('Video watch toggle failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !schedule) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || '講義が見つかりません'}</p>
          <button
            onClick={() => router.push('/student/schedule')}
            className="text-indigo-600 hover:text-indigo-700"
          >
            スケジュール一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button 
            onClick={() => router.push('/student/schedule')}
            className="flex items-center text-gray-500 hover:text-gray-700 text-sm transition"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            スケジュール一覧に戻る
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* メインカード */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* ヘッダー（インディゴグラデーション） */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-8 text-white">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                {schedule.lectureNumber && (
                  <span className="inline-block px-3 py-1 bg-white/20 rounded-lg text-sm font-medium mb-3">
                    第{schedule.lectureNumber}回 定例講義
                  </span>
                )}
                <h1 className="text-3xl md:text-4xl font-bold">{schedule.title}</h1>
                {schedule.description && (
                  <p className="text-indigo-200 mt-2 text-lg">{schedule.description}</p>
                )}
              </div>
              <div className="text-left md:text-right flex-shrink-0">
                <p className="text-2xl md:text-3xl font-bold">{schedule.date}</p>
                <p className="text-lg text-indigo-200">
                  {schedule.startTime}{schedule.endTime && ` - ${schedule.endTime}`}
                </p>
                {schedule.instructorName && (
                  <p className="text-indigo-200 mt-1 flex items-center md:justify-end gap-1">
                    <User className="w-4 h-4" />
                    講師：{schedule.instructorName}
                  </p>
                )}
              </div>
            </div>
            {schedule.zoomUrl && !schedule.isCompleted && (
              <a 
                href={schedule.zoomUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-700 rounded-xl hover:bg-indigo-50 transition font-bold text-lg"
              >
                <Video className="w-5 h-5" />
                講義にZoom参加する
              </a>
            )}
          </div>

          <div className="p-6 md:p-8 space-y-8">
            {/* 講義前課題（警告） */}
            {schedule.preAssignment && !schedule.isCompleted && (
              <div className="bg-amber-50 rounded-xl border-2 border-amber-200 p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-amber-600 text-sm font-bold mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      講義開始前に提出が必要です
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      {schedule.preAssignment.title}
                    </p>
                    {schedule.preAssignment.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {schedule.preAssignment.description}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/student/submissions?schedule=${schedule.id}&assignment=${schedule.id}_pre`}
                    className="inline-flex items-center justify-center px-5 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-bold gap-2 transition flex-shrink-0"
                  >
                    <FolderOpen className="w-5 h-5" />
                    課題を提出する
                  </Link>
                </div>
              </div>
            )}

            {/* 講義概要 */}
            {(schedule.purpose || schedule.content) && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  この講義について
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {schedule.purpose && (
                    <div className="p-5 bg-indigo-50 rounded-xl">
                      <p className="text-indigo-600 font-bold mb-2 flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        目的
                      </p>
                      <p className="text-gray-800">{schedule.purpose}</p>
                    </div>
                  )}
                  {schedule.content && (
                    <div className="p-5 bg-gray-50 rounded-xl">
                      <p className="text-gray-600 font-bold mb-2 flex items-center gap-1">
                        <List className="w-4 h-4" />
                        内容
                      </p>
                      <p className="text-gray-800">{schedule.content}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 事前コンテンツ */}
            {(schedule.bookReference || schedule.relatedVideos.length > 0) && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Book className="w-5 h-5 text-indigo-600" />
                  事前に見ておくコンテンツ
                </h2>
                
                {/* 書籍 */}
                {schedule.bookReference && (
                  <div
                    onClick={() => updateProgress('book_read', !schedule.progress.bookRead)}
                    className={`p-5 rounded-xl border-2 cursor-pointer transition mb-4 ${
                      schedule.progress.bookRead 
                        ? 'bg-indigo-50 border-indigo-300' 
                        : 'bg-gray-50 border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          schedule.progress.bookRead 
                            ? 'bg-indigo-500 text-white' 
                            : 'bg-gray-300 text-white'
                        }`}>
                          {schedule.progress.bookRead 
                            ? <Check className="w-6 h-6" /> 
                            : <Book className="w-6 h-6" />
                          }
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-0.5">
                            📖 起業参謀の戦略書
                          </p>
                          <p className={`text-lg font-bold ${
                            schedule.progress.bookRead 
                              ? 'text-indigo-700' 
                              : 'text-gray-900'
                          }`}>
                            {schedule.bookReference.chapter}：{schedule.bookReference.title}
                          </p>
                          {schedule.bookReference.pages && (
                            <p className="text-sm text-gray-500">
                              {schedule.bookReference.pages}
                            </p>
                          )}
                        </div>
                      </div>
                      {schedule.bookReference.pdfUrl && (
                        <a
                          href={schedule.bookReference.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold transition"
                        >
                          PDFで読む
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* 動画 */}
                {schedule.relatedVideos.length > 0 && (
                  <div className="space-y-3">
                    {schedule.relatedVideos.map((video) => (
                      <div
                        key={video.id}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 transition ${
                          video.isWatched 
                            ? 'bg-indigo-50 border-indigo-300' 
                            : 'bg-white border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        <button
                          onClick={() => toggleVideoWatched(video.id, video.isWatched)}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition ${
                            video.isWatched ? 'bg-indigo-500' : 'bg-gray-200 hover:bg-gray-300'
                          }`}
                        >
                          {video.isWatched 
                            ? <Check className="w-5 h-5 text-white" /> 
                            : <Play className="w-4 h-4 text-gray-500" />
                          }
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold truncate ${
                            video.isWatched ? 'text-indigo-700' : 'text-gray-900'
                          }`}>
                            {video.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {video.category}{video.duration && ` • ${video.duration}`}
                          </p>
                        </div>
                        <a
                          href={`/videos/${video.youtubeId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition flex-shrink-0"
                        >
                          視聴する
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 講義後アクション */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* アンケート */}
              {schedule.surveyUrl && (
                <div className="bg-gray-50 rounded-xl p-5">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-600" />
                    講義後アンケート
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    講義の感想・フィードバックをお願いします
                  </p>
                  <a
                    href={schedule.surveyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition"
                  >
                    アンケートに回答する
                  </a>
                </div>
              )}

              {/* 次回課題 */}
              {schedule.postAssignment && (
                <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-5">
                  <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-indigo-600" />
                    次回講義までに提出する課題
                  </h3>
                  <p className="font-bold text-gray-900">
                    {schedule.postAssignment.title}
                  </p>
                  {schedule.postAssignment.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {schedule.postAssignment.description}
                    </p>
                  )}
                  {schedule.postAssignment.deadline && (
                    <p className="text-sm text-indigo-700 mt-2 font-medium flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      期限：{schedule.postAssignment.deadline}
                    </p>
                  )}
                  <Link
                    href={`/student/submissions?schedule=${schedule.id}&assignment=${schedule.id}_post`}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold transition"
                  >
                    <FolderOpen className="w-4 h-4" />
                    課題を提出する
                  </Link>
                </div>
              )}
            </div>

            {/* その他 */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* 事前質問 */}
              {schedule.questionFormUrl && (
                <div className="bg-gray-50 rounded-xl p-5">
                  <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-gray-600" />
                    事前質問
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    講義で聞きたいことがあれば送信
                  </p>
                  <a
                    href={schedule.questionFormUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition"
                  >
                    <MessageSquare className="w-4 h-4" />
                    質問を送る
                  </a>
                </div>
              )}

              {/* 講義後コンテンツ */}
              <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-gray-600" />
                  講義後コンテンツ
                </h3>
                <div className="space-y-2">
                  {schedule.archiveVideoUrl ? (
                    <a
                      href={schedule.archiveVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg bg-indigo-100 text-indigo-700 text-sm hover:bg-indigo-200 transition"
                    >
                      <PlayCircle className="w-4 h-4" />
                      アーカイブ動画を視聴する
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-100 text-gray-400 text-sm">
                      <PlayCircle className="w-4 h-4" />
                      アーカイブ動画
                      <span className="ml-auto text-xs bg-gray-200 px-2 py-0.5 rounded">準備中</span>
                    </div>
                  )}
                  {schedule.materialsUrl ? (
                    <a
                      href={schedule.materialsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg bg-indigo-100 text-indigo-700 text-sm hover:bg-indigo-200 transition"
                    >
                      <FileText className="w-4 h-4" />
                      講義資料をダウンロード
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-100 text-gray-400 text-sm">
                      <FileText className="w-4 h-4" />
                      講義資料
                      <span className="ml-auto text-xs bg-gray-200 px-2 py-0.5 rounded">準備中</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
