import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * 注目動画API
 * 
 * GET /api/videos/featured
 * 
 * データベースの videos テーブルから is_featured = true の動画を取得します。
 * 注目動画がない場合は、view_count（視聴回数）が多い順に取得します。
 */
export async function GET() {
  const supabase = await createClient();

  // まず is_featured = true の動画を取得
  const { data: featuredVideos, error } = await supabase
    .from('videos')
    .select('*')
    .eq('is_featured', true)
    .order('sort_order', { ascending: true })
    .limit(6);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 注目動画がない場合は、人気順（視聴回数順）で代替
  if (!featuredVideos || featuredVideos.length === 0) {
    const { data: popularVideos, error: popularError } = await supabase
      .from('videos')
      .select('*')
      .order('view_count', { ascending: false })
      .limit(6);

    if (popularError) {
      return NextResponse.json({ error: popularError.message }, { status: 500 });
    }

    return NextResponse.json({ videos: popularVideos || [] });
  }

  return NextResponse.json({ videos: featuredVideos });
}
