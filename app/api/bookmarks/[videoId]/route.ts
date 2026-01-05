import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// ブックマーク状態を確認
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { videoId } = await params;

    const { data: bookmark } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('video_id', videoId)
      .single();

    return NextResponse.json({ 
      isBookmarked: !!bookmark,
      bookmarkId: bookmark?.id || null 
    });

  } catch (error) {
    console.error('Error checking bookmark:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ブックマークを削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { videoId } = await params;

    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('video_id', videoId);

    if (error) {
      console.error('Error deleting bookmark:', error);
      return NextResponse.json({ error: 'Failed to delete bookmark' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Bookmark deleted successfully' });

  } catch (error) {
    console.error('Error in bookmark delete API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
