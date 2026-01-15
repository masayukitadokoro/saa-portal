'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';
import {
  Save, Check, AlertCircle, Clock, X, Sparkles, Loader2, Plus, 
  Image as ImageIcon, Type, Heading1, Heading2, List, ListOrdered, 
  Quote, Minus, Upload, Wand2, MoreHorizontal, History, Trash2, 
  RotateCcw, Send, MessageSquare, FileText, Youtube, ExternalLink, 
  ChevronLeft, Eye, Chrome, Download, Code, Info, HelpCircle, Settings,
  ChevronDown, ChevronUp, GripVertical
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface VideoData {
  video_id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  article_content: string | null;
  article_status: string | null;
  article_cover_url: string | null;
  article_tags: string[] | null;
  article_published_at: string | null;
  transcript: string | null;
  summary: string | null;
  key_points: string[] | null;
}

interface Block {
  id: string;
  type: 'paragraph' | 'heading2' | 'heading3' | 'bullet' | 'numbered' | 'quote' | 'divider' | 'image' | 'code';
  content: string;
  imageUrl?: string;
}

interface ArticleVersion {
  id: number;
  tone_type: string;
  tone_label: string;
  char_count: number;
  created_at: string;
  content?: string;
}

const blocksToMarkdown = (blocks: Block[]): string => {
  return blocks.map(block => {
    switch (block.type) {
      case 'heading2': return `## ${block.content}`;
      case 'heading3': return `### ${block.content}`;
      case 'bullet': return `- ${block.content}`;
      case 'numbered': return `1. ${block.content}`;
      case 'quote': return `> ${block.content}`;
      case 'divider': return '---';
      case 'code': return `\`\`\`\n${block.content}\n\`\`\``;
      case 'image': return block.imageUrl ? `![${block.content || '画像'}](${block.imageUrl})` : '';
      default: return block.content;
    }
  }).filter(Boolean).join('\n\n');
};

const markdownToBlocks = (markdown: string): Block[] => {
  if (!markdown) return [{ id: crypto.randomUUID(), type: 'paragraph', content: '' }];
  
  let cleanMarkdown = markdown
    .replace(/^```markdown\s*/gm, '')
    .replace(/^```\s*$/gm, '')
    .trim();
  
  const lines = cleanMarkdown.split('\n');
  const blocks: Block[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
      blocks.push({ id: crypto.randomUUID(), type: 'heading2', content: trimmed.slice(2) });
    } else if (trimmed.startsWith('## ')) {
      blocks.push({ id: crypto.randomUUID(), type: 'heading2', content: trimmed.slice(3) });
    } else if (trimmed.startsWith('### ')) {
      blocks.push({ id: crypto.randomUUID(), type: 'heading3', content: trimmed.slice(4) });
    } else if (trimmed.startsWith('- ')) {
      blocks.push({ id: crypto.randomUUID(), type: 'bullet', content: trimmed.slice(2) });
    } else if (/^\d+\.\s/.test(trimmed)) {
      blocks.push({ id: crypto.randomUUID(), type: 'numbered', content: trimmed.replace(/^\d+\.\s/, '') });
    } else if (trimmed.startsWith('> ')) {
      blocks.push({ id: crypto.randomUUID(), type: 'quote', content: trimmed.slice(2) });
    } else if (trimmed === '---') {
      blocks.push({ id: crypto.randomUUID(), type: 'divider', content: '' });
    } else if (trimmed.startsWith('![')) {
      const match = trimmed.match(/!\[(.*?)\]\((.*?)\)/);
      blocks.push({ id: crypto.randomUUID(), type: 'image', content: match?.[1] || '', imageUrl: match?.[2] });
    } else {
      blocks.push({ id: crypto.randomUUID(), type: 'paragraph', content: trimmed });
    }
  }
  
  return blocks.length > 0 ? blocks : [{ id: crypto.randomUUID(), type: 'paragraph', content: '' }];
};

const INSERT_MENU_ITEMS = [
  { type: 'paragraph', icon: Type, label: 'テキスト', description: '本文テキストを入力できます。', exampleTitle: 'テキスト', exampleContent: '本文を入力してください。' },
  { type: 'image', icon: ImageIcon, label: '画像', description: '画像を埋め込むことができます。', showImageExample: true },
  { type: 'heading2', icon: Heading1, label: '大見出し', description: '大きい文字で、見出しを埋め込むことができます。', exampleTitle: 'この動画の核心（大見出し）', exampleContent: 'セクションのタイトルとして使用します。' },
  { type: 'heading3', icon: Heading2, label: '小見出し', description: 'やや大きい文字で、小見出しを埋め込むことができます。', exampleTitle: '具体的な事例（小見出し）', exampleContent: '大見出しの下に配置して使用します。' },
  { type: 'bullet', icon: List, label: '箇条書きリスト', description: '・で始まるリストを作成できます。', exampleTitle: '箇条書きの例', exampleContent: '・ポイント1\n・ポイント2' },
  { type: 'numbered', icon: ListOrdered, label: '番号付きリスト', description: '番号付きのリストを作成できます。', exampleTitle: '番号付きリストの例', exampleContent: '1. 最初のステップ\n2. 次のステップ' },
  { type: 'quote', icon: Quote, label: '引用', description: '引用文を装飾付きで表示できます。', exampleTitle: '引用の例', exampleContent: '「顧客が本当に欲しいものは...」' },
  { type: 'code', icon: Code, label: 'コード', description: 'コードブロックを埋め込むことができます。', exampleTitle: 'コードの例', exampleContent: 'const x = 1;' },
  { type: 'divider', icon: Minus, label: '区切り線', description: 'セクション間に区切り線を入れます。', showDividerExample: true },
];

