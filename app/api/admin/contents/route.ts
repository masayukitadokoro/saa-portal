import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 動画一覧を取得
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select('video_id, title, thumbnail_url, custom_thumbnail_url, video_url, article_content')
      .is('deleted_at', null)
      .order('video_id', { ascending: true });

    if (videosError) {
      console.error('Videos fetch error:', videosError);
      return NextResponse.json({ error: videosError.message }, { status: 500 });
    }

    // 各動画の資料数を取得
    const { data: resourceCounts, error: resourcesError } = await supabase
      .from('video_resources')
      .select('video_id');

    if (resourcesError) {
      console.error('Resources fetch error:', resourcesError);
    }

    // 資料数をカウント
    const countMap: Record<string, number> = {};
    if (resourceCounts) {
      for (const r of resourceCounts) {
        countMap[r.video_id] = (countMap[r.video_id] || 0) + 1;
      }
    }

    // 結合
    const result = (videos || []).map(video => ({
      ...video,
      resource_count: countMap[video.video_id] || 0
    }));

    return NextResponse.json({ videos: result });

  } catch (error) {
    console.error('Error fetching contents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
