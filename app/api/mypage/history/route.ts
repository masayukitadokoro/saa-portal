import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// 視聴履歴を取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // まず視聴履歴を取得
    const { data: historyData, error: historyError } = await supabase
      .from('watch_history')
      .select('id, video_id, watched_at, progress_seconds')
      .eq('user_id', user.id)
      .order('watched_at', { ascending: false })
      .limit(limit);

    if (historyError) {
      console.error('Error fetching watch history:', historyError);
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }

    if (!historyData || historyData.length === 0) {
      return NextResponse.json({ history: [] });
    }

    // 動画IDを取得
    const videoIds = historyData.map(h => h.video_id);

    // 動画情報を別途取得（video_urlを追加！）
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select('video_id, title, thumbnail_url, custom_thumbnail_url, duration, category_id, video_url, view_count, display_order')
      .in('video_id', videoIds);

    if (videosError) {
      console.error('Error fetching videos:', videosError);
    }

    // 動画情報をマップに変換
    const videoMap = new Map(videos?.map(v => [v.video_id, v]) || []);

    // 履歴に動画情報を結合
    const history = historyData.map(h => ({
      ...h,
      video: videoMap.get(h.video_id) || null
    }));

    return NextResponse.json({ history });

  } catch (error) {
    console.error('Error in watch history API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 視聴履歴を追加/更新
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { video_id, progress_seconds } = await request.json();

    if (!video_id) {
      return NextResponse.json({ error: 'video_id is required' }, { status: 400 });
    }

    // 既存の履歴があるか確認
    const { data: existing } = await supabase
      .from('watch_history')
      .select('id')
      .eq('user_id', user.id)
      .eq('video_id', video_id)
      .single();

    if (existing) {
      // 更新
      const { error: updateError } = await supabase
        .from('watch_history')
        .update({
          watched_at: new Date().toISOString(),
          progress_seconds: progress_seconds || 0,
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Error updating watch history:', updateError);
        return NextResponse.json({ error: 'Failed to update history' }, { status: 500 });
      }
    } else {
      // 新規作成
      const { error: insertError } = await supabase
        .from('watch_history')
        .insert({
          user_id: user.id,
          video_id,
          progress_seconds: progress_seconds || 0,
        });

      if (insertError) {
        console.error('Error inserting watch history:', insertError);
        return NextResponse.json({ error: 'Failed to create history' }, { status: 500 });
      }
    }

    return NextResponse.json({ message: 'History updated successfully' });

  } catch (error) {
    console.error('Error in watch history API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 全履歴を削除
export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('watch_history')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting watch history:', error);
      return NextResponse.json({ error: 'Failed to delete history' }, { status: 500 });
    }

    return NextResponse.json({ message: 'History cleared successfully' });

  } catch (error) {
    console.error('Error in watch history API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
