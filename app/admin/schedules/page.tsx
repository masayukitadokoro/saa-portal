'use client';

import { useEffect, useState } from 'react';
import { 
  Calendar, 
  Plus, 
  Pencil, 
  Trash2, 
  Video,
  MapPin,
  Users,
  FileText,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

type EventType = 'regular' | 'expert' | 'office_hour' | 'special' | 'other';
type LocationType = 'online' | 'offline' | 'hybrid';

interface ScheduleTask {
  id?: string;
  title: string;
  description?: string;
  is_required: boolean;
}

interface Schedule {
  id: string;
  batch_id: number | null;
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

const EVENT_TYPE_LABELS: Record<EventType, { label: string; color: string; bgColor: string }> = {
  regular: { label: '定例講義', color: 'text-red-600', bgColor: 'bg-red-100' },
  expert: { label: '専門家講義', color: 'text-green-600', bgColor: 'bg-green-100' },
  office_hour: { label: 'オフィスアワー', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  special: { label: '特別講義', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  other: { label: 'その他', color: 'text-gray-600', bgColor: 'bg-gray-100' },
};

const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  online: 'オンライン',
  offline: 'オフライン',
  hybrid: 'ハイブリッド',
};

const DEFAULT_ZOOM_URLS: Record<EventType, string> = {
  regular: 'https://us02web.zoom.us/j/87857521843?pwd=FQTUcLkKsNxhNxNFTwg1L1WkXOczdv.1',
  office_hour: 'https://us02web.zoom.us/j/87857521843?pwd=FQTUcLkKsNxhNxNFTwg1L1WkXOczdv.1',
  expert: 'https://us02web.zoom.us/j/89982191591?pwd=nYEQ0lA9oBEFVTCMfvQtVN3tYsSAn5.1',
  special: 'https://us02web.zoom.us/j/89982191591?pwd=nYEQ0lA9oBEFVTCMfvQtVN3tYsSAn5.1',
  other: 'https://us02web.zoom.us/j/89982191591?pwd=nYEQ0lA9oBEFVTCMfvQtVN3tYsSAn5.1',
};

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // フォーム状態
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'regular' as EventType,
    instructor_name: '田所 雅之',
    start_at: '',
    end_at: '',
    location_type: 'online' as LocationType,
    zoom_url: '',
    offline_location: '',
    materials_url: '',
    recording_url: '',
    batch_id: 9,
    is_published: true,
    tasks: [] as ScheduleTask[],
  });

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/schedules');
      if (!response.ok) throw new Error('Failed to fetch schedules');
      const data = await response.json();
      setSchedules(data.schedules || []);
    } catch (err) {
      setError('スケジュールの取得に失敗しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (schedule?: Schedule) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setFormData({
        title: schedule.title,
        description: schedule.description || '',
        event_type: schedule.event_type,
        instructor_name: schedule.instructor_name || '',
        start_at: schedule.start_at.slice(0, 16),
        end_at: schedule.end_at?.slice(0, 16) || '',
        location_type: schedule.location_type,
        zoom_url: schedule.zoom_url || '',
        offline_location: schedule.offline_location || '',
        materials_url: schedule.materials_url || '',
        recording_url: schedule.recording_url || '',
        batch_id: schedule.batch_id || 9,
        is_published: schedule.is_published,
        tasks: schedule.saa_schedule_tasks || [],
      });
    } else {
      setEditingSchedule(null);
      const now = new Date();
      now.setHours(19, 0, 0, 0);
      const end = new Date(now);
      end.setHours(21, 0, 0, 0);
      
      setFormData({
        title: '',
        description: '',
        event_type: 'regular',
        instructor_name: '田所 雅之',
        start_at: now.toISOString().slice(0, 16),
        end_at: end.toISOString().slice(0, 16),
        location_type: 'online',
        zoom_url: DEFAULT_ZOOM_URLS.regular,
        offline_location: '',
        materials_url: '',
        recording_url: '',
        batch_id: 9,
        is_published: true,
        tasks: [],
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSchedule(null);
  };

  const handleEventTypeChange = (type: EventType) => {
    setFormData(prev => ({
      ...prev,
      event_type: type,
      zoom_url: DEFAULT_ZOOM_URLS[type],
    }));
  };

  const addTask = () => {
    setFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, { title: '', is_required: false }],
    }));
  };

  const updateTask = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => 
        i === index ? { ...task, [field]: value } : task
      ),
    }));
  };

  const removeTask = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingSchedule 
        ? `/api/admin/schedules/${editingSchedule.id}`
        : '/api/admin/schedules';
      
      const method = editingSchedule ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          start_at: new Date(formData.start_at).toISOString(),
          end_at: formData.end_at ? new Date(formData.end_at).toISOString() : null,
        }),
      });

      if (!response.ok) throw new Error('Failed to save schedule');

      await fetchSchedules();
      closeModal();
    } catch (err) {
      console.error(err);
      alert('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/schedules/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete schedule');

      await fetchSchedules();
      setDeleteConfirm(null);
    } catch (err) {
      console.error(err);
      alert('削除に失敗しました');
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">スケジュール管理</h1>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus className="w-5 h-5" />
            新規作成
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* スケジュール一覧 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">日時</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">タイトル</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">種別</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">講師</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">場所</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状態</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    スケジュールがありません
                  </td>
                </tr>
              ) : (
                schedules.map((schedule) => {
                  const typeInfo = EVENT_TYPE_LABELS[schedule.event_type];
                  const isPast = new Date(schedule.start_at) < new Date();
                  
                  return (
                    <tr key={schedule.id} className={isPast ? 'bg-gray-50 opacity-60' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateTime(schedule.start_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{schedule.title}</div>
                        {schedule.saa_schedule_tasks?.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            📝 事前課題 {schedule.saa_schedule_tasks.length}件
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeInfo.bgColor} ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {schedule.instructor_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {schedule.location_type === 'online' && <Video className="w-4 h-4 inline mr-1" />}
                        {schedule.location_type === 'offline' && <MapPin className="w-4 h-4 inline mr-1" />}
                        {LOCATION_TYPE_LABELS[schedule.location_type]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {schedule.is_published ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-600">
                            公開中
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                            非公開
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openModal(schedule)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {deleteConfirm === schedule.id ? (
                          <span className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(schedule.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(schedule.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingSchedule ? 'スケジュール編集' : '新規スケジュール'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* タイトル */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  タイトル <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="例：第5回講義：PMF達成の方法論"
                />
              </div>

              {/* イベント種別 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  イベント種別 <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map((type) => {
                    const info = EVENT_TYPE_LABELS[type];
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleEventTypeChange(type)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                          formData.event_type === type
                            ? `${info.bgColor} ${info.color} ring-2 ring-offset-1`
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {info.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 日時 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    開始日時 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.start_at}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_at: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    終了日時
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_at}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_at: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* 講師 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  講師名
                </label>
                <input
                  type="text"
                  value={formData.instructor_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, instructor_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="例：田所 雅之"
                />
              </div>

              {/* 開催形式 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  開催形式
                </label>
                <div className="flex gap-4">
                  {(['online', 'offline', 'hybrid'] as LocationType[]).map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="location_type"
                        checked={formData.location_type === type}
                        onChange={() => setFormData(prev => ({ ...prev, location_type: type }))}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{LOCATION_TYPE_LABELS[type]}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Zoom URL */}
              {(formData.location_type === 'online' || formData.location_type === 'hybrid') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zoom URL
                  </label>
                  <input
                    type="url"
                    value={formData.zoom_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, zoom_url: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="https://zoom.us/j/..."
                  />
                </div>
              )}

              {/* オフライン会場 */}
              {(formData.location_type === 'offline' || formData.location_type === 'hybrid') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    会場
                  </label>
                  <input
                    type="text"
                    value={formData.offline_location}
                    onChange={(e) => setFormData(prev => ({ ...prev, offline_location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="例：東京都渋谷区..."
                  />
                </div>
              )}

              {/* 説明 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  説明
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="講義の概要など..."
                />
              </div>

              {/* 資料URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  資料URL
                </label>
                <input
                  type="url"
                  value={formData.materials_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, materials_url: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://..."
                />
              </div>

              {/* 録画URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  録画URL（講義後に追加）
                </label>
                <input
                  type="url"
                  value={formData.recording_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, recording_url: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://..."
                />
              </div>

              {/* 事前課題 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    事前課題
                  </label>
                  <button
                    type="button"
                    onClick={addTask}
                    className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> 追加
                  </button>
                </div>
                {formData.tasks.length === 0 ? (
                  <p className="text-sm text-gray-500">事前課題はありません</p>
                ) : (
                  <div className="space-y-3">
                    {formData.tasks.map((task, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={task.title}
                            onChange={(e) => updateTask(index, 'title', e.target.value)}
                            placeholder="課題タイトル"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                          <label className="flex items-center gap-2 mt-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={task.is_required}
                              onChange={(e) => updateTask(index, 'is_required', e.target.checked)}
                              className="text-indigo-600 focus:ring-indigo-500 rounded"
                            />
                            <span className="text-xs text-gray-600">必須</span>
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeTask(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 公開設定 */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={formData.is_published}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                  className="text-indigo-600 focus:ring-indigo-500 rounded"
                />
                <label htmlFor="is_published" className="text-sm text-gray-700 cursor-pointer">
                  受講生に公開する
                </label>
              </div>

              {/* ボタン */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
