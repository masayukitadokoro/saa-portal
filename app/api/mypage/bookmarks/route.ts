import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // ブックマーク取得
    const { data: bookmarks, error } = await supabase
      .from('bookmarks')
      .select('id, video_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching bookmarks:', error);
      return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 });
    }

    // 動画情報を取得（video_url, duration, view_countを追加！）
    if (bookmarks && bookmarks.length > 0) {
      const videoIds = bookmarks.map(b => b.video_id);
      const { data: videos } = await supabase
        .from('videos')
        .select('video_id, title, thumbnail_url, custom_thumbnail_url, video_url, duration, view_count, display_order')
        .in('video_id', videoIds);

      const videoMap = new Map(videos?.map(v => [v.video_id, v]) || []);
      
      const enrichedBookmarks = bookmarks.map(b => ({
        ...b,
        ...videoMap.get(b.video_id)
      }));

      return NextResponse.json({ bookmarks: enrichedBookmarks });
    }

    return NextResponse.json({ bookmarks: [] });

  } catch (error) {
    console.error('Error in bookmarks API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { video_id } = body;

    if (!video_id) {
      return NextResponse.json({ error: 'video_id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('bookmarks')
      .insert({
        user_id: user.id,
        video_id
      })
      .select()
      .single();

    if (error) {
      // 既に存在する場合はエラーにならないように
      if (error.code === '23505') {
        return NextResponse.json({ message: 'Already bookmarked' });
      }
      console.error('Error adding bookmark:', error);
      return NextResponse.json({ error: 'Failed to add bookmark' }, { status: 500 });
    }

    return NextResponse.json({ bookmark: data });

  } catch (error) {
    console.error('Error in bookmarks API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const video_id = searchParams.get('video_id');

    if (!video_id) {
      return NextResponse.json({ error: 'video_id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('video_id', video_id);

    if (error) {
      console.error('Error removing bookmark:', error);
      return NextResponse.json({ error: 'Failed to remove bookmark' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in bookmarks API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
