'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft, 
  FileText, 
  Paperclip,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  ChevronDown,
  Play
} from 'lucide-react';

interface VideoContent {
  video_id: string;
  title: string;
  thumbnail_url: string | null;
  custom_thumbnail_url: string | null;
  video_url: string;
  article_content: string | null;
  resource_count: number;
}

type SortType = 'title-asc' | 'title-desc' | 'default';
type FilterType = 'all' | 'article-done' | 'article-pending' | 'thumbnail-done' | 'thumbnail-pending' | 'resource-done' | 'resource-pending';

export default function AdminContentsPage() {
  const { profile } = useAuth();
  const [videos, setVideos] = useState<VideoContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState<SortType>('default');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, []);

  // メニュー外クリックで閉じる
  useEffect(() => {
    const handleClick = () => {
      setShowFilterMenu(false);
      setShowSortMenu(false);
    };
    if (showFilterMenu || showSortMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [showFilterMenu, showSortMenu]);

  const fetchVideos = async () => {
    try {
      const res = await fetch('/api/admin/contents');
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

  const getYouTubeId = (url: string | null): string | null => {
    if (!url) return null; const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match ? match[1] : null;
  };

  const getYouTubeThumbnail = (videoUrl: string | null): string => {
    const id = getYouTubeId(videoUrl);
    if (id) return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
    return '/placeholder-video.png';
  };

  // 統計
  const stats = useMemo(() => ({
    total: videos.length,
    articleDone: videos.filter(v => v.article_content && v.article_content.trim()).length,
    articlePending: videos.filter(v => !v.article_content || !v.article_content.trim()).length,
    thumbnailDone: videos.filter(v => v.custom_thumbnail_url).length,
    thumbnailPending: videos.filter(v => !v.custom_thumbnail_url).length,
    resourceDone: videos.filter(v => v.resource_count > 0).length,
    resourcePending: videos.filter(v => v.resource_count === 0).length,
  }), [videos]);

  // フィルター＆ソート済み動画
  const filteredAndSortedVideos = useMemo(() => {
    let result = [...videos];

    // 検索フィルター
    if (searchQuery) {
      result = result.filter(v => 
        v.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // フィルター
    switch (filterType) {
      case 'article-done':
        result = result.filter(v => v.article_content && v.article_content.trim());
        break;
      case 'article-pending':
        result = result.filter(v => !v.article_content || !v.article_content.trim());
        break;
      case 'thumbnail-done':
        result = result.filter(v => v.custom_thumbnail_url);
        break;
      case 'thumbnail-pending':
        result = result.filter(v => !v.custom_thumbnail_url);
        break;
      case 'resource-done':
        result = result.filter(v => v.resource_count > 0);
        break;
      case 'resource-pending':
        result = result.filter(v => v.resource_count === 0);
        break;
    }

    // ソート
    if (sortType === 'title-asc') {
      result.sort((a, b) => a.title.localeCompare(b.title, 'ja'));
    } else if (sortType === 'title-desc') {
      result.sort((a, b) => b.title.localeCompare(a.title, 'ja'));
    }

    return result;
  }, [videos, searchQuery, filterType, sortType]);

  const filterLabels: Record<FilterType, string> = {
    'all': 'すべて',
    'article-done': '記事あり',
    'article-pending': '記事なし',
    'thumbnail-done': 'サムネあり',
    'thumbnail-pending': 'サムネなし',
    'resource-done': '資料あり',
    'resource-pending': '資料なし',
  };

  const sortLabels: Record<SortType, string> = {
    'default': 'デフォルト',
    'title-asc': 'タイトル昇順 (A→Z)',
    'title-desc': 'タイトル降順 (Z→A)',
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/admin"
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            管理者ダッシュボードに戻る
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* タイトル＆統計 */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📁 コンテンツ管理</h1>
            <p className="text-gray-500">全{stats.total}件の動画</p>
          </div>
          <div className="bg-white rounded-xl px-4 py-3 shadow-sm flex items-center gap-3">
            <Play className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-xs text-gray-500">総動画数</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        {/* 検索＆フィルター＆ソート */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="p-4 flex flex-wrap items-center gap-4">
            {/* 検索 */}
            <div className="flex-1 min-w-[200px] max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="タイトルで検索..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* フィルター */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowFilterMenu(!showFilterMenu); setShowSortMenu(false); }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                <Filter className="w-4 h-4" />
                {filterLabels[filterType]}
                <ChevronDown className="w-4 h-4" />
              </button>
              {showFilterMenu && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[160px]" onClick={(e) => e.stopPropagation()}>
                  {(Object.keys(filterLabels) as FilterType[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => { setFilterType(key); setShowFilterMenu(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                        filterType === key ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      {filterLabels[key]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ソート */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowSortMenu(!showSortMenu); setShowFilterMenu(false); }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                {sortType === 'title-asc' ? <ArrowUp className="w-4 h-4" /> : 
                 sortType === 'title-desc' ? <ArrowDown className="w-4 h-4" /> : 
                 <ArrowUpDown className="w-4 h-4" />}
                {sortLabels[sortType]}
                <ChevronDown className="w-4 h-4" />
              </button>
              {showSortMenu && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[180px]" onClick={(e) => e.stopPropagation()}>
                  {(Object.keys(sortLabels) as SortType[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => { setSortType(key); setShowSortMenu(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                        sortType === key ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      {sortLabels[key]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 結果件数 */}
          <div className="px-4 pb-3 text-sm text-gray-500">
            {filteredAndSortedVideos.length}件表示
          </div>
        </div>

        {/* 動画一覧 */}
        <div className="space-y-4">
          {filteredAndSortedVideos.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500">
              該当する動画がありません
            </div>
          ) : (
            filteredAndSortedVideos.map((video) => {
              const hasArticle = !!(video.article_content && video.article_content.trim());
              const hasThumbnail = !!video.custom_thumbnail_url;
              const hasResources = video.resource_count > 0;
              
              return (
                <div key={video.video_id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="flex items-start gap-4 p-4">
                    {/* サムネイル */}
                    <div className="w-40 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={video.custom_thumbnail_url || video.thumbnail_url || getYouTubeThumbnail(video.video_url)}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* 情報 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 mb-2">{video.title}</h3>
                      <Link 
                        href={`/videos/${video.video_id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 mb-3"
                      >
                        <span>動画詳細ページで確認</span>
                        <span>↗</span>
                      </Link>

                      {/* アクションボタン */}
                      <div className="flex gap-3">
                        <Link
                          href={`/admin/videos/${video.video_id}/article`}
                          className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-lg border-2 transition ${
                            hasArticle 
                              ? 'border-green-200 bg-green-50 text-green-700' 
                              : 'border-gray-200 hover:border-gray-300 text-gray-600'
                          }`}
                        >
                          <FileText className="w-5 h-5" />
                          <span className="text-xs font-medium">記事編集</span>
                          <span className={`text-xs ${hasArticle ? 'text-green-600' : 'text-gray-400'}`}>
                            {hasArticle ? '✓ 作成済み' : '○ 未作成'}
                          </span>
                        </Link>

                        <Link
                          href={`/admin/videos/${video.video_id}/thumbnail`}
                          className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-lg border-2 transition ${
                            hasThumbnail 
                              ? 'border-green-200 bg-green-50 text-green-700' 
                              : 'border-gray-200 hover:border-gray-300 text-gray-600'
                          }`}
                        >
                          <span className="text-lg">🖼</span>
                          <span className="text-xs font-medium">サムネ変更</span>
                          <span className={`text-xs ${hasThumbnail ? 'text-green-600' : 'text-gray-400'}`}>
                            {hasThumbnail ? '✓ 設定済み' : '○ 未設定'}
                          </span>
                        </Link>

                        <Link
                          href={`/admin/videos/${video.video_id}/resources`}
                          className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-lg border-2 transition ${
                            hasResources 
                              ? 'border-green-200 bg-green-50 text-green-700' 
                              : 'border-gray-200 hover:border-gray-300 text-gray-600'
                          }`}
                        >
                          <Paperclip className="w-5 h-5" />
                          <span className="text-xs font-medium">{hasResources ? '資料編集' : '資料追加'}</span>
                          <span className={`text-xs ${hasResources ? 'text-green-600' : 'text-gray-400'}`}>
                            {hasResources ? `✓ ${video.resource_count}件追加` : '○ 未追加'}
                          </span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
