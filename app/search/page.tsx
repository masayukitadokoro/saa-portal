'use client';
import { formatVideoTitle } from '@/lib/formatTitle';

import { useEffect, useState, Suspense } from 'react';
import { track } from '@/lib/tracking';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

interface SearchResult {
  video_id: string;
  title: string;
  video_url: string;
  duration: string | number | null;
  similarity: number;
  comment: string;
  relevant_excerpt: string;
  thumbnail_url?: string;
  custom_thumbnail_url?: string;
  display_order?: number;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(query);

  useEffect(() => {
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (q: string) => {
    if (!q.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      });
      
      if (!res.ok) {
        throw new Error('検索に失敗しました');
      }
      
      const data = await res.json();
      setResults(data.results || []);
      track.search(q, data.results?.length || 0);
    } catch (err) {
      console.error('Search error:', err);
      setError('検索中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      window.history.pushState({}, '', `/search?q=${encodeURIComponent(searchQuery.trim())}`);
      performSearch(searchQuery.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatDuration = (duration: string | number | null | undefined): string => {
    if (!duration) return '';
    
    // 数値の場合は秒として扱う
    if (typeof duration === 'number') {
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // 文字列の場合
    const durationStr = String(duration);
    
    // 既にフォーマット済み（"13:36"形式）
    if (durationStr.includes(':')) return durationStr;
    
    // ISO 8601 形式 ("PT13M36S")
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

  // YouTube URLからIDを抽出してサムネイルURLを生成
  const getThumbnailUrl = (result: SearchResult): string => {
    // カスタムサムネイルがあればそれを優先
    if (result.custom_thumbnail_url) {
      return result.custom_thumbnail_url;
    }
    
    // DBのthumbnail_urlがあればそれを使用
    if (result.thumbnail_url) {
      return result.thumbnail_url;
    }
    
    // video_urlからYouTube IDを抽出
    if (result.video_url) {
      // youtu.be/XXXXX 形式
      const shortMatch = result.video_url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
      if (shortMatch) {
        return `https://img.youtube.com/vi/${shortMatch[1]}/mqdefault.jpg`;
      }
      
      // youtube.com/watch?v=XXXXX 形式
      const longMatch = result.video_url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
      if (longMatch) {
        return `https://img.youtube.com/vi/${longMatch[1]}/mqdefault.jpg`;
      }
      
      // youtube.com/embed/XXXXX 形式
      const embedMatch = result.video_url.match(/embed\/([a-zA-Z0-9_-]+)/);
      if (embedMatch) {
        return `https://img.youtube.com/vi/${embedMatch[1]}/mqdefault.jpg`;
      }
    }
    
    // フォールバック
    return '/placeholder.jpg';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center h-14 gap-4">
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-bold text-lg text-gray-900">動画検索</span>
            </Link>
            
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="キーワードで検索..."
                  className="w-full pl-10 pr-20 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition"
                >
                  検索
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* 検索クエリ表示 */}
        {query && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              「{query}」の検索結果
            </h1>
            {!isLoading && !error && (
              <p className="text-gray-500 mt-1">
                {results.length}件の動画が見つかりました
              </p>
            )}
          </div>
        )}

        {/* ローディング */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-600">AI が関連動画を検索中...</p>
          </div>
        )}

        {/* エラー */}
        {error && (
          <div className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => performSearch(query)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              再試行
            </button>
          </div>
        )}

        {/* 検索結果 */}
        {!isLoading && !error && results.length > 0 && (
          <div className="space-y-6">
            {results.map((result) => (
              <Link
                key={result.video_id}
                href={`/videos/${result.video_id}`}
                className="block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition group"
              >
                <div className="flex flex-col md:flex-row">
                  {/* サムネイル */}
                  <div className="relative w-full md:w-72 aspect-video md:aspect-auto md:h-40 flex-shrink-0 bg-gray-200">
                    <img
                      src={getThumbnailUrl(result)}
                      alt={formatVideoTitle(result.title, result.display_order)}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                      onError={(e) => {
                        // 画像読み込みエラー時はプレースホルダーを表示
                        (e.target as HTMLImageElement).src = '/placeholder.jpg';
                      }}
                    />
                    {result.duration && (
                      <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-0.5 rounded">
                        {formatDuration(result.duration)}
                      </span>
                    )}
                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                      関連度 {Math.round((result.similarity || 0) * 100)}%
                    </div>
                  </div>
                  
                  {/* コンテンツ */}
                  <div className="p-4 flex-1">
                    <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-blue-600 transition line-clamp-2">
                      {formatVideoTitle(result.title, result.display_order)}
                    </h3>
                    
                    {/* AIコメント */}
                    {result.comment && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-700">
                          💡 {result.comment}
                        </p>
                      </div>
                    )}
                    
                    {/* 該当箇所 */}
                    {result.relevant_excerpt && (
                      <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-500">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          "{result.relevant_excerpt}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* 結果なし */}
        {!isLoading && !error && query && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <Search className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-600 mb-2">「{query}」に一致する動画が見つかりませんでした</p>
            <p className="text-gray-500 text-sm">別のキーワードで検索してみてください</p>
          </div>
        )}

        {/* 初期状態 */}
        {!query && (
          <div className="flex flex-col items-center justify-center py-16">
            <Search className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-600">キーワードを入力して検索してください</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
