import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params;
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ 
        watchedCount: 0, 
        totalCount: 0, 
        percentage: 0,
        watchedVideoIds: []
      });
    }

    // カテゴリ内の全動画数を取得
    const { count: totalCount } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId);

    // ユーザーが視聴した動画を取得
    const { data: watchedVideos } = await supabase
      .from('watch_history')
      .select(`
        video_id,
        videos!inner (
          category_id
        )
      `)
      .eq('user_id', user.id)
      .eq('videos.category_id', categoryId);

    const watchedCount = watchedVideos?.length || 0;
    const percentage = totalCount ? Math.round((watchedCount / totalCount) * 100) : 0;
    const watchedVideoIds = watchedVideos?.map((w: any) => w.video_id) || [];

    return NextResponse.json({ 
      watchedCount, 
      totalCount: totalCount || 0, 
      percentage,
      watchedVideoIds
    });

  } catch (error) {
    console.error('Error fetching category progress:', error);
    return NextResponse.json({ 
      watchedCount: 0, 
      totalCount: 0, 
      percentage: 0,
      watchedVideoIds: []
    });
  }
}
