import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 記事コンテンツがある動画を取得
    const { data: articles, error } = await supabase
      .from('videos')
      .select(`
        video_id,
        title,
        summary,
        article_content,
        article_cover_url,
        thumbnail_url,
        custom_thumbnail_url,
        video_url,
        view_count,
        display_order,
        created_at
      `)
      .not('article_content', 'is', null)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching articles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch articles' },
        { status: 500 }
      );
    }

    // 記事コンテンツが空でないものだけフィルタし、フィールド名を統一
    const validArticles = (articles || [])
      .filter(article => article.article_content && article.article_content.trim().length > 0)
      .map(article => ({
        video_id: article.video_id,
        title: article.title,
        description: article.summary,
        // サムネイルの優先順位: article_cover_url > custom_thumbnail_url > thumbnail_url
        thumbnail_url: article.article_cover_url || article.custom_thumbnail_url || article.thumbnail_url,
        view_count: article.view_count,
        display_order: article.display_order,
        published_at: article.created_at,
      }));

    return NextResponse.json({
      articles: validArticles,
      total: validArticles.length
    });

  } catch (error) {
    console.error('Error in articles API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
