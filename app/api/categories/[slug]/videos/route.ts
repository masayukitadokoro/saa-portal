import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const supabase = await createClient();
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  
  const sort = searchParams.get('sort') || 'newest';
  const difficulty = searchParams.get('difficulty');

  // カテゴリ取得
  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!category) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }

  // 動画クエリ構築
  let query = supabase
    .from('videos')
    .select('*')
    .eq('category_id', category.id);

  // 難易度フィルター
  if (difficulty) {
    query = query.eq('difficulty', parseInt(difficulty));
  }

  // ソート
  switch (sort) {
    case 'oldest':
      query = query.order('created_at', { ascending: true });
      break;
    case 'popular':
      query = query.order('view_count', { ascending: false });
      break;
    case 'difficulty_asc':
      query = query.order('difficulty', { ascending: true });
      break;
    case 'difficulty_desc':
      query = query.order('difficulty', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  const { data: videos, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ category, videos });
}
