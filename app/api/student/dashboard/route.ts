import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// カテゴリIDとスラッグのマッピング
const CATEGORY_MAP: Record<number, { slug: string; name: string; color: string }> = {
  1: { slug: 'kagaku', name: '起業の科学', color: '#3B82F6' },
  2: { slug: 'taizen', name: '起業大全', color: '#10B981' },
  3: { slug: 'sanbo', name: '起業参謀', color: '#8B5CF6' },
};

export async function GET() {
  const supabase = await createClient();

  // 認証チェック
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 並列でデータ取得
    const [
      videosCountResult,
      watchHistoryResult,
      regularLecturesResult,
      expertLecturesResult,
    ] = await Promise.all([
      // カテゴリ別の動画総数を取得
      supabase
        .from('videos')
        .select('category_id')
        .is('deleted_at', null)
        .in('category_id', [1, 2, 3]),

      // 視聴履歴（既存のwatch_historyテーブルを使用）
      supabase
        .from('watch_history')
        .select(`
          video_id,
          watched_at,
          watch_duration,
          progress_seconds,
          completed,
          updated_at
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(20),

      // 今後の定例講義
      supabase
        .from('saa_regular_lectures')
        .select('id, title, scheduled_at, lecture_number')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at')
        .limit(3),

      // 今後の専門家講義
      supabase
        .from('saa_expert_lectures')
        .select('id, title, scheduled_at, expert_name')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at')
        .limit(3),
    ]);

    // 視聴したvideo_idのリストを取得
    const watchedVideoIds = watchHistoryResult.data?.map(h => h.video_id) || [];

    // 視聴した動画の詳細情報を取得
    let recentVideos: any[] = [];
    if (watchedVideoIds.length > 0) {
      const { data: videosData } = await supabase
        .from('videos')
        .select('video_id, title, thumbnail_url, duration, category_id, display_order')
        .in('video_id', watchedVideoIds);

      // 視聴履歴と動画情報を結合
      const videoMap = new Map(videosData?.map(v => [v.video_id, v]) || []);
      recentVideos = (watchHistoryResult.data || [])
        .map(h => {
          const video = videoMap.get(h.video_id);
          if (!video) return null;
          return {
            video_id: h.video_id,
            title: video.title,
            thumbnail_url: video.thumbnail_url,
            duration: video.duration,
            category_id: video.category_id,
            display_order: video.display_order,
            progress_seconds: h.progress_seconds,
            progress_percent: video.duration ? Math.round((h.progress_seconds / video.duration) * 100) : 0,
            is_completed: h.completed,
            watched_at: h.watched_at,
          };
        })
        .filter(Boolean)
        .slice(0, 5);
    }

    // 視聴完了した動画数をカテゴリ別に集計
    const completedByCategory = new Map<number, number>();
    if (watchedVideoIds.length > 0) {
      const { data: completedVideos } = await supabase
        .from('watch_history')
        .select('video_id')
        .eq('user_id', user.id)
        .eq('completed', true);

      if (completedVideos && completedVideos.length > 0) {
        const completedIds = completedVideos.map(c => c.video_id);
        const { data: videoCategories } = await supabase
          .from('videos')
          .select('video_id, category_id')
          .in('video_id', completedIds);

        videoCategories?.forEach(v => {
          const current = completedByCategory.get(v.category_id) || 0;
          completedByCategory.set(v.category_id, current + 1);
        });
      }
    }

    // カテゴリ別の動画総数を集計
    const totalByCategory = new Map<number, number>();
    videosCountResult.data?.forEach(v => {
      const current = totalByCategory.get(v.category_id) || 0;
      totalByCategory.set(v.category_id, current + 1);
    });

    // カテゴリ別進捗を作成
    const categoryProgress = Object.entries(CATEGORY_MAP).map(([id, info]) => {
      const categoryId = parseInt(id);
      const totalVideos = totalByCategory.get(categoryId) || 0;
      const completedVideos = completedByCategory.get(categoryId) || 0;
      return {
        category: info.slug,
        categoryName: info.name,
        totalVideos,
        completedVideos,
        progressPercent: totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0,
        color: info.color,
      };
    });

    // 今週のイベントを作成
    const upcomingEvents = [
      ...(regularLecturesResult.data || []).map(l => ({
        id: l.id,
        type: 'regular' as const,
        title: `第${l.lecture_number}回: ${l.title}`,
        scheduled_at: l.scheduled_at,
      })),
      ...(expertLecturesResult.data || []).map(l => ({
        id: l.id,
        type: 'expert' as const,
        title: l.title,
        subtitle: l.expert_name,
        scheduled_at: l.scheduled_at,
      })),
    ].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
     .slice(0, 5);

    // 続きから再生する動画
    const continueWatching = recentVideos.find(
      v => !v.is_completed && v.progress_percent > 0 && v.progress_percent < 100
    ) || null;

    return NextResponse.json({
      categoryProgress,
      upcomingEvents,
      recentlyWatched: recentVideos,
      continueWatching,
      // 以下は後で実装
      latestSCM: null,
      graduationProgress: null,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
