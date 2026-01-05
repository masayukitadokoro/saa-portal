'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { 
  ArrowLeft, 
  Image as ImageIcon, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Wand2,
  Upload,
  X,
  Palette,
  Sparkles,
  Layout,
  Type,
  Check,
  Square,
  CheckSquare,
  History,
  Save,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Video {
  video_id: string;
  title: string;
  thumbnail_url: string | null;
  video_url: string;
}

interface StyleSettings {
  colorScheme: string;
  style: string;
  mood: string;
  elements: string;
  customPrompt: string;
}

interface SavedStyle {
  id: string;
  name: string;
  color_scheme: string;
  style: string;
  mood: string;
  elements: string;
  custom_prompt: string | null;
  preview_url: string | null;
  created_at: string;
}

const defaultStyleSettings: StyleSettings = {
  colorScheme: 'blue-white',
  style: 'minimalist-illustration',
  mood: 'professional',
  elements: 'business-icons',
  customPrompt: ''
};

const colorSchemeOptions = [
  { value: 'blue-white', label: '青・白系', description: '信頼感・清潔感' },
  { value: 'orange-warm', label: 'オレンジ・暖色系', description: '活気・エネルギー' },
  { value: 'green-nature', label: '緑・自然系', description: '成長・安心感' },
  { value: 'purple-creative', label: '紫・クリエイティブ系', description: '革新・創造性' },
  { value: 'monochrome', label: 'モノクロ・グレー系', description: 'シンプル・洗練' },
  { value: 'gradient-modern', label: 'グラデーション', description: 'モダン・先進的' },
];

const styleOptions = [
  { value: 'minimalist-illustration', label: 'ミニマルイラスト', description: 'シンプルな線画・フラットデザイン' },
  { value: 'isometric', label: 'アイソメトリック', description: '立体的な図形・3D風' },
  { value: 'abstract', label: '抽象的', description: '幾何学模様・アート風' },
  { value: 'infographic', label: 'インフォグラフィック', description: 'データ・図解風' },
  { value: 'cartoon', label: 'カートゥーン', description: 'ポップなイラスト' },
  { value: 'realistic', label: 'リアル風', description: '写実的なイラスト' },
];

const moodOptions = [
  { value: 'professional', label: 'プロフェッショナル', description: 'ビジネス向け・信頼感' },
  { value: 'friendly', label: 'フレンドリー', description: '親しみやすい・カジュアル' },
  { value: 'energetic', label: 'エネルギッシュ', description: '活発・ダイナミック' },
  { value: 'calm', label: '落ち着いた', description: '穏やか・安心感' },
  { value: 'innovative', label: '革新的', description: '先進的・未来的' },
  { value: 'educational', label: '教育的', description: '学習・成長' },
];

const elementOptions = [
  { value: 'business-icons', label: 'ビジネスアイコン', description: 'グラフ・チャート・オフィス' },
  { value: 'people', label: '人物シルエット', description: 'チーム・協力' },
  { value: 'technology', label: 'テクノロジー', description: 'デジタル・IT要素' },
  { value: 'nature', label: '自然要素', description: '植物・成長のメタファー' },
  { value: 'geometric', label: '幾何学図形', description: '抽象的な形' },
  { value: 'none', label: '最小限', description: 'シンプルな背景のみ' },
];

