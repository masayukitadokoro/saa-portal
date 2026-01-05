'use client';

import { formatVideoTitle } from '@/lib/formatTitle';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Play, BookOpen, Lightbulb, BarChart3, TrendingUp, Rocket, ChevronRight, FileText, Eye, ArrowRight, Globe, Presentation } from 'lucide-react';

interface Video {
  video_id: string;
  title: string;
  thumbnail_url?: string;
  custom_thumbnail_url?: string;
  video_url?: string;
  view_count?: number;
  display_order?: number;
  duration?: string;
  summary?: string;
  script_text?: string;
  category_id?: string;
  created_at?: string;
  article_content?: string;
}

interface Article {
  video_id: string;
  title: string;
  summary?: string;
  article_content?: string;
  article_cover_url?: string;
  thumbnail_url?: string;
  custom_thumbnail_url?: string;
  video_url?: string;
  view_count?: number;
  display_order?: number;
  created_at?: string;
}

// 検索キーワード
const searchKeywords = ['PMF', 'ビジネスモデル', 'マーケットサイズ', 'ピッチ', 'スタートアップ', '資金調達'];

// 動画カテゴリ設定
const videoCategoryConfig: Record<string, { 
  name: string; 
  description: string;
  color: string; 
  bgColor: string; 
  borderColor: string; 
  icon: React.ReactNode;
  enabled: boolean;
}> = {
  'startup-science': {
    name: '起業の科学',
    description: 'スタートアップの成功法則を科学的に解説',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-l-blue-500',
    icon: <Lightbulb className="w-5 h-5" />,
    enabled: true,
  },
  'business-model': {
    name: 'ビジネスモデル解体新書',
    description: '成功企業のビジネスモデルを徹底分析',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-l-purple-500',
    icon: <BarChart3 className="w-5 h-5" />,
    enabled: false,
  },
  'success-startup': {
    name: '成功スタートアップ解体新書',
    description: '成功スタートアップの戦略を解剖',
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-l-green-500',
    icon: <TrendingUp className="w-5 h-5" />,
    enabled: false,
  },
  'innovation-economy': {
    name: 'Innovation Economy Roundup',
    description: '最新のイノベーション経済動向',
    color: 'from-cyan-500 to-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-l-cyan-500',
    icon: <Globe className="w-5 h-5" />,
    enabled: false,
  },
  'pitch-analysis': {
    name: 'スタートアップピッチ徹底検証',
    description: 'ピッチの成功パターンを分析',
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-l-orange-500',
    icon: <Presentation className="w-5 h-5" />,
    enabled: false,
  },
};

// 記事カテゴリ設定
const articleCategoryConfig: Record<string, { 
  name: string; 
  description: string;
  color: string; 
  bgColor: string; 
  borderColor: string; 
  icon: React.ReactNode;
  enabled: boolean;
}> = {
  'startup-science': {
    name: '起業の科学',
    description: '起業の科学シリーズの解説記事',
    color: 'from-indigo-500 to-purple-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-l-indigo-500',
    icon: <FileText className="w-5 h-5" />,
    enabled: true,
  },
  'business-model': {
    name: 'ビジネスモデル解体新書',
    description: 'ビジネスモデル分析の解説記事',
    color: 'from-pink-500 to-rose-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-l-pink-500',
    icon: <FileText className="w-5 h-5" />,
    enabled: false,
  },
  'success-startup': {
    name: '成功スタートアップ解体新書',
    description: '成功事例の解説記事',
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-l-emerald-500',
    icon: <FileText className="w-5 h-5" />,
    enabled: false,
  },
};

