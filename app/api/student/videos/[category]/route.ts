import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// カテゴリスラッグとIDのマッピング
const CATEGORY_MAP: Record<string, number> = {
  kagaku: 1,
  taizen: 2,
  sanbo: 3,
};

const CATEGORY_INFO: Record<string, { name: string; color: string }> = {
  kagaku: { name: '起業の科学', color: '#3B82F6' },
  taizen: { name: '起業大全', color: '#10B981' },
  sanbo: { name: '起業参謀', color: '#8B5CF6' },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  const { category } = await params;
  const supabase = await createClient();

  // 認証チェック
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // カテゴリIDを取得
  const categoryId = CATEGORY_MAP[category];
  if (!categoryId) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }

  try {
    // カテゴリ情報を取得
    const { data: categoryData } = await supabase
      .from('categories')
      .select('id, slug, name, description, color')
      .eq('id', categoryId)
      .single();

    // 動画一覧を取得（メインカテゴリまたはサブカテゴリ）
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select(`
        id,
        video_id,
        title,
        description,
        thumbnail_url,
        duration,
        display_order,
        view_count,
        category_id,
        sub_category_id
      `)
      .or(`category_id.eq.${categoryId},sub_category_id.in.(${await getSubCategoryIds(supabase, categoryId)})`)
      .is('deleted_at', null)
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('id', { ascending: true });

    if (videosError) {
      console.error('Videos fetch error:', videosError);
      return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
    }

    // ユーザーの視聴進捗を取得
    const videoIds = videos?.map((v) => v.video_id) || [];
    const { data: progressData } = await supabase
      .from('saa_video_progress')
      .select('video_id, progress_percent, is_completed, last_position_seconds')
      .eq('user_id', user.id)
      .in('video_id', videoIds);

    // 進捗データをマップに変換
    const progressMap = new Map(
      progressData?.map((p) => [p.video_id, p]) || []
    );

    // 動画データに進捗を結合
    const videosWithProgress = videos?.map((video) => {
      const progress = progressMap.get(video.video_id);
      return {
        ...video,
        progress_percent: progress?.progress_percent || 0,
        is_completed: progress?.is_completed || false,
        last_position_seconds: progress?.last_position_seconds || 0,
      };
    });

    // 統計情報を計算
    const totalVideos = videosWithProgress?.length || 0;
    const completedVideos = videosWithProgress?.filter((v) => v.is_completed).length || 0;
    const progressPercent = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

    return NextResponse.json({
      category: {
        id: categoryId,
        slug: category,
        name: categoryData?.name || CATEGORY_INFO[category]?.name,
        color: categoryData?.color || CATEGORY_INFO[category]?.color,
      },
      stats: {
        totalVideos,
        completedVideos,
        progressPercent,
      },
      videos: videosWithProgress || [],
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// サブカテゴリIDを取得するヘルパー関数
async function getSubCategoryIds(supabase: any, parentId: number): Promise<string> {
  const { data } = await supabase
    .from('categories')
    .select('id')
    .eq('parent_id', parentId);

  if (!data || data.length === 0) {
    return '0'; // 該当なしの場合、存在しないID
  }

  return data.map((c: { id: number }) => c.id).join(',');
}
