import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// カテゴリIDとスラッグのマッピング
const CATEGORY_MAP: Record<number, { slug: string; name: string; color: string }> = {
  1: { slug: 'kagaku', name: '起業の科学', color: '#3B82F6' },
  2: { slug: 'taizen', name: '起業大全', color: '#10B981' },
  3: { slug: 'sanbo', name: '起業参謀', color: '#8B5CF6' },
};

// 連続学習日数を計算
function calculateStreakDays(progressRecords: { updated_at: string }[]): number {
  if (progressRecords.length === 0) return 0;

  // 日付のみを抽出してユニークな日付のセットを作成
  const uniqueDates = new Set<string>();
  progressRecords.forEach(record => {
    const date = new Date(record.updated_at).toISOString().split('T')[0];
    uniqueDates.add(date);
  });

  // 日付を降順にソート
  const sortedDates = Array.from(uniqueDates).sort((a, b) => b.localeCompare(a));
  
  // 今日または昨日から連続している日数をカウント
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  // 最新の学習日が今日か昨日でなければストリークは0
  if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
    return 0;
  }

  let streak = 0;
  let expectedDate = new Date(sortedDates[0]);

  for (const dateStr of sortedDates) {
    const currentDate = new Date(dateStr);
    const diffDays = Math.round((expectedDate.getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000));
    
    if (diffDays === 0) {
      streak++;
      expectedDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
    } else {
      break;
    }
  }

  return streak;
}

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
      videosResult,
      progressResult,
    ] = await Promise.all([
      // 全動画を取得（カテゴリ1,2,3のみ）
      supabase
        .from('videos')
        .select('video_id, title, thumbnail_url, duration, category_id, display_order')
        .is('deleted_at', null)
        .in('category_id', [1, 2, 3])
        .not('display_order', 'is', null),

      // ユーザーの視聴進捗を取得（saa_video_progressテーブル）
      supabase
        .from('saa_video_progress')
        .select('video_id, progress_percent, is_completed, last_position_seconds, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false }),
    ]);

    const videos = videosResult.data || [];
    const progressRecords = progressResult.data || [];

    // 進捗データをMapに変換
    const progressMap = new Map(
      progressRecords.map(p => [p.video_id, p])
    );

    // 動画情報をMapに変換
    const videoMap = new Map(
      videos.map(v => [v.video_id, v])
    );

    // カテゴリ別の集計
    const totalByCategory = new Map<number, number>();
    const completedByCategory = new Map<number, number>();

    videos.forEach(v => {
      // 総数をカウント
      const currentTotal = totalByCategory.get(v.category_id) || 0;
      totalByCategory.set(v.category_id, currentTotal + 1);

      // 完了数をカウント
      const progress = progressMap.get(v.video_id);
      if (progress?.is_completed) {
        const currentCompleted = completedByCategory.get(v.category_id) || 0;
        completedByCategory.set(v.category_id, currentCompleted + 1);
      }
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

    // 最近視聴した動画（進捗があるもの）
    const recentlyWatched = progressRecords
      .filter(p => videoMap.has(p.video_id))
      .slice(0, 5)
      .map(p => {
        const video = videoMap.get(p.video_id)!;
        return {
          video_id: p.video_id,
          title: video.title,
          thumbnail_url: video.thumbnail_url,
          duration: video.duration,
          category_id: video.category_id,
          display_order: video.display_order,
          progress_percent: p.progress_percent,
          is_completed: p.is_completed,
        };
      });

    // 続きから再生する動画（未完了で進捗があるもの）
    const continueWatching = recentlyWatched.find(
      v => !v.is_completed && v.progress_percent > 0 && v.progress_percent < 100
    ) || null;

    // 連続学習日数を計算
    const streakDays = calculateStreakDays(progressRecords);

    return NextResponse.json({
      categoryProgress,
      recentlyWatched,
      continueWatching,
      streakDays,
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
