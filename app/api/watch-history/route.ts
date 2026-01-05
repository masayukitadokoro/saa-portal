import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// 視聴履歴を取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const categoryId = searchParams.get('category_id');

    let query = supabase
      .from('watch_history')
      .select(`
        id,
        video_id,
        watched_at,
        watch_duration_seconds,
        completed,
        last_position_seconds,
        videos (
          video_id,
          title,
          thumbnail_url,
          duration,
          level,
          category_id
        )
      `)
      .eq('user_id', user.id)
      .order('watched_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Watch history fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // カテゴリでフィルタリング（必要な場合）
    let filteredData = data;
    if (categoryId) {
      filteredData = data?.filter((item: any) => 
        item.videos?.category_id === parseInt(categoryId)
      );
    }

    return NextResponse.json({ 
      watchHistory: filteredData || [],
      count: filteredData?.length || 0
    });

  } catch (error) {
    console.error('Error fetching watch history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 視聴履歴を追加
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      video_id, 
      completed = false, 
      watch_duration_seconds = 0,
      last_position_seconds = 0 
    } = await request.json();

    if (!video_id) {
      return NextResponse.json({ error: 'video_id is required' }, { status: 400 });
    }

    // upsert: 既存なら更新、なければ挿入
    const { data, error } = await supabase
      .from('watch_history')
      .upsert({
        user_id: user.id,
        video_id,
        watched_at: new Date().toISOString(),
        watch_duration_seconds,
        completed,
        last_position_seconds
      }, {
        onConflict: 'user_id,video_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Watch history add error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Error adding watch history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
