import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const supabase = await createClient();

    // 動画情報を取得
    const { data: video, error } = await supabase
      .from('videos')
      .select('*')
      .eq('video_id', videoId)
      .is('deleted_at', null)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Video not found', details: error.message },
        { status: 404 }
      );
    }

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // カテゴリ情報を別途取得
    let category = null;
    if (video.category_id) {
      const { data: categoryData } = await supabase
        .from('categories')
        .select('*')
        .eq('id', video.category_id)
        .single();
      category = categoryData;
    }

    // ========== 前後動画ナビゲーション用 ==========
    let prevVideo = null;
    let nextVideo = null;
    let currentIndex = 0;
    let totalInCategory = 0;

    if (video.category_id) {
      const { data: categoryVideos } = await supabase
        .from('videos')
        .select('video_id, title, sort_order')
        .eq('category_id', video.category_id)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true });

      if (categoryVideos && categoryVideos.length > 0) {
        totalInCategory = categoryVideos.length;
        const currentIdx = categoryVideos.findIndex(v => v.video_id === videoId);
        
        if (currentIdx !== -1) {
          currentIndex = currentIdx + 1;
          if (currentIdx > 0) {
            prevVideo = categoryVideos[currentIdx - 1];
          }
          if (currentIdx < categoryVideos.length - 1) {
            nextVideo = categoryVideos[currentIdx + 1];
          }
        }
      }
    }
    // ============================================

    // 同じカテゴリの関連動画を取得（RPC関数がない場合の代替）
    let relatedVideos: any[] = [];
    if (video.category_id) {
      const { data: related } = await supabase
        .from('videos')
        .select('video_id, title, thumbnail_url, duration')
        .eq('category_id', video.category_id)
        .neq('video_id', videoId)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true })
        .limit(6);
      
      relatedVideos = related || [];
    }

    // 視聴回数をインクリメント
    await supabase
      .from('videos')
      .update({ view_count: (video.view_count || 0) + 1 })
      .eq('video_id', videoId);

    // key_points を points としても返す（フロントエンド互換性）
    const videoWithPoints = {
      ...video,
      points: video.key_points || [],
      categories: category
    };

    return NextResponse.json({
      video: videoWithPoints,
      relatedVideos: relatedVideos,
      navigation: {
        prevVideo,
        nextVideo,
        currentIndex,
        totalInCategory
      }
    });

  } catch (error) {
    console.error('Error fetching video:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
