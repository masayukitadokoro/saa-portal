'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Video } from '@/types';
import { Play, Clock, Star, Lock } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import LoginModal from '@/components/LoginModal';

interface FeaturedVideosProps {
  videos: Video[];
}

export default function FeaturedVideos({ videos }: FeaturedVideosProps) {
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  if (videos.length === 0) {
    return null;
  }

  function getThumbnailUrl(video: Video): string {
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
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins + ':' + secs.toString().padStart(2, '0');
  }

  function handleVideoClick(e: React.MouseEvent) {
    if (!user) {
      e.preventDefault();
      setShowLoginModal(true);
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <div
            key={video.video_id}
            className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden border border-gray-100 relative"
          >
            {user ? (
              <Link
                href={'/videos/' + video.video_id}
                className="block"
              >
                <div className="relative aspect-video bg-gray-100">
                  <img
                    src={getThumbnailUrl(video)}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-5 h-5 text-gray-900 ml-1" />
                    </div>
                  </div>
                  {video.duration && (
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs font-medium rounded">
                      {formatDuration(video.duration)}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors mb-2">
                    {video.title}
                  </h3>
                  {video.duration && (
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="w-3 h-3" />
                      {formatDuration(video.duration)}
                    </div>
                  )}
                </div>
              </Link>
            ) : (
              <div
                onClick={handleVideoClick}
                className="cursor-pointer"
              >
                <div className="relative aspect-video bg-gray-100">
                  <img
                    src={getThumbnailUrl(video)}
                    alt={video.title}
                    className="w-full h-full object-cover blur-sm"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center mb-3">
                      <Lock className="w-6 h-6 text-gray-700" />
                    </div>
                    <span className="text-white font-medium text-sm">ログインして視聴</span>
                  </div>
                  {video.duration && (
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs font-medium rounded">
                      {formatDuration(video.duration)}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">
                    {video.title}
                  </h3>
                  {video.duration && (
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="w-3 h-3" />
                      {formatDuration(video.duration)}
                    </div>
                  )}
                </div>
              </div>
            )}
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
