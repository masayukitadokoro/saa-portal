'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  Plus, 
  ExternalLink, 
  Trash2, 
  Check,
  X,
  Calendar,
  ChevronDown,
  Pencil,
  FileText,
  AlertCircle
} from 'lucide-react';

// イベントタイプの定義
const EVENT_TYPES = {
  regular: { label: '定例講義', color: 'bg-red-500', textColor: 'text-red-600', bgLight: 'bg-red-100' },
  expert: { label: '専門家講義', color: 'bg-green-500', textColor: 'text-green-600', bgLight: 'bg-green-100' },
  office_hour: { label: 'オフィスアワー', color: 'bg-blue-500', textColor: 'text-blue-600', bgLight: 'bg-blue-100' },
  special: { label: '特別講義', color: 'bg-orange-500', textColor: 'text-orange-600', bgLight: 'bg-orange-100' },
  other: { label: 'その他', color: 'bg-gray-500', textColor: 'text-gray-600', bgLight: 'bg-gray-100' },
} as const;

type EventType = keyof typeof EVENT_TYPES;
type LocationType = 'online' | 'offline' | 'hybrid';

interface ScheduleTask {
  id?: string;
  title: string;
  is_required: boolean;
  order_index: number;
}

interface Event {
  id: string;
  batch_id: number;
  title: string;
  description: string | null;
  event_type: EventType;
  instructor_name: string | null;
  start_at: string;
  end_at: string | null;
  location_type: LocationType;
  zoom_url: string | null;
  offline_location: string | null;
  materials_url: string | null;
  recording_url: string | null;
  is_published: boolean;
  saa_schedule_tasks: ScheduleTask[];
}

const DEFAULT_ZOOM_URLS: Record<EventType, string> = {
  regular: 'https://us02web.zoom.us/j/87857521843?pwd=FQTUcLkKsNxhNxNFTwg1L1WkXOczdv.1',
  office_hour: 'https://us02web.zoom.us/j/87857521843?pwd=FQTUcLkKsNxhNxNFTwg1L1WkXOczdv.1',
  expert: 'https://us02web.zoom.us/j/89982191591?pwd=nYEQ0lA9oBEFVTCMfvQtVN3tYsSAn5.1',
  special: 'https://us02web.zoom.us/j/89982191591?pwd=nYEQ0lA9oBEFVTCMfvQtVN3tYsSAn5.1',
  other: 'https://us02web.zoom.us/j/89982191591?pwd=nYEQ0lA9oBEFVTCMfvQtVN3tYsSAn5.1',
};

// 日付フォーマット
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const formatTimeRange = (startAt: string, endAt: string | null) => {
  const start = formatTime(startAt);
  if (!endAt) return start;
  const end = formatTime(endAt);
  return `${start}-${end}`;
};

const formatDateForInput = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toISOString().slice(0, 10);
};

