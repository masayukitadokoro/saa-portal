'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Play } from 'lucide-react';

interface YouTubePlayerProps {
  videoId: string | null;
  title: string;
  duration?: number;
  onProgress?: (percent: number, seconds: number) => void;
  onComplete?: () => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function YouTubePlayerWithProgress({
  videoId,
  title,
  duration,
  onProgress,
  onComplete,
}: YouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasCompleted = useRef(false);

  const saveProgress = useCallback(() => {
    if (!playerRef.current || !duration) return;
    try {
      const currentTime = playerRef.current.getCurrentTime?.() || 0;
      const percent = Math.min(Math.round((currentTime / duration) * 100), 100);
      onProgress?.(percent, Math.floor(currentTime));
    } catch (e) {
      // Player not ready
    }
  }, [duration, onProgress]);

  const handleComplete = useCallback(() => {
    if (hasCompleted.current) return;
    hasCompleted.current = true;
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    if (!videoId) return;

    const initPlayer = () => {
      if (!window.YT || !containerRef.current) return;

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              if (intervalRef.current) clearInterval(intervalRef.current);
              intervalRef.current = setInterval(saveProgress, 30000);
            }
            if (event.data === window.YT.PlayerState.PAUSED) {
              if (intervalRef.current) clearInterval(intervalRef.current);
              saveProgress();
            }
            if (event.data === window.YT.PlayerState.ENDED) {
              if (intervalRef.current) clearInterval(intervalRef.current);
              handleComplete();
            }
          },
        },
      });
    };

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
      window.onYouTubeIframeAPIReady = initPlayer;
    } else {
      initPlayer();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      playerRef.current?.destroy?.();
    };
  }, [videoId, saveProgress, handleComplete]);

  if (!videoId) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-black">
        <Play className="w-16 h-16" />
      </div>
    );
  }

  return <div ref={containerRef} className="absolute inset-0 w-full h-full" />;
}
