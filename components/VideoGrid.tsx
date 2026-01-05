'use client';
import { formatVideoTitle } from '@/lib/formatTitle';

import { useState } from 'react';
import Link from 'next/link';
import { Video } from '@/types';
import { Play, Clock, Star, Lock } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import LoginModal from '@/components/LoginModal';

interface VideoGridProps {
  videos: Video[];
  showBookmark?: boolean;
}

export default function VideoGrid({ videos }: VideoGridProps) {
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">動画が見つかりませんでした</p>
      </div>
    );
  }

  function getThumbnailUrl(video: Video): string {
    // ★ custom_thumbnail_url を優先
    if (video.custom_thumbnail_url) {
      return video.custom_thumbnail_url;
    }
    if (video.thumbnail_url) {
      return video.thumbnail_url;
    }
    const match = video.video_url.match(/(?:v=|\/embed\/|youtu\.be\/)([\w-]{11})/);
    if (match) {
      return 'https://img.youtube.com/vi/' + match[1] + '/mqdefault.jpg';
    }
    return '/placeholder-video.png';
  }

  function formatDuration(seconds?: number | null): string {
    if (!seconds) return '';
    return Math.floor(seconds / 60) + ':' + (seconds % 60).toString().padStart(2, '0');
  }

  function handleVideoClick(e: React.MouseEvent) {
    if (!user) {
      e.preventDefault();
      setShowLoginModal(true);
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {videos.map((video) => (
          <div
            key={video.video_id}
            className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
          >
            <Link
              href={'/videos/' + video.video_id}
              onClick={handleVideoClick}
              className="block relative aspect-video bg-gray-100"
            >
              <img
                src={getThumbnailUrl(video)}
                alt={formatVideoTitle(video.title, video.display_order)}
                className="w-full h-full object-cover"
              />
              {video.duration && (
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-white text-xs font-medium rounded">
                  {formatDuration(video.duration)}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                <Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
            <div className="p-4">
              <Link href={'/videos/' + video.video_id} onClick={handleVideoClick}>
                <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors mb-2">
                  {formatVideoTitle(video.title, video.display_order)}
                </h3>
              </Link>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                {video.duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(video.duration)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        message="この動画を視聴するにはログインが必要です"
      />
    </>
  );
}