type SortOrder = 'newest' | 'popular' | 'oldest';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState<Video[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  useEffect(() => {
    async function loadData() {
      try {
        const videosRes = await fetch('/api/videos?limit=100');
        const videosData = await videosRes.json();
        setVideos(videosData.videos || []);

        const articlesRes = await fetch('/api/articles');
        const articlesData = await articlesRes.json();
        setArticles(articlesData.articles || []);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handleKeywordClick = (keyword: string) => {
    window.location.href = `/search?q=${encodeURIComponent(keyword)}`;
  };

  const getYoutubeId = (url: string): string | null => {
    if (!url) return null;
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch) return shortMatch[1];
    const longMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (longMatch) return longMatch[1];
    return null;
  };

  const getThumbnailUrl = (item: Video | Article): string => {
    if ('custom_thumbnail_url' in item && item.custom_thumbnail_url) return item.custom_thumbnail_url;
    if (item.thumbnail_url) return item.thumbnail_url;
    if ('video_url' in item && item.video_url) {
      const ytId = getYoutubeId(item.video_url);
      if (ytId) return `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
    }
    return '/placeholder.jpg';
  };

  const formatDuration = (duration: string | number | null | undefined): string => {
    if (!duration) return '';
    if (typeof duration === 'number') {
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    const durationStr = String(duration);
    if (durationStr.includes(':')) return durationStr;
    const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (match) {
      const hours = parseInt(match[1] || '0');
      const minutes = parseInt(match[2] || '0');
      const seconds = parseInt(match[3] || '0');
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return durationStr;
  };

  const getVideoSummary = (video: Video): string => {
    if (video.summary) {
      return video.summary.substring(0, 80) + (video.summary.length > 80 ? '...' : '');
    }
    if (video.script_text) {
      const summary = video.script_text.substring(0, 80).replace(/\n/g, ' ').trim();
      return summary + (video.script_text.length > 80 ? '...' : '');
    }
    return '';
  };

  // ソートされた動画
  const sortedVideos = [...videos].sort((a, b) => {
    switch (sortOrder) {
      case 'newest':
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      case 'oldest':
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      case 'popular':
        return (b.view_count || 0) - (a.view_count || 0);
      default:
        return 0;
    }
  });

  // ソート表示名
  const sortLabels: Record<SortOrder, string> = {
    newest: '新しい動画',
    popular: '人気の動画',
    oldest: '古い動画',
  };

  const articleCount = articles.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="h-16 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:flex items-baseline gap-0.5">
                <span className="font-bold text-lg text-gray-900">起業の科学</span>
                <span className="font-medium text-lg text-purple-600">ポータル</span>
              </div>
            </Link>

            <form onSubmit={handleSearch} className="flex-1 max-w-xl">
              <div className="flex">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="検索"
                  className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-l-full text-sm focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-6 bg-gray-100 border border-l-0 border-gray-300 rounded-r-full hover:bg-gray-200 transition"
                >
                  <Search className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </form>

            <Link
              href="/mypage"
              className="hidden sm:flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                M
              </div>
              <span className="text-sm font-medium">masa</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* よく検索されるキーワード */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <Search className="w-4 h-4" />
            <span>よく検索されるキーワード</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchKeywords.map((keyword) => (
              <button
                key={keyword}
                onClick={() => handleKeywordClick(keyword)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition"
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>

        {/* ===== 動画で学ぶセクション ===== */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-5">
            <Play className="w-6 h-6 text-red-600" />
            動画で学ぶ
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(videoCategoryConfig).map(([key, config]) => (
              config.enabled ? (
                <Link
                  key={key}
                  href={`/category/${key}`}
                  className={`relative rounded-xl border-l-4 ${config.borderColor} bg-white p-5 hover:shadow-lg transition group shadow-sm`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition`}>
                    {config.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{config.name}</h3>
                  <p className="text-sm text-gray-500 mb-2 line-clamp-1">{config.description}</p>
                  <p className="text-sm font-medium text-blue-600">{videos.length}本の動画</p>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition" />
                </Link>
              ) : (
                <div
                  key={key}
                  className="relative rounded-xl border border-gray-200 bg-gray-50 p-5 cursor-not-allowed opacity-60"
                >
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-0.5 bg-gray-200 text-gray-500 text-xs font-medium rounded-full">
                      Coming Soon
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center text-gray-400 mb-3">
                    {config.icon}
                  </div>
                  <h3 className="font-bold text-gray-400 mb-1">{config.name}</h3>
                  <p className="text-sm text-gray-400 line-clamp-1">{config.description}</p>
                  <p className="text-sm text-gray-400 mt-2">準備中</p>
                </div>
              )
            ))}
          </div>
        </section>

        {/* ===== 記事で学ぶセクション ===== */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-5">
            <BookOpen className="w-6 h-6 text-purple-600" />
            記事で学ぶ
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(articleCategoryConfig).map(([key, config]) => (
              config.enabled ? (
                <Link
                  key={key}
                  href="/articles"
                  className={`relative rounded-xl border-l-4 ${config.borderColor} bg-white p-5 hover:shadow-lg transition group shadow-sm`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition`}>
                    {config.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{config.name}</h3>
                  <p className="text-sm text-gray-500 mb-2 line-clamp-1">{config.description}</p>
                  <p className="text-sm font-medium text-purple-600">{articleCount}件の記事</p>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition" />
                </Link>
              ) : (
                <div
                  key={key}
                  className="relative rounded-xl border border-gray-200 bg-gray-50 p-5 cursor-not-allowed opacity-60"
                >
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-0.5 bg-gray-200 text-gray-500 text-xs font-medium rounded-full">
                      Coming Soon
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center text-gray-400 mb-3">
                    {config.icon}
                  </div>
                  <h3 className="font-bold text-gray-400 mb-1">{config.name}</h3>
                  <p className="text-sm text-gray-400 line-clamp-1">{config.description}</p>
                  <p className="text-sm text-gray-400 mt-2">準備中</p>
                </div>
              )
            ))}

            {/* すべての記事タイル */}
            <Link
              href="/articles"
              className="relative rounded-xl border-l-4 border-l-gray-400 bg-white p-5 hover:shadow-lg transition group shadow-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center text-white mb-3 group-hover:scale-110 transition">
                <ArrowRight className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">すべての記事</h3>
              <p className="text-sm text-gray-500 mb-2">記事一覧を見る</p>
              <p className="text-sm font-medium text-gray-600">{articleCount}件</p>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition" />
            </Link>
          </div>
        </section>

        {/* ===== 動画一覧セクション ===== */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">{sortLabels[sortOrder]}</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortOrder('newest')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  sortOrder === 'newest'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                新しい順
              </button>
              <button
                onClick={() => setSortOrder('popular')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  sortOrder === 'popular'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                人気の動画
              </button>
              <button
                onClick={() => setSortOrder('oldest')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  sortOrder === 'oldest'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                古い順
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="bg-gray-50 rounded-xl overflow-hidden">
                  <div className="aspect-video bg-gray-200 animate-pulse" />
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {sortedVideos.slice(0, 9).map((video) => (
                <Link
                  key={video.video_id}
                  href={`/videos/${video.video_id}`}
                  className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-md transition group"
                >
                  <div className="relative aspect-video bg-gray-200">
                    <img
                      src={getThumbnailUrl(video)}
                      alt={formatVideoTitle(video.title, video.display_order)}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    {video.duration && (
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 text-white text-xs font-medium rounded">
                        {formatDuration(video.duration)}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                      <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition transform scale-90 group-hover:scale-100">
                        <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition">
                      {formatVideoTitle(video.title, video.display_order)}
                    </h4>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                      {getVideoSummary(video)}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {video.view_count || 0}回視聴
                      </span>
                      <span>•</span>
                      <span>
                        {video.created_at ? new Date(video.created_at).toLocaleDateString('ja-JP') : ''}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* フッター */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-lg flex items-center justify-center">
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium text-gray-600">起業の科学ポータル</span>
            </div>
            <p className="text-sm text-gray-400">© 2025 All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
