'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  Search,
  Filter,
  ChevronDown,
  FileText,
  Paperclip,
  Image,
  ExternalLink,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Play
} from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface VideoContent {
  video_id: string;
  title: string;
  thumbnail_url: string | null;
  video_url: string;
  article_content: string | null;
  category_id: number;
  duration: number | null;
  categories: Category | null;
  resource_count: number;
}

type CategoryFilter = 'all' | 'kagaku' | 'taizen' | 'sanbo';
type StatusFilter = 'all' | 'article-pending' | 'resource-pending' | 'complete';

export default function AdminContentsPage() {
  const [videos, setVideos] = useState<VideoContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, []);

  // メニュー外クリックで閉じる
  useEffect(() => {
    const handleClick = () => {
      setShowCategoryMenu(false);
      setShowStatusMenu(false);
    };
    if (showCategoryMenu || showStatusMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [showCategoryMenu, showStatusMenu]);

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

  // 統計
  const stats = useMemo(() => {
    const total = videos.length;
    const articleDone = videos.filter(v => v.article_content && v.article_content.trim()).length;
    const resourceDone = videos.filter(v => v.resource_count > 0).length;
    const complete = videos.filter(v => 
      (v.article_content && v.article_content.trim()) && v.resource_count > 0
    ).length;

    return {
      total,
      articleDone,
      articlePending: total - articleDone,
      resourceDone,
      resourcePending: total - resourceDone,
      complete,
      incomplete: total - complete
    };
  }, [videos]);

  // カテゴリ別統計
  const categoryStats = useMemo(() => {
    const categories = [
      { slug: 'kagaku', name: '起業の科学', id: 1 },
      { slug: 'taizen', name: '起業大全', id: 2 },
      { slug: 'sanbo', name: '起業参謀', id: 3 },
    ];

    return categories.map(cat => {
      const catVideos = videos.filter(v => v.category_id === cat.id);
      const total = catVideos.length;
      const articleDone = catVideos.filter(v => v.article_content && v.article_content.trim()).length;
      const resourceDone = catVideos.filter(v => v.resource_count > 0).length;
      
      return {
        ...cat,
        total,
        articleDone,
        resourceDone,
        articlePercent: total > 0 ? Math.round((articleDone / total) * 100) : 0,
        resourcePercent: total > 0 ? Math.round((resourceDone / total) * 100) : 0,
      };
    });
  }, [videos]);

  // フィルター済み動画
  const filteredVideos = useMemo(() => {
    let result = [...videos];

    // 検索フィルター
    if (searchQuery) {
      result = result.filter(v => 
        v.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // カテゴリフィルター
    if (categoryFilter !== 'all') {
      const categoryIdMap: Record<string, number> = {
        'kagaku': 1,
        'taizen': 2,
        'sanbo': 3,
      };
      result = result.filter(v => v.category_id === categoryIdMap[categoryFilter]);
    }

    // 状態フィルター
    switch (statusFilter) {
      case 'article-pending':
        result = result.filter(v => !v.article_content || !v.article_content.trim());
        break;
      case 'resource-pending':
        result = result.filter(v => v.resource_count === 0);
        break;
      case 'complete':
        result = result.filter(v => 
          (v.article_content && v.article_content.trim()) && v.resource_count > 0
        );
        break;
    }

    return result;
  }, [videos, searchQuery, categoryFilter, statusFilter]);

  const categoryLabels: Record<CategoryFilter, string> = {
    'all': 'すべてのカテゴリ',
    'kagaku': '起業の科学',
    'taizen': '起業大全',
    'sanbo': '起業参謀',
  };

  const statusLabels: Record<StatusFilter, string> = {
    'all': 'すべての状態',
    'article-pending': '記事なし',
    'resource-pending': '資料なし',
    'complete': '完了',
  };

  const getYouTubeId = (url: string | null): string | null => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match ? match[1] : null;
  };

  const getYouTubeThumbnail = (videoUrl: string): string => {
    const id = getYouTubeId(videoUrl);
    if (id) return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
    return '/placeholder-video.png';
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">コンテンツ管理</h1>
          <p className="text-gray-500 mt-1">動画コンテンツの記事・資料を管理</p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Play className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">総動画数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">記事完了</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.articleDone}
                  <span className="text-sm font-normal text-gray-400 ml-1">
                    ({Math.round((stats.articleDone / stats.total) * 100)}%)
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Paperclip className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">資料完了</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.resourceDone}
                  <span className="text-sm font-normal text-gray-400 ml-1">
                    ({Math.round((stats.resourceDone / stats.total) * 100)}%)
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">両方完了</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.complete}
                  <span className="text-sm font-normal text-gray-400 ml-1">
                    ({Math.round((stats.complete / stats.total) * 100)}%)
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* カテゴリ別進捗 */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">カテゴリ別進捗</h3>
          <div className="space-y-3">
            {categoryStats.map(cat => (
              <div key={cat.slug} className="flex items-center gap-4">
                <div className="w-24 text-sm text-gray-700 truncate">{cat.name}</div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${cat.articlePercent}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-16">記事 {cat.articlePercent}%</span>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${cat.resourcePercent}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-16">資料 {cat.resourcePercent}%</span>
                </div>
                <span className="text-xs text-gray-400 w-12">{cat.total}本</span>
              </div>
            ))}
          </div>
        </div>

        {/* フィルター */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex flex-wrap items-center gap-4">
            {/* 検索 */}
            <div className="flex-1 min-w-[200px] max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="タイトルで検索..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* カテゴリフィルター */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowCategoryMenu(!showCategoryMenu); setShowStatusMenu(false); }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                <Filter className="w-4 h-4" />
                {categoryLabels[categoryFilter]}
                <ChevronDown className="w-4 h-4" />
              </button>
              {showCategoryMenu && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[180px]" onClick={(e) => e.stopPropagation()}>
                  {(Object.keys(categoryLabels) as CategoryFilter[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => { setCategoryFilter(key); setShowCategoryMenu(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                        categoryFilter === key ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700'
                      }`}
                    >
                      {categoryLabels[key]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 状態フィルター */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowStatusMenu(!showStatusMenu); setShowCategoryMenu(false); }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                {statusLabels[statusFilter]}
                <ChevronDown className="w-4 h-4" />
              </button>
              {showStatusMenu && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[160px]" onClick={(e) => e.stopPropagation()}>
                  {(Object.keys(statusLabels) as StatusFilter[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => { setStatusFilter(key); setShowStatusMenu(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                        statusFilter === key ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700'
                      }`}
                    >
                      {statusLabels[key]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 件数表示 */}
            <div className="text-sm text-gray-500">
              {filteredVideos.length}件表示
            </div>
          </div>
        </div>

        {/* テーブル */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    動画
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    カテゴリ
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    記事
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    資料
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredVideos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                      該当する動画がありません
                    </td>
                  </tr>
                ) : (
                  filteredVideos.map((video) => {
                    const hasArticle = !!(video.article_content && video.article_content.trim());
                    const hasResources = video.resource_count > 0;
                    
                    return (
                      <tr key={video.video_id} className="hover:bg-gray-50">
                        {/* 動画情報 */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-20 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                              <img
                                src={video.thumbnail_url || getYouTubeThumbnail(video.video_url)}
                                alt={video.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                {video.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDuration(video.duration)}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* カテゴリ */}
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {video.categories?.name || '-'}
                          </span>
                        </td>

                        {/* 記事 */}
                        <td className="px-4 py-3 text-center">
                          {hasArticle ? (
                            <span className="inline-flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-xs">あり</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-gray-400">
                              <XCircle className="w-4 h-4" />
                              <span className="text-xs">なし</span>
                            </span>
                          )}
                        </td>

                        {/* 資料 */}
                        <td className="px-4 py-3 text-center">
                          {hasResources ? (
                            <span className="inline-flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-xs">{video.resource_count}件</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-gray-400">
                              <XCircle className="w-4 h-4" />
                              <span className="text-xs">なし</span>
                            </span>
                          )}
                        </td>

                        {/* 操作 */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <Link
                              href={`/admin/videos/${video.video_id}/article`}
                              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title="記事編集"
                            >
                              <FileText className="w-4 h-4" />
                            </Link>
                            <Link
                              href={`/admin/videos/${video.video_id}/resources`}
                              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title="資料管理"
                            >
                              <Paperclip className="w-4 h-4" />
                            </Link>
                            <Link
                              href={`/videos/${video.video_id}`}
                              target="_blank"
                              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title="動画を見る"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
