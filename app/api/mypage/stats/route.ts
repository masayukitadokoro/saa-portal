import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 総動画数
    const { count: totalVideos } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null);

    // 視聴済み動画数
    const { count: watchedVideos } = await supabase
      .from('watch_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('completed', true);

    // 総視聴時間（秒）
    const { data: historyData } = await supabase
      .from('watch_history')
      .select('progress_seconds')
      .eq('user_id', user.id);

    const totalWatchTime = historyData?.reduce((sum, h) => sum + (h.progress_seconds || 0), 0) || 0;

    // 総ブックマーク数
    const { count: totalBookmarks } = await supabase
      .from('bookmarks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // 過去24時間の視聴数
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const { count: last24HoursWatchedCount } = await supabase
      .from('watch_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('watched_at', twentyFourHoursAgo.toISOString());

    // 連続学習日数を計算
    const { data: recentHistory } = await supabase
      .from('watch_history')
      .select('watched_at')
      .eq('user_id', user.id)
      .order('watched_at', { ascending: false })
      .limit(100);

    let streakDays = 0;
    if (recentHistory && recentHistory.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const watchedDates = new Set(
        recentHistory.map(h => {
          const date = new Date(h.watched_at);
          date.setHours(0, 0, 0, 0);
          return date.getTime();
        })
      );

      // 今日から遡って連続日数をカウント
      let checkDate = new Date(today);
      while (watchedDates.has(checkDate.getTime())) {
        streakDays++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
      
      // 今日視聴していない場合、昨日から計算
      if (streakDays === 0) {
        checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - 1);
        while (watchedDates.has(checkDate.getTime())) {
          streakDays++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
      }
    }

    return NextResponse.json({
      totalVideos: totalVideos || 0,
      watchedVideos: watchedVideos || 0,
      totalWatchTime,
      streakDays,
      last24HoursWatchedCount: last24HoursWatchedCount || 0,
      totalBookmarks: totalBookmarks || 0
    });

  } catch (error) {
    console.error('Error in stats API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
