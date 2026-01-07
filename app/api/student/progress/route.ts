import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// 視聴進捗を更新
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { video_id, progress_percent, last_position_seconds, is_completed } = await request.json();

    if (!video_id) {
      return NextResponse.json({ error: 'video_id is required' }, { status: 400 });
    }

    // 既存の進捗があるか確認
    const { data: existing } = await supabase
      .from('saa_video_progress')
      .select('id, is_completed')
      .eq('user_id', user.id)
      .eq('video_id', video_id)
      .single();

    const now = new Date().toISOString();
    
    if (existing) {
      // 既に完了している場合は完了状態を維持
      const updateData: Record<string, unknown> = {
        progress_percent: progress_percent ?? existing.progress_percent,
        last_position_seconds: last_position_seconds ?? 0,
        updated_at: now,
      };

      // 新たに完了した場合のみ is_completed と completed_at を更新
      if (is_completed && !existing.is_completed) {
        updateData.is_completed = true;
        updateData.completed_at = now;
      }

      const { error: updateError } = await supabase
        .from('saa_video_progress')
        .update(updateData)
        .eq('id', existing.id);

      if (updateError) {
        console.error('Error updating progress:', updateError);
        return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
      }
    } else {
      // 新規作成
      const { error: insertError } = await supabase
        .from('saa_video_progress')
        .insert({
          user_id: user.id,
          video_id,
          progress_percent: progress_percent ?? 0,
          last_position_seconds: last_position_seconds ?? 0,
          is_completed: is_completed ?? false,
          completed_at: is_completed ? now : null,
        });

      if (insertError) {
        console.error('Error inserting progress:', insertError);
        return NextResponse.json({ error: 'Failed to create progress' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in progress API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 特定動画の進捗を取得
export async function GET(request: NextRequest) {
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

    const { data, error } = await supabase
      .from('saa_video_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('video_id', video_id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching progress:', error);
      return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
    }

    return NextResponse.json({ progress: data || null });

  } catch (error) {
    console.error('Error in progress API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