export default function EventsPage() {
  const router = useRouter();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState(9);
  const [activeTab, setActiveTab] = useState<EventType | 'all'>('all');
  const [editingCell, setEditingCell] = useState<{id: string, field: string} | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [newEventRow, setNewEventRow] = useState<Partial<Event> | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // イベント一覧を取得
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/schedules?batch_id=${selectedBatch}`);
      if (!res.ok) throw new Error('イベントの取得に失敗しました');
      const data = await res.json();
      setEvents(data.schedules || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [selectedBatch]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // タブ別のフィルタリング
  const filteredEvents = events.filter(event => 
    activeTab === 'all' || event.event_type === activeTab
  ).sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

  // タブごとのカウント
  const getEventCount = (type: EventType | 'all') => {
    if (type === 'all') return events.length;
    return events.filter(e => e.event_type === type).length;
  };

  // インライン編集開始
  const startEditing = (id: string, field: string, currentValue: string) => {
    setEditingCell({ id, field });
    setEditValue(currentValue || '');
  };

  // 編集キャンセル
  const cancelEditing = () => {
    setEditingCell(null);
    setEditValue('');
  };

  // 編集保存
  const saveEdit = async (id: string, field: string, value: string) => {
    try {
      setSavingId(id);
      const res = await fetch(`/api/admin/schedules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });

      if (!res.ok) throw new Error('保存に失敗しました');
      
      setEvents(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
      setEditingCell(null);
      setEditValue('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setSavingId(null);
    }
  };

  // 公開状態の切り替え
  const togglePublished = async (id: string, currentState: boolean) => {
    try {
      setSavingId(id);
      const res = await fetch(`/api/admin/schedules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !currentState })
      });

      if (!res.ok) throw new Error('更新に失敗しました');
      
      setEvents(prev => prev.map(e => e.id === id ? { ...e, is_published: !currentState } : e));
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新に失敗しました');
    } finally {
      setSavingId(null);
    }
  };

  // 新規イベント行の追加
  const addNewEventRow = () => {
    const eventType = activeTab === 'all' ? 'regular' : activeTab;
    const now = new Date();
    now.setHours(19, 0, 0, 0);
    const end = new Date(now);
    end.setHours(21, 0, 0, 0);
    
    setNewEventRow({
      batch_id: selectedBatch,
      title: '',
      event_type: eventType,
      instructor_name: '田所 雅之',
      start_at: now.toISOString(),
      end_at: end.toISOString(),
      location_type: 'online',
      zoom_url: DEFAULT_ZOOM_URLS[eventType],
      is_published: false,
      saa_schedule_tasks: []
    });
  };

  // 新規イベントの保存
  const saveNewEvent = async () => {
    if (!newEventRow || !newEventRow.title) {
      setError('イベント名を入力してください');
      return;
    }

    try {
      setSavingId('new');
      const res = await fetch('/api/admin/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEventRow)
      });

      if (!res.ok) throw new Error('作成に失敗しました');
      
      await fetchEvents();
      setNewEventRow(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '作成に失敗しました');
    } finally {
      setSavingId(null);
    }
  };

  // イベント削除
  const deleteEvent = async (id: string) => {
    try {
      setSavingId(id);
      const res = await fetch(`/api/admin/schedules/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('削除に失敗しました');
      
      setEvents(prev => prev.filter(e => e.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">イベント管理</h1>
            <p className="text-sm text-gray-500 mt-1">定例講義、専門家講義、オフィスアワーを管理します</p>
          </div>
          <div className="flex items-center gap-4">
            {/* バッチ選択 */}
            <div className="relative">
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(Number(e.target.value))}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={9}>第9期</option>
                <option value={8}>第8期</option>
                <option value={7}>第7期</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            
            {/* 新規作成ボタン */}
            <button
              onClick={addNewEventRow}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              新規イベント
            </button>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* タブ */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-1">
            {(['all', 'regular', 'expert', 'office_hour'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === type
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{type === 'all' ? 'すべて' : EVENT_TYPES[type].label}</span>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === type ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {getEventCount(type)}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* テーブル */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  日付
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  イベント名
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  時間
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  講師
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  Zoom
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  公開
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEvents.map((event) => {
                const isPast = new Date(event.start_at) < new Date();
                const typeInfo = EVENT_TYPES[event.event_type];
                
                return (
                  <tr 
                    key={event.id} 
                    className={`hover:bg-gray-50 group ${savingId === event.id ? 'opacity-50' : ''} ${isPast ? 'bg-gray-50 opacity-60' : ''}`}
                  >
                    {/* 日付 */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${typeInfo.color}`}></span>
                        <span className="text-sm text-gray-900">{formatDate(event.start_at)}</span>
                      </div>
                    </td>

                    {/* イベント名 */}
                    <td className="px-4 py-3">
                      {editingCell?.id === event.id && editingCell?.field === 'title' ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 px-2 py-1 border border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(event.id, 'title', editValue);
                              if (e.key === 'Escape') cancelEditing();
                            }}
                          />
                          <button onClick={() => saveEdit(event.id, 'title', editValue)} className="text-green-600 hover:text-green-700">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={cancelEditing} className="text-gray-400 hover:text-gray-500">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <span 
                            className="text-sm text-gray-900 cursor-pointer hover:text-indigo-600"
                            onClick={() => startEditing(event.id, 'title', event.title)}
                          >
                            {event.title || <span className="text-gray-400 italic">クリックして入力</span>}
                          </span>
                          {event.saa_schedule_tasks?.length > 0 && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              📝 事前課題 {event.saa_schedule_tasks.length}件
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* 時間 */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {formatTimeRange(event.start_at, event.end_at)}
                      </span>
                    </td>

                    {/* 講師 */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {editingCell?.id === event.id && editingCell?.field === 'instructor_name' ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-24 px-2 py-1 border border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(event.id, 'instructor_name', editValue);
                              if (e.key === 'Escape') cancelEditing();
                            }}
                          />
                          <button onClick={() => saveEdit(event.id, 'instructor_name', editValue)} className="text-green-600">
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span 
                          className="text-sm text-gray-600 cursor-pointer hover:text-indigo-600"
                          onClick={() => startEditing(event.id, 'instructor_name', event.instructor_name || '')}
                        >
                          {event.instructor_name || <span className="text-gray-400">-</span>}
                        </span>
                      )}
                    </td>

                    {/* Zoom */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {event.zoom_url ? (
                        <a 
                          href={event.zoom_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>

                    {/* 公開状態 */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => togglePublished(event.id, event.is_published)}
                        disabled={savingId === event.id}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          event.is_published 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {event.is_published && <Check className="w-3 h-3" />}
                      </button>
                    </td>

                    {/* 操作 */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => router.push(`/admin/schedules`)}
                          className="text-gray-400 hover:text-indigo-600"
                          title="詳細編集"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {deleteConfirm === event.id ? (
                          <>
                            <button 
                              onClick={() => deleteEvent(event.id)}
                              className="text-red-600 hover:text-red-700"
                              title="削除確定"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setDeleteConfirm(null)}
                              className="text-gray-400 hover:text-gray-500"
                              title="キャンセル"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button 
                            onClick={() => setDeleteConfirm(event.id)}
                            className="text-gray-400 hover:text-red-600"
                            title="削除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* 新規追加行 */}
              {newEventRow && (
                <tr className="bg-indigo-50">
                  <td className="px-4 py-3">
                    <input
                      type="date"
                      value={newEventRow.start_at ? formatDateForInput(newEventRow.start_at) : ''}
                      onChange={(e) => {
                        const date = e.target.value;
                        setNewEventRow(prev => prev ? {
                          ...prev,
                          start_at: `${date}T19:00:00+09:00`,
                          end_at: `${date}T21:00:00+09:00`
                        } : null);
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      placeholder="イベント名を入力..."
                      value={newEventRow.title || ''}
                      onChange={(e) => setNewEventRow(prev => prev ? { ...prev, title: e.target.value } : null)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      autoFocus
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-500">19:00-21:00</span>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      placeholder="講師名"
                      value={newEventRow.instructor_name || ''}
                      onChange={(e) => setNewEventRow(prev => prev ? { ...prev, instructor_name: e.target.value } : null)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-400">-</span>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={newEventRow.is_published || false}
                      onChange={(e) => setNewEventRow(prev => prev ? { ...prev, is_published: e.target.checked } : null)}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={saveNewEvent}
                        disabled={savingId === 'new'}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setNewEventRow(null)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* 追加ボタン行 */}
              {!newEventRow && (
                <tr>
                  <td colSpan={7} className="px-4 py-3">
                    <button
                      onClick={addNewEventRow}
                      className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>クリックして追加...</span>
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 空状態 */}
        {filteredEvents.length === 0 && !newEventRow && !loading && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {activeTab === 'all' 
                ? 'まだイベントがありません' 
                : `${EVENT_TYPES[activeTab as EventType].label}がありません`}
            </p>
            <button
              onClick={addNewEventRow}
              className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <Plus className="w-4 h-4" />
              最初のイベントを作成
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
