import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = await createClient();

  // カテゴリ取得
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .eq('category_type', 'main')
    .order('sort_order');

  if (error) {
    console.error('Categories API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 各カテゴリの動画数を取得
  const categoriesWithCount = await Promise.all(
    (categories || []).map(async (cat) => {
      const { count } = await supabase
        .from('videos')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', cat.id)
        .is('deleted_at', null);
      
      return {
        ...cat,
        video_count: count || 0
      };
    })
  );

  return NextResponse.json({ categories: categoriesWithCount });
}
