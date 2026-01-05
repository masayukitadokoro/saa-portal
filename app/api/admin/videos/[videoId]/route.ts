import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await context.params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: video, error } = await supabase
      .from('videos')
      .select('*')
      .eq('video_id', videoId)
      .is('deleted_at', null)
      .single();

    if (error || !video) {
      return NextResponse.json(
        { error: '動画が見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({ video });

  } catch (error) {
    console.error('Error fetching video:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await context.params;
    const body = await request.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 更新可能なフィールド
    const allowedFields = [
      'title',
      'description',
      'category_id',
      'order_in_category',
      'summary',
      'key_points',
      'transcript',
      'transcript_updated_at',
      'thumbnail_url',
      'custom_thumbnail_url',
      'article_content',
      'article_status',
      'article_cover_url',
      'article_tags',
      'article_published_at'
    ];

    // 許可されたフィールドのみ抽出
    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    updateData.updated_at = new Date().toISOString();

    const { data: video, error } = await supabase
      .from('videos')
      .update(updateData)
      .eq('video_id', videoId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      console.error('Error updating video:', error);
      return NextResponse.json(
        { error: '更新に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({ video });

  } catch (error) {
    console.error('Error in PATCH:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await context.params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 論理削除
    const { error } = await supabase
      .from('videos')
      .update({ deleted_at: new Date().toISOString() })
      .eq('video_id', videoId);

    if (error) {
      return NextResponse.json(
        { error: '削除に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
