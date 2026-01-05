import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 履歴一覧取得（最新5件）
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await context.params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: versions, error } = await supabase
      .from('article_versions')
      .select('id, tone_type, tone_label, char_count, created_at')
      .eq('video_id', videoId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching versions:', error);
      return NextResponse.json(
        { error: '履歴の取得に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({ versions: versions || [] });

  } catch (error) {
    console.error('Error in GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 新しいバージョンを保存
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await context.params;
    const body = await request.json();
    const { content, tone_type, tone_label } = body;

    if (!content || !tone_type || !tone_label) {
      return NextResponse.json(
        { error: '必須項目が不足しています' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 新しいバージョンを保存
    const { data: newVersion, error: insertError } = await supabase
      .from('article_versions')
      .insert({
        video_id: videoId,
        content,
        tone_type,
        tone_label,
        char_count: content.length
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting version:', insertError);
      return NextResponse.json(
        { error: '保存に失敗しました' },
        { status: 500 }
      );
    }

    // 古いバージョンを削除（5件を超えた分）
    const { data: allVersions } = await supabase
      .from('article_versions')
      .select('id')
      .eq('video_id', videoId)
      .order('created_at', { ascending: false });

    if (allVersions && allVersions.length > 5) {
      const idsToDelete = allVersions.slice(5).map(v => v.id);
      await supabase
        .from('article_versions')
        .delete()
        .in('id', idsToDelete);
    }

    return NextResponse.json({ version: newVersion });

  } catch (error) {
    console.error('Error in POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
