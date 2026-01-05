'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { 
  ArrowLeft, 
  Save, 
  Eye,
  EyeOff,
  Video,
  FileSpreadsheet,
  BookOpen,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Minus,
  Undo,
  Redo,
  Check,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

interface VideoData {
  video_id: string;
  title: string;
  video_url: string;
  related_spreadsheet_url: string | null;
  spreadsheet_title: string | null;
  article_content: string | null;
  thumbnail_url: string | null;
}

export default function AdminVideoEditPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const videoId = params.videoId as string;

  const [video, setVideo] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // フォームの状態
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [spreadsheetTitle, setSpreadsheetTitle] = useState('');
  const [articleContent, setArticleContent] = useState('');
  
  // プレビューモード
  const [showPreview, setShowPreview] = useState(false);
  
  // エディタ参照
  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchVideo();
  }, [videoId]);

  const fetchVideo = async () => {
    try {
      const res = await fetch(`/api/admin/videos/${videoId}`);
      if (res.ok) {
        const data = await res.json();
        setVideo(data.video);
        setSpreadsheetUrl(data.video.related_spreadsheet_url || '');
        setSpreadsheetTitle(data.video.spreadsheet_title || '');
        setArticleContent(data.video.article_content || '');
      } else {
        setError('動画が見つかりません');
      }
    } catch (error) {
      console.error('Error fetching video:', error);
      setError('読み込みエラー');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/videos/${videoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          related_spreadsheet_url: spreadsheetUrl || null,
          spreadsheet_title: spreadsheetTitle || null,
          article_content: articleContent || null
        })
      });

      if (res.ok) {
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

  // エディタのテキスト操作関数
  const insertText = (before: string, after: string = '') => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = articleContent.substring(start, end);
    const newText = articleContent.substring(0, start) + before + selectedText + after + articleContent.substring(end);
    
    setArticleContent(newText);
    
    // カーソル位置を調整
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const insertAtLineStart = (prefix: string) => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = articleContent.lastIndexOf('\n', start - 1) + 1;
    const newText = articleContent.substring(0, lineStart) + prefix + articleContent.substring(lineStart);
    
    setArticleContent(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  };

  // マークダウンをHTMLに変換（簡易版）
  const renderMarkdown = (text: string): string => {
    if (!text) return '';
    
    let html = text
      // 見出し
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
      // 太字・イタリック
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
      // リスト
      .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
      // 引用
      .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-2">$1</blockquote>')
      // 区切り線
      .replace(/^---$/gm, '<hr class="my-4 border-gray-300" />')
      // リンク
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" class="text-blue-600 underline">$1</a>')
      // 改行
      .replace(/\n\n/g, '</p><p class="mb-3">')
      .replace(/\n/g, '<br />');
    
    return `<p class="mb-3">${html}</p>`;
  };

  const getYouTubeId = (url: string): string | null => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match ? match[1] : null;
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

  if (error && !video) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/admin/contents" className="text-blue-600 hover:underline">
            動画一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/contents"
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              動画一覧
            </Link>
            <span className="text-gray-300">|</span>
            <h1 className="font-semibold text-gray-900 truncate max-w-md">
              {video?.title}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {success && (
              <span className="text-green-600 text-sm flex items-center gap-1">
                <Check className="w-4 h-4" />
                {success}
              </span>
            )}
            {error && (
              <span className="text-red-600 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {error}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側: 動画情報 */}
          <div className="lg:col-span-1 space-y-4">
            {/* 動画プレビュー */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="aspect-video bg-gray-900">
                {video?.video_url && (
                  <img
                    src={video.thumbnail_url || `https://img.youtube.com/vi/${getYouTubeId(video.video_url)}/maxresdefault.jpg`}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="p-4">
                <h2 className="font-semibold text-gray-900 mb-2">{video?.title}</h2>
                <a
                  href={video?.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  YouTubeで開く
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* スプレッドシート設定 */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">スプレッドシート</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    タイトル
                  </label>
                  <input
                    type="text"
                    value={spreadsheetTitle}
                    onChange={(e) => setSpreadsheetTitle(e.target.value)}
                    placeholder="例: PMF判定ワークシート"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL
                  </label>
                  <input
                    type="url"
                    value={spreadsheetUrl}
                    onChange={(e) => setSpreadsheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>

                {spreadsheetUrl && (
                  <a
                    href={spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-green-600 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    スプレッドシートを開く
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* 右側: 記事エディタ */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* エディタヘッダー */}
              <div className="border-b border-gray-200 p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">解説記事</h3>
                  </div>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      showPreview 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {showPreview ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        編集に戻る
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        プレビュー
                      </>
                    )}
                  </button>
                </div>

                {/* ツールバー（編集モード時のみ） */}
                {!showPreview && (
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      onClick={() => insertText('**', '**')}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="太字"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => insertText('*', '*')}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="イタリック"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <div className="w-px h-6 bg-gray-200 mx-1" />
                    <button
                      onClick={() => insertAtLineStart('# ')}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="見出し1"
                    >
                      <Heading1 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => insertAtLineStart('## ')}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="見出し2"
                    >
                      <Heading2 className="w-4 h-4" />
                    </button>
                    <div className="w-px h-6 bg-gray-200 mx-1" />
                    <button
                      onClick={() => insertAtLineStart('- ')}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="箇条書き"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => insertAtLineStart('1. ')}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="番号付きリスト"
                    >
                      <ListOrdered className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => insertAtLineStart('> ')}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="引用"
                    >
                      <Quote className="w-4 h-4" />
                    </button>
                    <div className="w-px h-6 bg-gray-200 mx-1" />
                    <button
                      onClick={() => insertText('[リンクテキスト](', ')')}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="リンク"
                    >
                      <LinkIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => insertText('\n---\n', '')}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="区切り線"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* エディタ本体 / プレビュー */}
              <div className="p-4">
                {showPreview ? (
                  <div className="min-h-[500px] prose prose-sm max-w-none">
                    {articleContent ? (
                      <div 
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(articleContent) }}
                        className="text-gray-700"
                      />
                    ) : (
                      <p className="text-gray-400 italic">記事が入力されていません</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <textarea
                      ref={editorRef}
                      value={articleContent}
                      onChange={(e) => setArticleContent(e.target.value)}
                      placeholder="ここに解説記事を書いてください...

マークダウン記法が使えます:
# 見出し1
## 見出し2
**太字**
*イタリック*
- 箇条書き
1. 番号付きリスト
> 引用
[リンク](URL)
---"
                      className="w-full min-h-[500px] p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm leading-relaxed"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      マークダウン記法に対応しています。ツールバーのボタンで書式を挿入できます。
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
