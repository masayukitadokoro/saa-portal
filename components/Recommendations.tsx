'use client';

import { Sparkles } from 'lucide-react';
import VideoCard from './VideoCard';

interface Video {
  video_id: string;
  title: string;
  script_text: string;
  video_url: string;
  similarity: number;
  matched_content?: string;
  duration?: number;
  thumbnail_url?: string;
}

interface RecommendationsProps {
  videos: Video[];
  isLoading: boolean;
  isLoggedIn: boolean;
  searchCount: number;
}

const MIN_SEARCHES_FOR_RECOMMENDATIONS = 5;

export default function Recommendations({ 
  videos, 
  isLoading, 
  isLoggedIn,
  searchCount
}: RecommendationsProps) {
  const remainingSearches = MIN_SEARCHES_FOR_RECOMMENDATIONS - searchCount;
  const canShowRecommendations = searchCount >= MIN_SEARCHES_FOR_RECOMMENDATIONS;

  return (
    <div className="mt-8">
      {/* ヘッダー */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-yellow-500" />
        <h2 className="text-lg font-semibold text-gray-900">おすすめ動画</h2>
      </div>

      {/* コンテンツ */}
      {!isLoggedIn ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-500">
            ログインするとパーソナライズされたおすすめが表示されます
          </p>
        </div>
      ) : !canShowRecommendations ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <div className="mb-3">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-gray-700 font-medium mb-2">
            あと{remainingSearches}回検索するとおすすめが表示されます
          </p>
          <p className="text-gray-500 text-sm">
            検索履歴をもとに、あなたにぴったりの動画をおすすめします
          </p>
          <div className="mt-4 flex justify-center gap-1">
            {[...Array(MIN_SEARCHES_FOR_RECOMMENDATIONS)].map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < searchCount ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {searchCount} / {MIN_SEARCHES_FOR_RECOMMENDATIONS} 回検索済み
          </p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
              <div className="aspect-video bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-500">
            おすすめ動画を準備中です...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((video) => (
            <VideoCard key={video.video_id} video={video} isRecommendation={true} />
          ))}
        </div>
      )}
    </div>
  );
}