const SUGGESTED_TAGS = ['起業', 'スタートアップ', 'PMF', 'MVP', '起業の科学', 'ビジネス', 'マーケティング', '資金調達'];

const TONE_OPTIONS = [
  { id: 'beginner', label: '入門編', icon: '👶', desc: '初心者向け・やさしい解説', chars: '約1,500字', cost: { usd: 0.04, jpy: 6 } },
  { id: 'practical', label: '実践編', icon: '🎯', desc: 'アクション重視・フレームワーク', chars: '約1,800字', cost: { usd: 0.04, jpy: 6 } },
  { id: 'advanced', label: '深掘り編', icon: '🔬', desc: '上級者向け・本質的考察', chars: '約2,000字', cost: { usd: 0.04, jpy: 6 } },
];

const COVER_IMAGE_COST = { usd: 0.04, jpy: 6 };

// 【修正10】トースト通知コンポーネント（右下に表示）
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => (
  <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-slide-up ${
    type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
  }`}>
    {type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
    <span>{message}</span>
    <button onClick={onClose} className="ml-2 hover:opacity-70"><X className="w-4 h-4" /></button>
  </div>
);

export default function NoteStyleArticleEditor() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const videoId = params.videoId as string;

  const [video, setVideo] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [blocks, setBlocks] = useState<Block[]>([{ id: crypto.randomUUID(), type: 'paragraph', content: '' }]);
  const [showInsertMenu, setShowInsertMenu] = useState<string | null>(null);
  const [hoveredMenuItem, setHoveredMenuItem] = useState<string | null>(null);
  
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [showCoverMenu, setShowCoverMenu] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [generatingCover, setGeneratingCover] = useState(false);
  
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [versions, setVersions] = useState<ArticleVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [aiMode, setAiMode] = useState<'generate' | 'chat'>('generate');
  const [transcript, setTranscript] = useState('');
  const [selectedTone, setSelectedTone] = useState<'beginner' | 'practical' | 'advanced'>('practical');
  const [aiLoading, setAiLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const blockRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});

  // 【修正5】パネル幅のリサイズ機能
  const [panelWidth, setPanelWidth] = useState(420);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  // 【修正7】文字起こしエリアの展開
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);

  // 【修正8】生成キャンセル用
  const [generateAbortController, setGenerateAbortController] = useState<AbortController | null>(null);

  // 【修正6】未保存確認ダイアログ
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const charCount = blocks.reduce((sum, b) => sum + b.content.length, 0);
  const transcriptCharCount = transcript.length;
  const hasTranscript = transcript.trim().length > 0;

  const [isChrome, setIsChrome] = useState(true);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent;
      setIsChrome(userAgent.includes('Chrome') && !userAgent.includes('Edg'));
    }
  }, []);

  // 【修正5】リサイズハンドラー
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(320, Math.min(600, e.clientX));
      setPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  useEffect(() => {
    fetchVideo();
    fetchVersions();
  }, [videoId]);

  useEffect(() => {
    if (hasChanges) {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
      autoSaveRef.current = setTimeout(() => handleSave(true), 1000);
    }
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
  }, [blocks, hasChanges]);

  // 【修正6】ページ離脱時の確認
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  const fetchVideo = async () => {
    try {
      const res = await fetch(`/api/admin/videos/${videoId}`);
      if (res.ok) {
        const data = await res.json();
        setVideo(data.video);
        setBlocks(markdownToBlocks(data.video.article_content || ''));
        setCoverUrl(data.video.article_cover_url || null);
        setTags(data.video.article_tags || []);
        setTranscript(data.video.transcript || '');
      } else {
        setError('動画が見つかりません');
      }
    } catch { setError('読み込みエラー'); }
    finally { setLoading(false); }
  };

  const fetchVersions = async () => {
    setLoadingVersions(true);
    try {
      const res = await fetch(`/api/admin/videos/${videoId}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
      }
    } catch {}
    finally { setLoadingVersions(false); }
  };

  const handleSave = async (isAutoSave = false) => {
    setSaving(true);
    setError(null);
    
    try {
      const markdown = blocksToMarkdown(blocks);
      const res = await fetch(`/api/admin/videos/${videoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_content: markdown,
          article_cover_url: coverUrl,
          article_tags: tags,
          article_status: 'draft',
          transcript: transcript
        })
      });

      if (res.ok) {
        setLastSaved(new Date());
        setHasChanges(false);
        if (!isAutoSave) {
          setSuccess('下書きを保存しました');
          setTimeout(() => setSuccess(null), 3000);
        }
      } else {
        const data = await res.json();
        setError(data.error || '保存に失敗しました');
      }
    } catch { setError('保存エラー'); }
    finally { setSaving(false); }
  };

  // 【修正6】保存して閉じる
  const handleSaveAndClose = async () => {
    if (hasChanges) {
      await handleSave(false);
    }
    router.push('/admin/contents');
  };

  // 【修正6】閉じるボタンのクリック
  const handleCloseClick = () => {
    if (hasChanges) {
      setShowUnsavedDialog(true);
    } else {
      router.push('/admin/contents');
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setError(null);
    
    try {
      const markdown = blocksToMarkdown(blocks);
      const res = await fetch(`/api/admin/videos/${videoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_content: markdown,
          article_cover_url: coverUrl,
          article_tags: tags,
          article_status: 'published',
          article_published_at: new Date().toISOString()
        })
      });

      if (res.ok) {
        setSuccess('記事を公開しました！');
        setShowPublishModal(false);
        setTimeout(() => {
          router.push(`/videos/${videoId}`);
        }, 1500);
      } else {
        const data = await res.json();
        setError(data.error || '公開に失敗しました');
      }
    } catch { setError('公開エラー'); }
    finally { setPublishing(false); }
  };

  const updateBlock = (id: string, content: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b));
    setHasChanges(true);
  };

  const insertBlock = (afterId: string, type: Block['type']) => {
    const newBlock: Block = { id: crypto.randomUUID(), type, content: '' };
    const index = blocks.findIndex(b => b.id === afterId);
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setBlocks(newBlocks);
    setShowInsertMenu(null);
    setHoveredMenuItem(null);
    setHasChanges(true);
    setTimeout(() => { blockRefs.current[newBlock.id]?.focus(); }, 50);
  };

  const deleteBlock = (id: string) => {
    if (blocks.length <= 1) return;
    setBlocks(prev => prev.filter(b => b.id !== id));
    setHasChanges(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent, block: Block) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      insertBlock(block.id, 'paragraph');
    }
    if (e.key === 'Backspace' && block.content === '' && blocks.length > 1) {
      e.preventDefault();
      deleteBlock(block.id);
      const index = blocks.findIndex(b => b.id === block.id);
      if (index > 0) {
        const prevBlock = blocks[index - 1];
        setTimeout(() => blockRefs.current[prevBlock.id]?.focus(), 50);
      }
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingCover(true);
    setShowCoverMenu(false);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${videoId}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('article-covers')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('article-covers')
        .getPublicUrl(fileName);

      setCoverUrl(publicUrl);
      setHasChanges(true);
    } catch {
      setError('画像のアップロードに失敗しました');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleGenerateCover = async () => {
    if (!video) return;
    setGeneratingCover(true);
    setShowCoverMenu(false);
    
    try {
      const res = await fetch(`/api/admin/videos/${videoId}/generate-cover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const data = await res.json();
      
      if (res.ok && data.coverUrl) {
        setCoverUrl(data.coverUrl);
        setHasChanges(true);
        setSuccess(`カバー画像を生成しました（Flux 1.1 Pro・コスト: ¥${data.cost?.jpy || COVER_IMAGE_COST.jpy}）`);
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(data.error || '画像生成に失敗しました');
      }
    } catch { setError('画像生成エラー'); }
    finally { setGeneratingCover(false); }
  };

  // 【修正8】キャンセル可能な記事生成
  const handleGenerateArticle = async () => {
    if (!hasTranscript) {
      setError('文字起こしを入力してください');
      return;
    }
    
    // 現在の記事を履歴に保存（空でない場合）
    if (charCount > 0) {
      try {
        await fetch(`/api/admin/videos/${videoId}/versions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: blocksToMarkdown(blocks),
            tone_type: 'manual',
            tone_label: '手動編集'
          })
        });
      } catch (e) {
        console.error('Failed to save current version:', e);
      }
    }
    
    const controller = new AbortController();
    setGenerateAbortController(controller);
    setAiLoading(true);
    
    try {
      const res = await fetch(`/api/admin/videos/${videoId}/generate-article`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tone: selectedTone }),
        signal: controller.signal
      });

      const data = await res.json();
      
      if (res.ok && data.articles?.[0]) {
        const article = data.articles[0];
        setBlocks(markdownToBlocks(article.content));
        setHasChanges(true);
        
        await fetch(`/api/admin/videos/${videoId}/versions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: article.content,
            tone_type: article.tone_type,
            tone_label: article.tone_label
          })
        });
        fetchVersions();
        
        const toneInfo = TONE_OPTIONS.find(t => t.id === selectedTone);
        setSuccess(`${article.tone_label}を生成しました（コスト: 約¥${toneInfo?.cost.jpy || 6}）`);
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(data.error || '記事生成に失敗しました');
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        setSuccess('生成をキャンセルしました');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('記事生成エラー');
      }
    } finally {
      setAiLoading(false);
      setGenerateAbortController(null);
    }
  };

  // 【修正8】生成キャンセル
  const handleCancelGenerate = () => {
    if (generateAbortController) {
      generateAbortController.abort();
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setAiLoading(true);
    
    try {
      const currentContent = blocksToMarkdown(blocks);
      const res = await fetch('/api/admin/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: { title: video?.title, currentContent, transcript: transcript?.substring(0, 3000) }
        })
      });

      const data = await res.json();
      if (res.ok && data.response) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', content: 'エラーが発生しました。' }]);
      }
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'エラーが発生しました。' }]);
    } finally {
      setAiLoading(false);
    }
  };

  const addTag = (tag: string) => {
    const cleanTag = tag.replace(/^#/, '').trim();
    if (cleanTag && !tags.includes(cleanTag)) setTags([...tags, cleanTag]);
    setTagInput('');
  };

  const removeTag = (tag: string) => setTags(tags.filter(t => t !== tag));

  // 履歴復元機能（v9）
  const handleRestoreVersion = async (versionId: number) => {
    console.log('=== Starting restore for version:', versionId, '===');
    
    try {
      const res = await fetch(`/api/admin/videos/${videoId}/versions/${versionId}`);
      console.log('Fetch response status:', res.status);
      
      if (!res.ok) {
        console.error('Fetch failed with status:', res.status);
        setError('復元に失敗しました');
        return;
      }
      
      const data = await res.json();
      console.log('Version data received:', data);
      
      const content = data.version?.content;
      if (!content) {
        console.error('No content in version data');
        setError('復元するコンテンツが見つかりません');
        return;
      }
      
      console.log('Content found, length:', content.length);
      
      // 復元前に現在の記事を履歴に保存（エラーがあっても続行）
      if (charCount > 0) {
        console.log('Saving backup of current content...');
        try {
          const backupRes = await fetch(`/api/admin/videos/${videoId}/versions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: blocksToMarkdown(blocks),
              tone_type: 'backup',
              tone_label: '復元前のバックアップ'
            })
          });
          console.log('Backup response status:', backupRes.status);
        } catch (backupError) {
          console.warn('Backup failed, but continuing with restore:', backupError);
        }
      }
      
      // モーダルを先に閉じる
      setShowHistoryModal(false);
      
      // 記事を復元 - 新しいIDを生成して強制的に再レンダリング
      console.log('Parsing markdown to blocks...');
      const newBlocks = markdownToBlocks(content).map(block => ({
        ...block,
        id: crypto.randomUUID() // 新しいIDを生成
      }));
      console.log('Parsed blocks count:', newBlocks.length);
      console.log('First block content:', newBlocks[0]?.content?.substring(0, 50));
      
      // 一度空にしてから設定（強制再レンダリング）
      setBlocks([]);
      
      // 次のレンダリングサイクルで新しいブロックを設定
      setTimeout(() => {
        console.log('Setting new blocks...');
        setBlocks(newBlocks);
        setHasChanges(true);
        setSuccess('履歴を復元しました');
        setTimeout(() => setSuccess(null), 3000);
        console.log('=== Restore complete! ===');
      }, 50);
      
      // バージョン一覧を再取得
      fetchVersions();
      
    } catch (e) { 
      console.error('Restore error:', e);
      setError('復元に失敗しました'); 
    }
  };

  const formatDate = (s: string) => new Date(s).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const getYouTubeId = (url: string) => url?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([^&?]+)/)?.[1] || null;

  const getMinRows = (type: Block['type']) => {
    switch (type) {
      case 'heading2': return 2;
      case 'heading3': return 2;
      case 'quote': return 4;
      case 'code': return 6;
      case 'bullet':
      case 'numbered': return 2;
      default: return 4;
    }
  };

  if (!profile) return <div className="min-h-screen bg-white flex items-center justify-center"><p className="text-gray-500">ログインが必要です</p></div>;
  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
  if (error && !video) return <div className="min-h-screen bg-white flex items-center justify-center"><p className="text-red-600">{error}</p></div>;

  return (
    <div className="min-h-screen bg-white flex">
      {/* AIアシスタントパネル */}
      {showAIPanel && (
        <>
          <div 
            className="flex flex-col bg-gray-50 shrink-0 relative"
            style={{ width: panelWidth }}
          >
            <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-green-600" />
                <span className="font-semibold">AIアシスタント</span>
              </div>
              <button onClick={() => setShowAIPanel(false)} className="p-1 hover:bg-gray-100 rounded">
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            <div className="flex border-b border-gray-200 bg-white">
              <button onClick={() => setAiMode('generate')} className={`flex-1 py-3 text-sm font-medium border-b-2 transition ${aiMode === 'generate' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500'}`}>
                <FileText className="w-4 h-4 inline mr-1" />下書き生成
              </button>
              <button onClick={() => setAiMode('chat')} className={`flex-1 py-3 text-sm font-medium border-b-2 transition ${aiMode === 'chat' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500'}`}>
                <MessageSquare className="w-4 h-4 inline mr-1" />AIと相談
              </button>
            </div>

            {aiMode === 'generate' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* 【修正1】YouTubeボタンを目立つように */}
                {video?.video_url && (
                  <a 
                    href={video.video_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="block p-4 bg-red-50 rounded-xl border-2 border-red-200 hover:border-red-400 hover:bg-red-100 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-red-700 transition">
                        <Youtube className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-red-700 mb-1">YouTubeで開く</p>
                        <p className="text-xs text-red-600 mb-1">文字起こしをコピーしてください</p>
                        <p className="text-xs text-gray-600 truncate">{video.title}</p>
                      </div>
                      <ExternalLink className="w-5 h-5 text-red-400 flex-shrink-0 group-hover:text-red-600" />
                    </div>
                  </a>
                )}

                {!isChrome && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start gap-2">
                      <Chrome className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">Google Chromeをお使いください</p>
                        <p className="text-xs text-amber-700 mt-1">文字起こしの自動取得にはChrome拡張機能が必要です</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 【修正2】Chrome Web Storeボタンを目立つように */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Download className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-blue-800">拡張機能をインストール</p>
                      <p className="text-xs text-blue-700 mt-1 mb-3">YouTube Summary with ChatGPTで文字起こしを簡単にコピーできます</p>
                      <a 
                        href="https://chrome.google.com/webstore/detail/youtube-summary-with-chat/nmmicjeknamkfloonkhhcjmomieiodli" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                      >
                        <Chrome className="w-4 h-4" />
                        Chrome Web Storeで入手
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* 【修正3, 7】文字起こしエリア改善 */}
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">文字起こし</h4>
                    <div className="flex items-center gap-2">
                      {hasTranscript && (
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          {transcriptCharCount.toLocaleString()}字
                        </span>
                      )}
                      <button 
                        onClick={() => setTranscriptExpanded(!transcriptExpanded)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title={transcriptExpanded ? '折りたたむ' : '展開する'}
                      >
                        {transcriptExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <textarea 
                    value={transcript} 
                    onChange={(e) => { setTranscript(e.target.value); setHasChanges(true); }} 
                    placeholder="YouTubeの文字起こしをここに貼り付け" 
                    className={`w-full p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none transition-all ${
                      transcriptExpanded ? 'h-64' : 'h-24'
                    }`}
                  />
                  <p className="text-xs text-gray-400 mt-2">※ 文字起こしは下書き保存時に自動保存されます</p>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">トンマナを選択</h4>
                  <div className="space-y-2">
                    {TONE_OPTIONS.map((tone) => (
                      <button key={tone.id} onClick={() => setSelectedTone(tone.id as any)} className={`w-full p-3 rounded-lg border-2 text-left transition ${selectedTone === tone.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{tone.icon}</span>
                            <span className="font-medium">{tone.label}</span>
                          </div>
                          <span className="text-xs text-gray-500">{tone.chars}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-8">{tone.desc}</p>
                        <div className="flex items-center gap-1 mt-2 ml-8 group relative">
                          <span className="text-xs text-gray-500">¥{tone.cost.jpy}/回</span>
                          <HelpCircle className="w-3 h-3 text-gray-400" />
                          <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                            1回の生成あたりにかかる費用
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 【修正8】生成ボタン + キャンセル + プログレス */}
                {aiLoading ? (
                  <div className="space-y-3">
                    <div className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium flex flex-col items-center justify-center gap-2">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>生成中...</span>
                      </div>
                      <div className="w-3/4 h-1 bg-white/30 rounded-full overflow-hidden">
                        <div className="h-full bg-white rounded-full animate-pulse" style={{ width: '60%' }} />
                      </div>
                      <span className="text-xs text-white/80">約30秒かかります</span>
                    </div>
                    <button 
                      onClick={handleCancelGenerate}
                      className="w-full py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
                    >
                      キャンセル
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={handleGenerateArticle} 
                    disabled={!hasTranscript} 
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    下書きを生成（¥{TONE_OPTIONS.find(t => t.id === selectedTone)?.cost.jpy}）
                  </button>
                )}

                {!hasTranscript && <p className="text-xs text-amber-600 text-center">⚠️ 文字起こしを入力してください</p>}
                {blocks.length > 1 && charCount > 0 && (
                  <p className="text-xs text-blue-600 text-center flex items-center justify-center gap-1">
                    <Info className="w-3 h-3" />
                    現在の記事は、履歴に残りいつでも復元できます
                  </p>
                )}
              </div>
            )}

            {/* 【修正4】AIと相談タブ - 入力欄を上部に */}
            {aiMode === 'chat' && (
              <div className="flex-1 flex flex-col">
                {/* 入力欄を上部に配置 */}
                <div className="p-4 border-b border-gray-200 bg-white">
                  <textarea 
                    value={chatInput} 
                    onChange={(e) => setChatInput(e.target.value)} 
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }} 
                    placeholder="AIに質問や相談を入力してください&#10;例: タイトル案を3つ考えて" 
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500" 
                    rows={3} 
                  />
                  <button 
                    onClick={handleSendChat} 
                    disabled={!chatInput.trim() || aiLoading} 
                    className="mt-2 w-full py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    送信
                  </button>
                </div>
                
                {/* チャット履歴 */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">まだ会話がありません</p>
                      <p className="text-xs mt-2">上の入力欄から質問してください</p>
                    </div>
                  ) : chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-xl px-4 py-2 text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-green-600 text-white' : 'bg-white border border-gray-200'}`}>{msg.content}</div>
                    </div>
                  ))}
                  {aiLoading && <div className="flex justify-start"><div className="bg-white border border-gray-200 rounded-xl px-4 py-2"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div></div>}
                </div>
              </div>
            )}
          </div>
          
          {/* 【修正5】リサイズハンドル */}
          <div
            ref={resizeRef}
            onMouseDown={handleMouseDown}
            className="w-2 bg-gray-200 hover:bg-blue-400 cursor-col-resize flex items-center justify-center transition-colors group"
          >
            <GripVertical className="w-3 h-3 text-gray-400 group-hover:text-white" />
          </div>
        </>
      )}

      {/* メインエリア */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 【修正6, 12】ヘッダー改善 */}
        <header className="sticky top-0 bg-white border-b border-gray-200 z-20">
          <div className="flex items-center justify-between px-4 py-3">
            {/* 左端: AI + 閉じる */}
            <div className="flex items-center gap-3">
              {!showAIPanel && (
                <button onClick={() => setShowAIPanel(true)} className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition">
                  <Sparkles className="w-4 h-4" /><span className="text-sm font-medium">AI</span>
                </button>
              )}
              {/* 【修正6】保存して閉じる */}
              <button 
                onClick={handleCloseClick}
                className="text-gray-600 hover:text-gray-900 text-sm flex items-center gap-1"
              >
                {hasChanges && <span className="w-2 h-2 bg-orange-400 rounded-full" />}
                {hasChanges ? '閉じる' : '閉じる'}
              </button>
            </div>
            
            {/* 中央: ステータス表示 */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {lastSaved && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {lastSaved.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <span>{charCount.toLocaleString()} 文字</span>
              {hasChanges && <span className="text-orange-500 text-xs">未保存</span>}
            </div>
            
            {/* 右端: アクションボタン */}
            <div className="flex items-center gap-3">
              <button onClick={() => setShowPreviewModal(true)} className="p-2 hover:bg-gray-100 rounded-lg" title="プレビュー">
                <Eye className="w-5 h-5 text-gray-600" />
              </button>
              
              {/* 【修正12】設定アイコンに変更 */}
              <div className="relative">
                <button onClick={() => setShowMoreMenu(!showMoreMenu)} className="p-2 hover:bg-gray-100 rounded-lg" title="設定">
                  <Settings className="w-5 h-5 text-gray-600" />
                </button>
                
                {showMoreMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-2xl py-2 z-50">
                      <button onClick={() => { setShowHistoryModal(true); setShowMoreMenu(false); }} className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <History className="w-4 h-4" />変更履歴
                      </button>
                      <button className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2">
                        <Trash2 className="w-4 h-4" />削除
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button onClick={() => handleSave(false)} disabled={saving} className="px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}下書き保存
              </button>
              
              <button onClick={() => setShowPublishModal(true)} disabled={charCount < 100} className="px-4 py-2 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                公開に進む
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-8">
            {/* 【修正11】カバー画像 - コスト表示を大きく */}
            <div className="mb-8">
              {generatingCover ? (
                <div className="w-full aspect-[2/1] border-2 border-dashed border-purple-300 bg-purple-50 rounded-xl flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
                  <p className="text-purple-700 font-medium">Flux 1.1 Pro で高品質カバー画像を生成中...</p>
                  <p className="text-purple-500 text-sm">15〜30秒</p>
                </div>
              ) : coverUrl ? (
                <div className="relative group">
                  <img src={coverUrl} alt="カバー画像" className="w-full aspect-[2/1] object-cover rounded-xl" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-4">
                    <button onClick={() => coverInputRef.current?.click()} className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium">変更</button>
                    <button onClick={() => { setCoverUrl(null); setHasChanges(true); }} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium">削除</button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <button onClick={() => setShowCoverMenu(!showCoverMenu)} className="w-full aspect-[3/1] border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-gray-400 hover:bg-gray-50 transition">
                    <ImageIcon className="w-10 h-10 text-gray-400" />
                    <span className="text-gray-500">カバー画像を追加</span>
                  </button>
                  
                  {showCoverMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowCoverMenu(false)} />
                      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl py-2 z-50">
                        <button onClick={() => { coverInputRef.current?.click(); setShowCoverMenu(false); }} className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3">
                          <Upload className="w-5 h-5 text-gray-600" />
                          <div>
                            <span className="font-medium">画像をアップロード</span>
                            <p className="text-xs text-gray-500">自分の画像を使用</p>
                          </div>
                        </button>
                        <button onClick={handleGenerateCover} className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3">
                          <Wand2 className="w-5 h-5 text-purple-600" />
                          <div className="flex-1">
                            <span className="font-medium">AIで画像を生成</span>
                            <p className="text-xs text-gray-500">Flux 1.1 Pro で自動生成</p>
                          </div>
                          {/* 【修正11】コスト表示を大きく */}
                          <span className="text-lg font-bold text-purple-600">¥{COVER_IMAGE_COST.jpy}</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
              <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">{video?.title || '記事タイトル'}</h1>

            {/* ブロックエディタ */}
            <div className="space-y-1">
              {blocks.map((block, index) => (
                <div key={block.id} className="group relative">
                  <div className="absolute -left-14 top-3">
                    <div className="relative">
                      <button onClick={(e) => { e.stopPropagation(); setShowInsertMenu(showInsertMenu === block.id ? null : block.id); setHoveredMenuItem(null); }} className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                        <Plus className="w-4 h-4" />
                      </button>
                      
                      {showInsertMenu === block.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => { setShowInsertMenu(null); setHoveredMenuItem(null); }} />
                          <div className="absolute left-10 top-0 flex gap-3 z-50">
                            <div className="w-56 bg-white border border-gray-200 rounded-xl shadow-2xl py-2 max-h-[70vh] overflow-y-auto">
                              <p className="px-4 py-2 text-xs text-gray-500 font-medium border-b border-gray-100 mb-1">挿入</p>
                              {INSERT_MENU_ITEMS.map(item => (
                                <button key={item.type} onClick={(e) => { e.stopPropagation(); insertBlock(block.id, item.type as Block['type']); }} onMouseEnter={() => setHoveredMenuItem(item.type)} onMouseLeave={() => setHoveredMenuItem(null)} className={`w-full px-4 py-3 text-left flex items-center gap-3 text-sm transition-colors ${hoveredMenuItem === item.type ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}>
                                  <item.icon className={`w-5 h-5 ${hoveredMenuItem === item.type ? 'text-blue-600' : 'text-gray-500'}`} />
                                  <span className="font-medium">{item.label}</span>
                                </button>
                              ))}
                            </div>
                            
                            {hoveredMenuItem && (
                              <div className="w-72 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden">
                                {INSERT_MENU_ITEMS.filter(item => item.type === hoveredMenuItem).map(item => (
                                  <div key={item.type}>
                                    <div className="p-4 border-b border-gray-100">
                                      <p className="text-sm text-gray-700 leading-relaxed">{item.description}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50">
                                      {item.showImageExample && (
                                        <div className="bg-white rounded-lg border border-gray-200 p-3">
                                          <div className="w-full h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center mb-2">
                                            <ImageIcon className="w-8 h-8 text-gray-400" />
                                          </div>
                                          <p className="text-xs text-gray-500 text-center">画像のキャプションを入力</p>
                                        </div>
                                      )}
                                      {item.showDividerExample && (
                                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                                          <div className="space-y-3">
                                            <p className="text-xs text-gray-500">セクション1の内容...</p>
                                            <hr className="border-gray-300" />
                                            <p className="text-xs text-gray-500">セクション2の内容...</p>
                                          </div>
                                        </div>
                                      )}
                                      {item.exampleTitle && (
                                        <div className="bg-white rounded-lg border border-gray-200 p-3">
                                          <p className={`font-bold text-gray-900 mb-2 ${item.type === 'heading2' ? 'text-lg' : item.type === 'heading3' ? 'text-base' : 'text-sm'}`}>{item.exampleTitle}</p>
                                          {item.exampleContent && (
                                            <div className={`text-xs text-gray-600 whitespace-pre-line ${item.type === 'quote' ? 'pl-3 border-l-2 border-blue-300 italic' : item.type === 'code' ? 'font-mono bg-gray-100 p-2 rounded' : item.type === 'bullet' || item.type === 'numbered' ? 'pl-2' : ''}`}>{item.exampleContent}</div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {block.type === 'divider' ? (
                    <div className="py-6"><hr className="border-gray-300" /></div>
                  ) : block.type === 'image' ? (
                    <div className="py-4">
                      {block.imageUrl ? <img src={block.imageUrl} alt={block.content} className="max-w-full rounded-lg" /> : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 hover:bg-gray-50 transition cursor-pointer">
                          <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">クリックして画像をアップロード</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <textarea
                      ref={el => { blockRefs.current[block.id] = el; }}
                      value={block.content}
                      onChange={(e) => updateBlock(block.id, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, block)}
                      placeholder={
                        block.type === 'heading2' ? '大見出しを入力...' :
                        block.type === 'heading3' ? '小見出しを入力...' :
                        block.type === 'quote' ? '引用文を入力...' :
                        block.type === 'code' ? 'コードを入力...' :
                        block.type === 'bullet' ? '箇条書きの項目を入力...' :
                        block.type === 'numbered' ? '番号付きリストの項目を入力...' :
                        index === 0 && blocks.length === 1 ? '本文を入力してください。Enterキーで新しいブロックを追加できます。' : '続きを入力...'
                      }
                      className={`w-full resize-none bg-transparent outline-none placeholder-gray-400 ${
                        block.type === 'heading2' ? 'text-2xl font-bold py-4 leading-tight min-h-[3rem]' :
                        block.type === 'heading3' ? 'text-xl font-semibold py-3 leading-tight min-h-[2.5rem]' :
                        block.type === 'quote' ? 'text-gray-600 italic border-l-4 border-blue-300 pl-4 py-4 bg-blue-50/50 rounded-r-lg leading-relaxed min-h-[6rem]' :
                        block.type === 'bullet' ? 'pl-6 py-3 leading-relaxed min-h-[3rem]' :
                        block.type === 'numbered' ? 'pl-6 py-3 leading-relaxed min-h-[3rem]' :
                        block.type === 'code' ? 'font-mono text-sm bg-gray-100 p-4 rounded-lg leading-relaxed min-h-[8rem]' :
                        'py-3 text-gray-800 leading-relaxed min-h-[6rem]'
                      }`}
                      rows={getMinRows(block.type)}
                      style={{ minHeight: block.type === 'paragraph' ? '100px' : block.type === 'quote' ? '100px' : block.type === 'code' ? '150px' : '60px' }}
                      onInput={(e) => {
                        const t = e.target as HTMLTextAreaElement;
                        t.style.height = 'auto';
                        const minHeight = block.type === 'paragraph' ? 100 : block.type === 'quote' ? 100 : block.type === 'code' ? 150 : 60;
                        t.style.height = Math.max(t.scrollHeight, minHeight) + 'px';
                      }}
                    />
                  )}
                  
                  {block.type !== 'paragraph' && block.type !== 'divider' && (
                    <div className="absolute -left-14 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs text-gray-400">{block.type === 'heading2' ? 'H2' : block.type === 'heading3' ? 'H3' : block.type === 'bullet' ? '•' : block.type === 'numbered' ? '1.' : block.type === 'quote' ? '"' : block.type === 'code' ? '</>' : block.type === 'image' ? '🖼' : ''}</span>
                    </div>
                  )}
                </div>
              ))}

              <div className="py-6">
                <button onClick={() => { const lastBlock = blocks[blocks.length - 1]; insertBlock(lastBlock.id, 'paragraph'); }} className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-400 hover:text-gray-600 hover:border-gray-400 shadow-sm transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* モーダル類 */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
              <h3 className="text-lg font-bold text-gray-900">プレビュー</h3>
              <button onClick={() => setShowPreviewModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {coverUrl && <img src={coverUrl} alt="カバー" className="w-full aspect-[2/1] object-cover rounded-xl mb-6" />}
              <h1 className="text-2xl font-bold text-gray-900 mb-6">{video?.title}</h1>
              {tags.length > 0 && <div className="flex flex-wrap gap-2 mb-6">{tags.map(tag => <span key={tag} className="text-sm text-blue-600">#{tag}</span>)}</div>}
              <div className="prose prose-gray max-w-none">
                {blocks.map(block => {
                  if (block.type === 'heading2') return <h2 key={block.id} className="text-xl font-bold mt-6 mb-3">{block.content}</h2>;
                  if (block.type === 'heading3') return <h3 key={block.id} className="text-lg font-semibold mt-4 mb-2">{block.content}</h3>;
                  if (block.type === 'bullet') return <li key={block.id} className="ml-4">{block.content}</li>;
                  if (block.type === 'numbered') return <li key={block.id} className="ml-4 list-decimal">{block.content}</li>;
                  if (block.type === 'quote') return <blockquote key={block.id} className="border-l-4 border-blue-300 pl-4 py-2 bg-blue-50 rounded-r-lg italic text-gray-600">{block.content}</blockquote>;
                  if (block.type === 'code') return <pre key={block.id} className="bg-gray-100 p-4 rounded-lg overflow-x-auto"><code className="text-sm">{block.content}</code></pre>;
                  if (block.type === 'divider') return <hr key={block.id} className="my-6" />;
                  if (block.type === 'image' && block.imageUrl) return <img key={block.id} src={block.imageUrl} alt={block.content} className="rounded-lg my-4" />;
                  return <p key={block.id} className="mb-4 leading-relaxed">{block.content}</p>;
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 【修正9】履歴モーダル - プレビュー表示追加 */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">変更履歴</h3>
              <button onClick={() => setShowHistoryModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {loadingVersions ? (
                <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></div>
              ) : versions.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">履歴がありません</p>
                  <p className="text-xs text-gray-400 mt-1">AIで下書きを生成すると履歴が保存されます</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {versions.map((v) => (
                    <div key={v.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{v.tone_label}</span>
                        <button onClick={() => handleRestoreVersion(v.id)} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"><RotateCcw className="w-4 h-4" />復元</button>
                      </div>
                      <div className="text-sm text-gray-500 mb-2">{formatDate(v.created_at)} · {v.char_count.toLocaleString()}文字</div>
                      {/* 【修正9】プレビュー表示 */}
                      {v.content && (
                        <p className="text-xs text-gray-400 line-clamp-2 bg-white p-2 rounded border border-gray-100">
                          {v.content.replace(/^#+ /gm, '').replace(/\n/g, ' ').substring(0, 100)}...
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showPublishModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">公開設定</h3>
                <button onClick={() => setShowPublishModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">ハッシュタグ</h4>
                <div className="border border-gray-300 rounded-lg p-3">
                  <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput); } }} placeholder="ハッシュタグを追加" className="w-full outline-none text-gray-700" />
                </div>
                {tags.length > 0 && <div className="flex flex-wrap gap-2 mt-3">{tags.map(tag => (<span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">#{tag}<button onClick={() => removeTag(tag)}><X className="w-3 h-3" /></button></span>))}</div>}
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">おすすめタグ</p>
                  <div className="flex flex-wrap gap-2">{SUGGESTED_TAGS.filter(t => !tags.includes(t)).map(tag => (<button key={tag} onClick={() => addTag(tag)} className="px-3 py-1 border border-gray-300 text-gray-600 rounded-full text-sm hover:border-gray-400 hover:bg-gray-50">#{tag}</button>))}</div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-2">プレビュー</p>
                <div className="flex gap-4">
                  {coverUrl && <img src={coverUrl} alt="" className="w-24 h-16 object-cover rounded-lg" />}
                  <div>
                    <h5 className="font-medium text-gray-900 line-clamp-2">{video?.title}</h5>
                    <p className="text-xs text-gray-500 mt-1">{charCount.toLocaleString()}文字</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button onClick={() => setShowPublishModal(false)} className="flex-1 px-4 py-3 border border-gray-300 rounded-full text-gray-700 font-medium hover:bg-gray-50">キャンセル</button>
              <button onClick={handlePublish} disabled={publishing} className="flex-1 px-4 py-3 bg-green-600 text-white rounded-full font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">{publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}投稿する</button>
            </div>
          </div>
        </div>
      )}

      {/* 【修正6】未保存確認ダイアログ */}
      {showUnsavedDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">変更が保存されていません</h3>
            <p className="text-gray-600 mb-6">保存せずに閉じると、変更内容が失われます。</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowUnsavedDialog(false)} 
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button 
                onClick={() => { setShowUnsavedDialog(false); router.push('/admin/contents'); }} 
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                保存せず閉じる
              </button>
              <button 
                onClick={() => { setShowUnsavedDialog(false); handleSaveAndClose(); }} 
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                保存して閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 【修正10】成功/エラートースト（右下に表示） */}
      {success && <Toast message={success} type="success" onClose={() => setSuccess(null)} />}
      {error && <Toast message={error} type="error" onClose={() => setError(null)} />}

      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
