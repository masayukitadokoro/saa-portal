import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * 動画一覧API
 * 
 * GET /api/videos
 * GET /api/videos?limit=10
 * GET /api/videos?category_id=1
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  
  const limit = parseInt(searchParams.get('limit') || '100');
  const categoryId = searchParams.get('category_id');

  let query = supabase
    .from('videos')
    .select(`
      *,
      category:categories(id, name, slug)
    `)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  if (categoryId) {
    query = query.eq('category_id', parseInt(categoryId));
  }

  if (limit > 0) {
    query = query.limit(limit);
  }

  const { data: videos, error } = await query;

  if (error) {
    console.error('Videos API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ videos: videos || [] });
}
