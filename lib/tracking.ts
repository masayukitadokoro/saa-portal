// アクティビティタイプの定義
export type ActivityType = 
  | 'login'
  | 'video_view'
  | 'video_complete'
  | 'article_view'
  | 'resource_download'
  | 'bookmark_add'
  | 'bookmark_remove'
  | 'search';

interface TrackActivityParams {
  activity_type: ActivityType;
  target_id?: string;
  target_title?: string;
  metadata?: Record<string, any>;
}

// アクティビティを記録する関数
export async function trackActivity(params: TrackActivityParams): Promise<void> {
  try {
    await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  } catch (error) {
    // トラッキングエラーは無視（ユーザー体験に影響させない）
    console.error('Tracking error:', error);
  }
}

// 便利なヘルパー関数
export const track = {
  login: () => trackActivity({ activity_type: 'login' }),
  
  videoView: (videoId: string, title: string) => 
    trackActivity({ 
      activity_type: 'video_view', 
      target_id: videoId, 
      target_title: title 
    }),
  
  videoComplete: (videoId: string, title: string, watchTime?: number) => 
    trackActivity({ 
      activity_type: 'video_complete', 
      target_id: videoId, 
      target_title: title,
      metadata: watchTime ? { watch_time: watchTime } : {}
    }),
  
  articleView: (articleId: string, title: string) => 
    trackActivity({ 
      activity_type: 'article_view', 
      target_id: articleId, 
      target_title: title 
    }),
  
  resourceDownload: (resourceId: string, title: string, type?: string) => 
    trackActivity({ 
      activity_type: 'resource_download', 
      target_id: resourceId, 
      target_title: title,
      metadata: type ? { resource_type: type } : {}
    }),
  
  bookmarkAdd: (videoId: string, title: string) => 
    trackActivity({ 
      activity_type: 'bookmark_add', 
      target_id: videoId, 
      target_title: title 
    }),
  
  bookmarkRemove: (videoId: string, title: string) => 
    trackActivity({ 
      activity_type: 'bookmark_remove', 
      target_id: videoId, 
      target_title: title 
    }),
  
  search: (query: string, resultCount?: number) => 
    trackActivity({ 
      activity_type: 'search', 
      metadata: { query, result_count: resultCount }
    }),
};
