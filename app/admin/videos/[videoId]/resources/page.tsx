'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft, 
  Save, 
  Plus,
  Trash2,
  FileSpreadsheet,
  Presentation,
  Link as LinkIcon,
  FileText,
  ExternalLink,
  AlertCircle,
  Loader2,
  CheckCircle,
  Eye,
  X
} from 'lucide-react';

interface VideoData {
  video_id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
}

interface Resource {
  id?: string;
  video_id: string;
  title: string;
  url: string;
  resource_type: string;
  display_order: number;
  isNew?: boolean;
  isDeleted?: boolean;
}

const resourceTypes = [
  { value: 'spreadsheet', label: 'Googleスプレッドシート', icon: FileSpreadsheet, color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  { value: 'slide', label: 'Googleスライド', icon: Presentation, color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  { value: 'external', label: '外部リンク', icon: LinkIcon, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  { value: 'other', label: 'その他', icon: FileText, color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' },
];

const MAX_RESOURCES = 5;

export default function AdminResourcesEditPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const videoId = params.videoId as string;

  const [video, setVideo] = useState<VideoData | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [originalResources, setOriginalResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchData();
  }, [videoId]);

  const fetchData = async () => {
    try {
      const videoRes = await fetch(`/api/admin/videos/${videoId}`);
      if (videoRes.ok) {
        const videoData = await videoRes.json();
        setVideo(videoData.video);
      }

      const resourcesRes = await fetch(`/api/admin/videos/${videoId}/resources`);
      if (resourcesRes.ok) {
        const resourcesData = await resourcesRes.json();
        const loadedResources = (resourcesData.resources || []).map((r: Resource) => ({
          ...r,
          isNew: false,
          isDeleted: false
        }));
        setResources(loadedResources);
        setOriginalResources(JSON.parse(JSON.stringify(loadedResources)));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('読み込みエラー');
    } finally {
      setLoading(false);
    }
  };

  const detectResourceType = (url: string): string => {
    if (!url) return 'other';
    if (url.includes('docs.google.com/spreadsheets')) return 'spreadsheet';
    if (url.includes('docs.google.com/presentation')) return 'slide';
    if (url.startsWith('http://') || url.startsWith('https://')) return 'external';
    return 'other';
  };

  const hasChanges = (): boolean => {
    const activeResources = resources.filter(r => !r.isDeleted);
    const originalActive = originalResources.filter(r => !r.isDeleted);
    
    if (activeResources.length !== originalActive.length) return true;
    
    for (let i = 0; i < activeResources.length; i++) {
      const current = activeResources[i];
      const original = originalActive.find(o => o.id === current.id);
      
      if (!original && current.isNew) return true;
      if (original && (
        current.title !== original.title ||
        current.url !== original.url ||
        current.resource_type !== original.resource_type
      )) return true;
    }
    
    return false;
  };

  const addResource = () => {
    const activeCount = resources.filter(r => !r.isDeleted).length;
    if (activeCount >= MAX_RESOURCES) {
      setError(`資料は最大${MAX_RESOURCES}件までです`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    const newResource: Resource = {
      video_id: videoId,
      title: '',
      url: '',
      resource_type: 'spreadsheet',
      display_order: resources.length,
      isNew: true,
      isDeleted: false
    };

    setResources([...resources, newResource]);
  };

  const updateResource = (index: number, field: keyof Resource, value: string) => {
    setResources(prev => prev.map((r, i) => {
      if (i !== index) return r;
      
      const updated = { ...r, [field]: value };
      
      if (field === 'url') {
        updated.resource_type = detectResourceType(value);
      }
      
      return updated;
    }));
  };

  const deleteResource = (index: number) => {
    const resource = resources[index];
    
    if (resource.id && !resource.isNew) {
      setResources(prev => prev.map((r, i) => 
        i === index ? { ...r, isDeleted: true } : r
      ));
    } else {
      setResources(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    const activeResources = resources.filter(r => !r.isDeleted);
    for (const r of activeResources) {
      if (!r.title.trim()) {
        setError('タイトルを入力してください');
        setTimeout(() => setError(null), 3000);
        return;
      }
      if (!r.url.trim()) {
        setError('URLを入力してください');
        setTimeout(() => setError(null), 3000);
        return;
      }
      if (!r.url.startsWith('http')) {
        setError('URLはhttp://またはhttps://で始めてください');
        setTimeout(() => setError(null), 3000);
        return;
      }
    }

    setSaving(true);
    setError(null);

    try {
      const dataToSend = resources.map((r, index) => ({
        id: r.id || undefined,
        video_id: r.video_id,
        title: r.title,
        url: r.url,
        resource_type: r.resource_type,
        display_order: index,
        isNew: r.isNew || false,
        isDeleted: r.isDeleted || false
      }));

      const res = await fetch(`/api/admin/videos/${videoId}/resources`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resources: dataToSend })
      });

      if (res.ok) {
        const data = await res.json();
        const updatedResources = (data.resources || []).map((r: Resource) => ({
          ...r,
          isNew: false,
          isDeleted: false
        }));
        setResources(updatedResources);
        setOriginalResources(JSON.parse(JSON.stringify(updatedResources)));
        setSuccess('保存しました');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await res.json();
        setError(data.error || '保存に失敗しました');
      }
    } catch (error) {
      console.error('Error saving:', error);
      setError('保存中にエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  const getResourceTypeInfo = (type: string) => {
    return resourceTypes.find(t => t.value === type) || resourceTypes[3];
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">ログインが必要です</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const activeResources = resources.filter(r => !r.isDeleted);
  const remainingSlots = MAX_RESOURCES - activeResources.length;
  const isChanged = hasChanges();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              戻る
            </button>
            <span className="text-gray-300">|</span>
            <h1 className="font-semibold text-gray-900 truncate max-w-md">
              📎 {video?.title}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {success && (
              <span className="text-green-600 text-sm flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                {success}
              </span>
            )}
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Eye className="w-4 h-4" />
              プレビュー
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !isChanged}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                isChanged
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* 通知 */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}
        
        {isChanged && (
          <div className="mb-4 px-4 py-3 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            変更があります。保存ボタンを押して反映してください。
          </div>
        )}

        {/* 資料一覧 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">関連資料</h3>
              <p className="text-sm text-gray-500">{activeResources.length}/{MAX_RESOURCES}件</p>
            </div>
            {remainingSlots > 0 && (
              <button
                onClick={addResource}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                資料を追加
              </button>
            )}
          </div>

          {activeResources.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileSpreadsheet className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-4">関連資料がまだありません</p>
              <button
                onClick={addResource}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                最初の資料を追加
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {resources.map((resource, index) => {
                if (resource.isDeleted) return null;
                const typeInfo = getResourceTypeInfo(resource.resource_type);
                const TypeIcon = typeInfo.icon;
                const displayIndex = activeResources.indexOf(resource) + 1;
                
                return (
                  <div 
                    key={resource.id || `new-${index}`} 
                    className={`bg-white rounded-xl shadow-sm border ${typeInfo.borderColor} overflow-hidden`}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 ${typeInfo.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <span className={`font-bold text-sm ${typeInfo.color}`}>{displayIndex}</span>
                        </div>
                        
                        <div className="flex-1 space-y-3">
                          <input
                            type="text"
                            value={resource.title}
                            onChange={(e) => updateResource(index, 'title', e.target.value)}
                            placeholder="タイトル（例: PMFワークシート）"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          
                          <div>
                            <input
                              type="url"
                              value={resource.url}
                              onChange={(e) => updateResource(index, 'url', e.target.value)}
                              placeholder="https://docs.google.com/spreadsheets/..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {resource.url && (
                              <div className="flex items-center justify-between mt-1">
                                <span className={`text-xs ${typeInfo.color} flex items-center gap-1`}>
                                  <TypeIcon className="w-3 h-3" />
                                  {typeInfo.label}
                                </span>
                                <a
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  確認
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => deleteResource(index)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeResources.length > 0 && remainingSlots > 0 && (
            <button
              onClick={addResource}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              資料を追加（あと{remainingSlots}件）
            </button>
          )}

          {/* ヒント */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 text-sm mb-2">💡 ヒント</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• URLを入力すると自動で種類を判定します</li>
              <li>• Googleスプシ/スライドは「リンクを知っている全員」に共有設定してください</li>
              <li>• 編集後は「保存」ボタンで反映されます</li>
            </ul>
          </div>
        </div>
      </main>

      {/* プレビューモーダル */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">プレビュー（ユーザー視点）</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              {activeResources.length === 0 ? (
                <p className="text-gray-500 text-center py-8">資料がありません</p>
              ) : (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">📊 この動画で使われている資料</h4>
                  {activeResources.map((resource) => {
                    const typeInfo = getResourceTypeInfo(resource.resource_type);
                    const TypeIcon = typeInfo.icon;
                    
                    return (
                      <a
                        key={resource.id || resource.url}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-3 p-4 ${typeInfo.bgColor} border ${typeInfo.borderColor} rounded-xl hover:shadow-md transition-all group`}
                      >
                        <div className={`w-10 h-10 bg-white rounded-lg flex items-center justify-center`}>
                          <TypeIcon className={`w-5 h-5 ${typeInfo.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">{resource.title || '（タイトル未設定）'}</p>
                          <p className="text-sm text-gray-500 truncate">{resource.url || '（URL未設定）'}</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                閉じる
              </button>
              {isChanged && (
                <button
                  onClick={() => {
                    setShowPreview(false);
                    handleSave();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  保存する
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
