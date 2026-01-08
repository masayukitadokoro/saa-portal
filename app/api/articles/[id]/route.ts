import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: article, error } = await supabase
      .from('videos')
      .select(`
        video_id,
        title,
        summary,
        article_content,
        thumbnail_url,
        video_url,
        view_count,
        display_order,
        created_at,
        category_id
      `)
      .eq('video_id', id)
      .is('deleted_at', null)
      .single();

    if (error || !article) {
      console.error('Error fetching article:', error);
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      article: {
        id: article.video_id,
        video_id: article.video_id,
        title: article.title,
        summary: article.summary,
        content: article.article_content,
        thumbnail_url: article.thumbnail_url,
        view_count: article.view_count,
        published_at: article.created_at,
        display_order: article.display_order,
      }
    });

  } catch (error) {
    console.error('Error in article detail API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
