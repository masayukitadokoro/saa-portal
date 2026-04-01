import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: categories, error: catError } = await supabase
      .from('saa_guide_categories')
      .select('id, slug, title, icon, sort_order')
      .eq('batch_id', 9)
      .order('sort_order');

    if (catError) {
      return NextResponse.json({ error: catError.message }, { status: 500 });
    }

    const { data: pages, error: pageError } = await supabase
      .from('saa_guide_pages')
      .select('id, title, slug, category_id, sort_order, is_published')
      .eq('batch_id', 9)
      .eq('is_published', true)
      .order('sort_order');

    if (pageError) {
      return NextResponse.json({ error: pageError.message }, { status: 500 });
    }

    const grouped = categories?.map((cat) => ({
      ...cat,
      pages: pages?.filter((p) => p.category_id === cat.id) || [],
    }));

    return NextResponse.json({ categories: grouped });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch guide data' },
      { status: 500 }
    );
  }
}
