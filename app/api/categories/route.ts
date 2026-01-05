import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
export async function GET() {
  const supabase = await createClient();
  const { data: categories, error } = await supabase
    .from('categories')
    .select(`
      *,
      videos:videos(count)
    `)
    .eq('is_active', true)
    .eq('category_type', 'main')
    .order('sort_order');
  if (error) {
    console.error('Categories API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const categoriesWithCount = categories?.map(cat => ({
    ...cat,
    video_count: cat.videos?.[0]?.count || 0,
    videos: undefined
  }));
  return NextResponse.json({ categories: categoriesWithCount });
}