export default function AdminThumbnailsPage() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [styleSettings, setStyleSettings] = useState<StyleSettings>(defaultStyleSettings);
  const [generating, setGenerating] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetVideo, setUploadTargetVideo] = useState<Video | null>(null);

  // 選択関連
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  
  // UI状態
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unset' | 'set'>('all');
  
  // スタイル履歴
  const [savedStyles, setSavedStyles] = useState<SavedStyle[]>([]);
  const [styleName, setStyleName] = useState('');

  useEffect(() => {
    fetchVideos();
    fetchSavedStyles();
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await fetch('/api/admin/videos');
      if (res.ok) {
        const data = await res.json();
        setVideos(data.videos || []);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedStyles = async () => {
    try {
      const res = await fetch('/api/admin/thumbnail-styles');
      if (res.ok) {
        const data = await res.json();
        setSavedStyles(data.styles || []);
      }
    } catch (error) {
      console.error('Error fetching styles:', error);
    }
  };

  const getYouTubeId = (url: string): string | null => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match ? match[1] : null;
  };

  const getYouTubeThumbnail = (videoUrl: string): string => {
    const id = getYouTubeId(videoUrl);
    if (id) return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
    return '/placeholder-video.png';
  };

  const buildStylePrompt = (): string => {
    const colorMap: Record<string, string> = {
      'blue-white': 'Use a blue and white color palette with subtle gray accents.',
      'orange-warm': 'Use warm orange, yellow, and coral colors.',
      'green-nature': 'Use green, teal, and natural earth tones.',
      'purple-creative': 'Use purple, violet, and magenta creative colors.',
      'monochrome': 'Use black, white, and gray monochrome palette.',
      'gradient-modern': 'Use modern gradient colors, transitioning smoothly between vibrant hues.',
    };

    const styleMap: Record<string, string> = {
      'minimalist-illustration': 'Minimalist flat illustration style with clean lines and simple shapes.',
      'isometric': 'Isometric 3D illustration style with geometric precision.',
      'abstract': 'Abstract artistic style with geometric patterns and shapes.',
      'infographic': 'Infographic style with data visualization elements and icons.',
      'cartoon': 'Cartoon illustration style, playful and colorful.',
      'realistic': 'Semi-realistic illustration with detailed rendering.',
    };

    const moodMap: Record<string, string> = {
      'professional': 'Professional and business-like atmosphere.',
      'friendly': 'Friendly and approachable feel.',
      'energetic': 'Energetic and dynamic composition.',
      'calm': 'Calm and peaceful mood.',
      'innovative': 'Innovative and futuristic vibe.',
      'educational': 'Educational and informative tone.',
    };

    const elementMap: Record<string, string> = {
      'business-icons': 'Include business elements like charts, graphs, laptops, or office items.',
      'people': 'Include stylized human figures or silhouettes.',
      'technology': 'Include technology elements like devices, circuits, or digital symbols.',
      'nature': 'Include nature elements like plants, leaves, or growth symbols.',
      'geometric': 'Use geometric shapes as main design elements.',
      'none': 'Keep the design minimal with simple background.',
    };

    let prompt = `Professional YouTube thumbnail for a business/startup education video.
16:9 aspect ratio. No text or letters in the image.

${colorMap[styleSettings.colorScheme] || ''}
${styleMap[styleSettings.style] || ''}
${moodMap[styleSettings.mood] || ''}
${elementMap[styleSettings.elements] || ''}`;

    if (styleSettings.customPrompt) {
      prompt += `\n\nAdditional requirements: ${styleSettings.customPrompt}`;
    }

    return prompt;
  };

  const generateThumbnail = async (video: Video): Promise<boolean> => {
    setGenerating(video.video_id);
    setError(null);

    try {
      const res = await fetch('/api/admin/generate-thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: video.video_id,
          title: video.title,
          style_prompt: buildStylePrompt()
        })
      });

      const data = await res.json();

      if (res.ok) {
        setVideos(prev => prev.map(v => 
          v.video_id === video.video_id 
            ? { ...v, thumbnail_url: data.thumbnail_url }
            : v
        ));
        setGeneratedCount(prev => prev + 1);
        return true;
      } else {
        setError(data.error || 'サムネイル生成に失敗しました');
        return false;
      }
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      setError('サムネイル生成中にエラーが発生しました');
      return false;
    } finally {
      setGenerating(null);
    }
  };

  const generateSelectedThumbnails = async () => {
    if (selectedVideos.size === 0) {
      setError('動画を選択してください');
      return;
    }

    const selectedVideoList = videos.filter(v => selectedVideos.has(v.video_id));
    const cost = (selectedVideoList.length * 0.04).toFixed(2);
    
    if (!confirm(`${selectedVideoList.length}件の動画のサムネイルを生成します。\n約$${cost}のAPI料金がかかります。\n続行しますか？`)) {
      return;
    }

    setBulkGenerating(true);
    setGeneratedCount(0);

    for (const video of selectedVideoList) {
      await generateThumbnail(video);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    setBulkGenerating(false);
    setSelectedVideos(new Set());
    setSuccess(`${selectedVideoList.length}件のサムネイルを生成しました`);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !uploadTargetVideo) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('ファイルサイズは5MB以下にしてください');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('画像ファイルを選択してください');
      return;
    }

    setUploading(uploadTargetVideo.video_id);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('video_id', uploadTargetVideo.video_id);

      const res = await fetch('/api/admin/upload-thumbnail', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        setVideos(prev => prev.map(v => 
          v.video_id === uploadTargetVideo.video_id 
            ? { ...v, thumbnail_url: data.thumbnail_url }
            : v
        ));
        setSuccess('アップロードしました');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'アップロードに失敗しました');
      }
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      setError('アップロード中にエラーが発生しました');
    } finally {
      setUploading(null);
      setUploadTargetVideo(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const saveCurrentStyle = async () => {
    if (!styleName.trim()) {
      setError('スタイル名を入力してください');
      return;
    }

    try {
      const res = await fetch('/api/admin/thumbnail-styles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: styleName,
          color_scheme: styleSettings.colorScheme,
          style: styleSettings.style,
          mood: styleSettings.mood,
          elements: styleSettings.elements,
          custom_prompt: styleSettings.customPrompt || null
        })
      });

      if (res.ok) {
        setSuccess('スタイルを保存しました');
        setStyleName('');
        fetchSavedStyles();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('スタイルの保存に失敗しました');
      }
    } catch (error) {
      console.error('Error saving style:', error);
      setError('スタイルの保存中にエラーが発生しました');
    }
  };

  const applyStyle = (style: SavedStyle) => {
    setStyleSettings({
      colorScheme: style.color_scheme,
      style: style.style,
      mood: style.mood,
      elements: style.elements,
      customPrompt: style.custom_prompt || ''
    });
    setSuccess(`「${style.name}」スタイルを適用しました`);
    setTimeout(() => setSuccess(null), 2000);
  };

  // 選択関連
  const toggleVideoSelection = (videoId: string) => {
    setSelectedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
  };

  const selectAllVisible = () => {
    const visibleVideos = getFilteredVideos();
    setSelectedVideos(new Set(visibleVideos.map(v => v.video_id)));
  };

  const deselectAll = () => {
    setSelectedVideos(new Set());
  };

  const getFilteredVideos = () => {
    switch (activeTab) {
      case 'unset':
        return videos.filter(v => !v.thumbnail_url);
      case 'set':
        return videos.filter(v => v.thumbnail_url);
      default:
        return videos;
    }
  };

  const getOptionLabel = (type: string, value: string): string => {
    const options = type === 'colorScheme' ? colorSchemeOptions 
      : type === 'style' ? styleOptions 
      : type === 'mood' ? moodOptions 
      : elementOptions;
    return options.find(o => o.value === value)?.label || value;
  };

  if (!user) {
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

  const filteredVideos = getFilteredVideos();
  const videosWithThumbnail = videos.filter(v => v.thumbnail_url);
  const videosWithoutThumbnail = videos.filter(v => !v.thumbnail_url);

  return (
    <div className="min-h-screen bg-gray-50">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            管理者ダッシュボードに戻る
          </Link>
          
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">サムネイル管理</h1>
                <p className="text-gray-500">
                  {videosWithThumbnail.length}/{videos.length}件 設定済み
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 通知 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            {success}
          </div>
        )}

        {/* スタイル設定パネル */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <button
            onClick={() => setShowStylePanel(!showStylePanel)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition rounded-xl"
          >
            <div className="flex items-center gap-3">
              <Palette className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-gray-900">スタイル設定</span>
              <span className="text-sm text-gray-500">
                {getOptionLabel('colorScheme', styleSettings.colorScheme)} / {getOptionLabel('style', styleSettings.style)}
              </span>
            </div>
            {showStylePanel ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          {showStylePanel && (
            <div className="px-6 pb-6 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                {/* カラースキーム */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🎨 カラースキーム</label>
                  <div className="space-y-2">
                    {colorSchemeOptions.map(option => (
                      <label
                        key={option.value}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                          styleSettings.colorScheme === option.value
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="colorScheme"
                          value={option.value}
                          checked={styleSettings.colorScheme === option.value}
                          onChange={(e) => setStyleSettings(prev => ({ ...prev, colorScheme: e.target.value }))}
                          className="sr-only"
                        />
                        <div>
                          <p className="font-medium text-sm">{option.label}</p>
                          <p className="text-xs text-gray-500">{option.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* イラストスタイル */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">✨ イラストスタイル</label>
                  <div className="space-y-2">
                    {styleOptions.map(option => (
                      <label
                        key={option.value}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                          styleSettings.style === option.value
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="style"
                          value={option.value}
                          checked={styleSettings.style === option.value}
                          onChange={(e) => setStyleSettings(prev => ({ ...prev, style: e.target.value }))}
                          className="sr-only"
                        />
                        <div>
                          <p className="font-medium text-sm">{option.label}</p>
                          <p className="text-xs text-gray-500">{option.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 雰囲気 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🌟 雰囲気・ムード</label>
                  <div className="space-y-2">
                    {moodOptions.map(option => (
                      <label
                        key={option.value}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                          styleSettings.mood === option.value
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="mood"
                          value={option.value}
                          checked={styleSettings.mood === option.value}
                          onChange={(e) => setStyleSettings(prev => ({ ...prev, mood: e.target.value }))}
                          className="sr-only"
                        />
                        <div>
                          <p className="font-medium text-sm">{option.label}</p>
                          <p className="text-xs text-gray-500">{option.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 要素 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🎯 含める要素</label>
                  <div className="space-y-2">
                    {elementOptions.map(option => (
                      <label
                        key={option.value}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                          styleSettings.elements === option.value
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="elements"
                          value={option.value}
                          checked={styleSettings.elements === option.value}
                          onChange={(e) => setStyleSettings(prev => ({ ...prev, elements: e.target.value }))}
                          className="sr-only"
                        />
                        <div>
                          <p className="font-medium text-sm">{option.label}</p>
                          <p className="text-xs text-gray-500">{option.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* 追加指示 */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">➕ 追加指示（任意）</label>
                <textarea
                  value={styleSettings.customPrompt}
                  onChange={(e) => setStyleSettings(prev => ({ ...prev, customPrompt: e.target.value }))}
                  rows={2}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  placeholder="例: ロケットのモチーフを入れてください"
                />
              </div>

              {/* スタイル保存 */}
              <div className="mt-4 flex items-center gap-3">
                <input
                  type="text"
                  value={styleName}
                  onChange={(e) => setStyleName(e.target.value)}
                  placeholder="スタイル名（例: ビジネス青系）"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={saveCurrentStyle}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  <Save className="w-4 h-4" />
                  スタイルを保存
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 保存済みスタイル履歴 */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <button
            onClick={() => setShowHistoryPanel(!showHistoryPanel)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition rounded-xl"
          >
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900">保存済みスタイル</span>
              <span className="text-sm text-gray-500">{savedStyles.length}件</span>
            </div>
            {showHistoryPanel ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          {showHistoryPanel && (
            <div className="px-6 pb-6 border-t border-gray-100">
              {savedStyles.length === 0 ? (
                <p className="text-gray-500 text-sm pt-4">保存されたスタイルはありません</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
                  {savedStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => applyStyle(style)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition text-left"
                    >
                      <p className="font-medium text-gray-900 mb-1">{style.name}</p>
                      <div className="text-xs text-gray-500 space-y-0.5">
                        <p>🎨 {getOptionLabel('colorScheme', style.color_scheme)}</p>
                        <p>✨ {getOptionLabel('style', style.style)}</p>
                        <p>🌟 {getOptionLabel('mood', style.mood)}</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(style.created_at).toLocaleDateString('ja-JP')}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* タブ切り替え & アクションバー */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* タブ */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                すべて ({videos.length})
              </button>
              <button
                onClick={() => setActiveTab('unset')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === 'unset' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                未設定 ({videosWithoutThumbnail.length})
              </button>
              <button
                onClick={() => setActiveTab('set')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === 'set' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                設定済み ({videosWithThumbnail.length})
              </button>
            </div>

            {/* アクションボタン */}
            <div className="flex items-center gap-3">
              {selectedVideos.size > 0 ? (
                <>
                  <span className="text-sm text-gray-600">{selectedVideos.size}件選択中</span>
                  <button
                    onClick={deselectAll}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    選択解除
                  </button>
                  <button
                    onClick={generateSelectedThumbnails}
                    disabled={bulkGenerating}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    <Wand2 className="w-4 h-4" />
                    {bulkGenerating ? `生成中... (${generatedCount}/${selectedVideos.size})` : `選択した${selectedVideos.size}件を生成`}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={selectAllVisible}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    <CheckSquare className="w-4 h-4" />
                    表示中をすべて選択
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 動画一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredVideos.map((video) => (
            <div
              key={video.video_id}
              className={`bg-white rounded-xl shadow-sm overflow-hidden transition ${
                selectedVideos.has(video.video_id) ? 'ring-2 ring-purple-500' : ''
              }`}
            >
              {/* サムネイル */}
              <div 
                className="relative aspect-video bg-gray-100 cursor-pointer"
                onClick={() => toggleVideoSelection(video.video_id)}
              >
                <img
                  src={video.thumbnail_url || getYouTubeThumbnail(video.video_url)}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                
                {/* 選択チェックボックス */}
                <div className="absolute top-2 left-2">
                  <div className={`w-6 h-6 rounded flex items-center justify-center transition ${
                    selectedVideos.has(video.video_id) 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-white/80 text-gray-400 hover:bg-white'
                  }`}>
                    {selectedVideos.has(video.video_id) ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {video.thumbnail_url && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    設定済み
                  </div>
                )}
                
                {(generating === video.video_id || uploading === video.video_id) && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-white text-center">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm">{generating ? '生成中...' : 'アップロード中...'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 動画情報 */}
              <div className="p-3">
                <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-3 min-h-[2.5rem]">
                  {video.title}
                </h3>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => generateThumbnail(video)}
                    disabled={generating !== null || bulkGenerating}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-100 disabled:opacity-50 transition"
                  >
                    <Wand2 className="w-4 h-4" />
                    AI生成
                  </button>
                  <button
                    onClick={() => {
                      setUploadTargetVideo(video);
                      fileInputRef.current?.click();
                    }}
                    disabled={uploading !== null}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 disabled:opacity-50 transition"
                  >
                    <Upload className="w-4 h-4" />
                    アップロード
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
