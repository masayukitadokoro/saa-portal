import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  const { category } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const CATEGORY_MAP: Record<string, number> = {
    kagaku: 1,
    taizen: 2,
    sanbo: 3,
  };

  const categoryId = CATEGORY_MAP[category];
  if (!categoryId) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }

  try {
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select(`
        id,
        video_id,
        title,
        description,
        summary,
        thumbnail_url,
        duration,
        display_order,
        view_count,
        key_points,
        slide_url,
        chapter,
        step,
        video_url,
        custom_thumbnail_url
      `)
      .eq('category_id', categoryId)
      .not('chapter', 'is', null)
      .not('step', 'is', null)
      .is('deleted_at', null)
      .order('display_order', { ascending: true, nullsFirst: false });

    if (videosError) {
      console.error('Videos fetch error:', videosError);
      return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
    }

    const videoIds = videos?.map((v) => v.video_id) || [];

    const { data: progressData } = await supabase
      .from('saa_video_progress')
      .select('video_id, progress_percent, is_completed, last_position_seconds')
      .eq('user_id', user.id)
      .in('video_id', videoIds);

    const progressMap = new Map(
      progressData?.map((p) => [p.video_id, p]) || []
    );

    const videosWithProgress = videos?.map((video) => {
      const progress = progressMap.get(video.video_id);
      return {
        ...video,
        progress_percent: progress?.progress_percent || 0,
        is_completed: progress?.is_completed || false,
        last_position_seconds: progress?.last_position_seconds || 0,
      };
    });

    const completedIds = videosWithProgress
      ?.filter((v) => v.is_completed)
      .map((v) => v.video_id) || [];

    return NextResponse.json({
      videos: videosWithProgress || [],
      completedVideoIds: completedIds,
    });
  } catch (error) {
    console.error('Learn API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
