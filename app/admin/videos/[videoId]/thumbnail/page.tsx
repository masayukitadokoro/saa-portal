'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import {
  ArrowLeft,
  Loader2,
  Check,
  AlertCircle,
  Upload,
  RotateCcw,
  ExternalLink,
  Sparkles,
  Copy,
  Image as ImageIcon,
  ZoomIn,
  CheckCircle2,
  Info
} from 'lucide-react';

interface VideoData {
  video_id: string;
  title: string;
  thumbnail_url: string | null;
  custom_thumbnail_url: string | null;
}

interface TemplateImage {
  id: string;
  name: string;
  url: string;
  description: string;
}

export default function ThumbnailEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const videoId = params.videoId as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [video, setVideo] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // サムネイル
  const [currentThumbnail, setCurrentThumbnail] = useState<string | null>(null);
  const [originalThumbnail, setOriginalThumbnail] = useState<string | null>(null);
  
  // テンプレート
  const [templateImages, setTemplateImages] = useState<TemplateImage[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateImage | null>(null);
  
  // カスタムタイトル（プロンプト用）
  const [customTitle, setCustomTitle] = useState('');

  useEffect(() => {
    fetchData();
    fetchTemplates();
  }, [videoId]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/admin/videos/${videoId}`);
      if (res.ok) {
        const data = await res.json();
        setVideo(data.video);
        setCurrentThumbnail(data.video.custom_thumbnail_url || null);
        setOriginalThumbnail(data.video.thumbnail_url || null);
        
        if (data.video.title) {
          const cleanTitle = data.video.title.replace(/^\d+-?\d*_/, '').trim();
          setCustomTitle(cleanTitle);
        }
      }
    } catch (err) {
      setError('動画情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/admin/thumbnail-templates');
      if (res.ok) {
        const data = await res.json();
        if (data.templates?.length > 0) {
          setTemplateImages(data.templates);
          setSelectedTemplate(data.templates[0]);
        }
      }
    } catch {
      // エラー時はテンプレートなし
    }
  };

  // テンプレートを新しいタブで開く
  const openTemplateInNewTab = () => {
    if (selectedTemplate?.url) {
      window.open(selectedTemplate.url, '_blank');
    }
  };

  // プロンプトをコピー
  const copyPrompt = () => {
    const prompt = `このサムネイルのタイトルを「${customTitle}」に変えて作成して。デザインテイスト、フォント、レイアウトは参考画像と同じにして。`;
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 画像アップロード
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('ファイルサイズは5MB以下にしてください');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/admin/videos/${videoId}/upload-thumbnail`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      
      if (res.ok && data.url) {
        await fetch(`/api/admin/videos/${videoId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ custom_thumbnail_url: data.url })
        });

        setCurrentThumbnail(data.url);
        setSuccess('サムネイルを保存しました！');
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(data.error || 'アップロードに失敗しました');
      }
    } catch {
      setError('アップロード中にエラーが発生しました');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // サムネイルをYouTubeのものに戻す
  const handleReset = async () => {
    if (!confirm('カスタムサムネイルを削除して、YouTubeの元のサムネイルに戻しますか？\n\n※この操作は取り消せません')) return;

    setResetting(true);
    try {
      await fetch(`/api/admin/videos/${videoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_thumbnail_url: null })
      });
      setCurrentThumbnail(null);
      setSuccess('YouTubeのサムネイルに戻しました');
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('リセットに失敗しました');
    } finally {
      setResetting(false);
    }
  };

  // 動画一覧に戻る
  const goBackToList = () => {
    router.push('/admin/contents');
  };

  if (!user) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p>ログインが必要です</p></div>;
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={goBackToList} 
              className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> 動画一覧に戻る
            </button>
            <span className="text-gray-300">|</span>
            <h1 className="font-semibold">🖼️ サムネイル設定</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {error && <span className="text-red-600 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" />{error}</span>}
            {success && <span className="text-green-600 text-sm flex items-center gap-1"><Check className="w-4 h-4" />{success}</span>}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        
        {/* 現在のサムネイル + アップロード */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-600" />
              現在のサムネイル
            </h2>
            {currentThumbnail && (
              <button
                onClick={handleReset}
                disabled={resetting}
                className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                YouTubeのサムネイルに戻す
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 現在の画像 */}
            <div>
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border">
                {currentThumbnail ? (
                  <img src={currentThumbnail} alt="カスタムサムネイル" className="w-full h-full object-cover" />
                ) : originalThumbnail ? (
                  <img src={originalThumbnail} alt="YouTubeサムネイル" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    サムネイルなし
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2 truncate">{video?.title}</p>
              {currentThumbnail ? (
                <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  ✓ カスタムサムネイル（自動保存済み）
                </span>
              ) : (
                <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  YouTubeの元サムネイル
                </span>
              )}
            </div>
            
            {/* アップロードエリア */}
            <div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full h-full min-h-[180px] border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:border-purple-500 hover:bg-purple-50 transition flex flex-col items-center justify-center gap-2"
              >
                {uploading ? (
                  <><Loader2 className="w-8 h-8 animate-spin" /><span className="font-medium">アップロード中...</span></>
                ) : (
                  <>
                    <Upload className="w-10 h-10" />
                    <span className="font-bold">サムネイルをアップロード</span>
                    <span className="text-xs text-purple-400">1280 x 720px 推奨・5MB以下</span>
                    <span className="text-xs text-gray-500 mt-1">※アップロードすると自動で保存されます</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* 成功時のフロー */}
          {currentThumbnail && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <span className="text-green-700 font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  サムネイルが保存されました！
                </span>
                <button
                  onClick={goBackToList}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                >
                  動画一覧に戻る →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Geminiで作成する手順 */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl shadow-sm p-5 border border-purple-100">
          <h2 className="font-bold text-lg mb-5 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            Geminiでサムネイルを作成する手順
          </h2>

          <div className="space-y-4">
            
            {/* Step 1 */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">1</span>
                <h3 className="font-bold text-gray-900">テンプレートを選んで、Geminiに貼り付け</h3>
              </div>
              
              {templateImages.length > 0 ? (
                <>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                    {templateImages.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className={`relative rounded-lg overflow-hidden border-2 transition ${
                          selectedTemplate?.id === template.id 
                            ? 'border-purple-500 ring-2 ring-purple-200' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="aspect-video bg-gray-200">
                          <img 
                            src={template.url} 
                            alt={template.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {selectedTemplate?.id === template.id && (
                          <div className="absolute top-1 right-1 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={openTemplateInNewTab}
                    disabled={!selectedTemplate}
                    className="w-full py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <ZoomIn className="w-4 h-4" />
                    テンプレートを拡大表示（右クリック→画像をコピー）
                  </button>
                </>
              ) : (
                <p className="text-gray-500 text-sm">テンプレートがありません</p>
              )}
              
              <div className="mt-3 flex items-center gap-3">
                <a 
                  href="https://gemini.google.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Geminiを開く <ExternalLink className="w-4 h-4" />
                </a>
                <span className="text-sm text-gray-500">→ コピーした画像を貼り付け</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">2</span>
                <h3 className="font-bold text-gray-900">プロンプトを送信して画像を生成</h3>
              </div>
              
              {/* タイトル入力 */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  サムネイルのタイトル（編集してからコピー）
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-medium"
                  placeholder="タイトルを入力"
                />
              </div>
              
              {/* プロンプト */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-3">
                <p className="text-gray-800 leading-relaxed">
                  このサムネイルのタイトルを「<span className="font-bold text-purple-700 bg-purple-100 px-1 rounded">{customTitle || 'タイトル'}</span>」に変えて作成して。デザインテイスト、フォント、レイアウトは参考画像と同じにして。
                </p>
              </div>
              
              <button
                onClick={copyPrompt}
                className="w-full py-3 bg-purple-100 text-purple-700 rounded-lg font-bold hover:bg-purple-200 flex items-center justify-center gap-2 text-base"
              >
                {copied ? (
                  <><Check className="w-5 h-5" /> コピーしました！</>
                ) : (
                  <><Copy className="w-5 h-5" /> プロンプトをコピー</>
                )}
              </button>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">3</span>
                <h3 className="font-bold text-gray-900">生成された画像をアップロード</h3>
              </div>
              
              <p className="text-gray-600 mb-3">
                Geminiで生成された画像を右クリック →「名前を付けて画像を保存」でダウンロードし、上の「サムネイルをアップロード」エリアにドラッグ＆ドロップしてください。
              </p>
              
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
              >
                ↑ アップロードエリアに移動
              </button>
            </div>

            {/* Tips - 大きく */}
            <div className="bg-yellow-50 rounded-lg p-5 border border-yellow-300">
              <p className="font-bold text-yellow-800 mb-3 flex items-center gap-2 text-base">
                <Info className="w-5 h-5" />
                重要なポイント
              </p>
              <ul className="text-yellow-800 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-yellow-600">①</span>
                  <span>Geminiの右上で<strong>「思考モード」</strong>を選択してください（高速モードだと画像生成できません）</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-yellow-600">②</span>
                  <span>プロンプトを送信したら、下に表示される<strong>「🍌画像の作成」</strong>ボタンをクリック</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-yellow-600">③</span>
                  <span>気に入らなければ「再生成」ボタンで何度でもやり直しOK</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-yellow-600">④</span>
                  <span>田所さんの顔を変えたい場合は、別の写真も一緒に添付</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
