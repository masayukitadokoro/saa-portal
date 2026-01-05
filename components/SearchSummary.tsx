'use client';

import CircularProgress from './CircularProgress';

interface Video {
  video_id: string;
  title: string;
  similarity: number;
}

interface SearchSummaryProps {
  results: Video[];
  query: string;
  onSelect: (videoId: string) => void;
}

export default function SearchSummary({ results, query, onSelect }: SearchSummaryProps) {
  if (!query || results.length === 0) {
    return null;
  }

  // 上位5件のみ表示
  const topResults = results.slice(0, 5);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <p className="text-sm text-gray-600 mb-4">
        {results.length}件の関連動画が見つかりました
      </p>

      <div className="space-y-3">
        {topResults.map((video, index) => {
          const relevance = Math.round(video.similarity * 100);
          return (
            <button
              key={video.video_id}
              onClick={() => onSelect(video.video_id)}
              className="w-full flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              {/* ランク番号 */}
              <span className="text-2xl font-bold text-blue-600 w-6 flex-shrink-0">
                {index + 1}
              </span>

              {/* コンテンツ */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                  {video.title}
                </h4>
              </div>

              {/* 関連度リング */}
              <div className="flex-shrink-0">
                <CircularProgress percentage={relevance} size={40} strokeWidth={3} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
