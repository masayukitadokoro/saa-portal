'use client';

interface Video {
  video_id: string;
  title: string;
  script_text?: string;
  video_url: string;
  similarity: number;
  matched_content?: string;
  duration?: number;
  thumbnail_url?: string;
  custom_thumbnail_url?: string;  // ★追加
  relevant_excerpt?: string;
  comment?: string;
}

interface VideoCardProps {
  video: Video;
  rank?: number;
  isRecommendation?: boolean;
}

function getThumbnailUrl(videoUrl: string, customThumbnail?: string): string {
  if (customThumbnail) return customThumbnail;
  const match = videoUrl.match(/(?:v=|\/embed\/|youtu\.be\/)([\w-]{11})/);
  if (match) {
    return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
  }
  return '/placeholder-video.png';
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function generateSummary(video: Video): string {
  if (video.relevant_excerpt && video.relevant_excerpt.length > 0) {
    const cleaned = video.relevant_excerpt.replace(/\n/g, ' ').trim();
    if (cleaned.length <= 60) return cleaned;
    return cleaned.substring(0, 60) + '...';
  }
  if (video.script_text) {
    const cleaned = video.script_text.replace(/\n/g, ' ').trim();
    if (cleaned.length <= 60) return cleaned;
    return cleaned.substring(0, 60) + '...';
  }
  return '動画の内容をご確認ください';
}

export default function VideoCard({ video, rank, isRecommendation }: VideoCardProps) {
  // ★ custom_thumbnail_url を優先して使用
  const thumbnailUrl = getThumbnailUrl(video.video_url, video.custom_thumbnail_url || video.thumbnail_url);
  const duration = formatDuration(video.duration);
  const summary = generateSummary(video);
  const relevance = Math.round(video.similarity * 100);

  return (
    <a
      href={video.video_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      <div className="relative aspect-video bg-gray-100">
        <img
          src={thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover"
        />
        {duration && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-white text-xs font-medium rounded">
            {duration}
          </div>
        )}
        {rank && (
          <div className="absolute top-2 left-2 w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {rank}
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors mb-2">
          {video.title}
        </h3>
        <div className="text-sm text-gray-500 mb-2">
          <span className="text-blue-600 font-medium">
            {isRecommendation ? 'おすすめ度' : '関連度'}: {relevance}%
          </span>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">
          要約: {summary}
        </p>
      </div>
    </a>
  );
}
