import { useEffect, useRef, useCallback, useState } from 'react';

interface UseYouTubePlayerOptions {
  videoId: string;
  containerId: string;
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

export function useYouTubePlayer({
  videoId,
  containerId,
  duration,
  onProgress,
  onComplete,
}: UseYouTubePlayerOptions) {
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isReady, setIsReady] = useState(false);

  const saveProgress = useCallback(() => {
    if (!playerRef.current || !duration) return;
    
    try {
      const currentTime = playerRef.current.getCurrentTime?.() || 0;
      const percent = Math.round((currentTime / duration) * 100);
      onProgress?.(percent, Math.floor(currentTime));
    } catch (e) {
      // Player not ready
    }
  }, [duration, onProgress]);

  const initPlayer = useCallback(() => {
    if (!window.YT || !videoId) return;

    playerRef.current = new window.YT.Player(containerId, {
      videoId,
      playerVars: {
        rel: 0,
        modestbranding: 1,
      },
      events: {
        onReady: () => {
          setIsReady(true);
        },
        onStateChange: (event: any) => {
          // 再生中: 30秒ごとに進捗保存
          if (event.data === window.YT.PlayerState.PLAYING) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = setInterval(saveProgress, 30000);
          }
          
          // 一時停止・終了: インターバル停止 & 進捗保存
          if (event.data === window.YT.PlayerState.PAUSED) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            saveProgress();
          }
          
          // 終了: 完了としてマーク
          if (event.data === window.YT.PlayerState.ENDED) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            onComplete?.();
          }
        },
      },
    });
  }, [videoId, containerId, saveProgress, onComplete]);

  useEffect(() => {
    // YouTube iframe API読み込み
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = initPlayer;
    } else {
      initPlayer();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      playerRef.current?.destroy?.();
    };
  }, [initPlayer]);

  return { isReady, player: playerRef.current };
}
