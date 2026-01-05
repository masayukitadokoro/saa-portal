import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// ブックマーク一覧を取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const { data: bookmarks, error } = await supabase
      .from('bookmarks')
      .select(`
        id,
        video_id,
        created_at,
        videos (
          id,
          title,
          thumbnail_url,
          duration,
          category,
          display_order
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching bookmarks:', error);
      return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 });
    }

    return NextResponse.json({ bookmarks: bookmarks || [] });

  } catch (error) {
    console.error('Error in bookmarks API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ブックマークを追加
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { video_id } = await request.json();

    if (!video_id) {
      return NextResponse.json({ error: 'video_id is required' }, { status: 400 });
    }

    // 既存のブックマークを確認
    const { data: existing } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('video_id', video_id)
      .single();

    if (existing) {
      return NextResponse.json({ message: 'Already bookmarked', id: existing.id });
    }

    // 新規追加
    const { data: bookmark, error } = await supabase
      .from('bookmarks')
      .insert({
        user_id: user.id,
        video_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating bookmark:', error);
      return NextResponse.json({ error: 'Failed to create bookmark' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Bookmarked successfully', id: bookmark.id });

  } catch (error) {
    console.error('Error in bookmarks API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
