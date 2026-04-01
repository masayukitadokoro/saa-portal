import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: page, error } = await supabase
      .from('saa_guide_pages')
      .select(
        `
        id,
        title,
        slug,
        content,
        category_id,
        sort_order,
        updated_at,
        saa_guide_categories (
          id,
          title,
          slug,
          icon
        )
      `
      )
      .eq('slug', slug)
      .eq('batch_id', 9)
      .eq('is_published', true)
      .single();

    if (error || !page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json({ page });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch guide page' },
      { status: 500 }
    );
  }
}
