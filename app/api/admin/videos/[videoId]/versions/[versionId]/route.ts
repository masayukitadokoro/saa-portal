import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 特定のバージョンを取得
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ videoId: string; versionId: string }> }
) {
  try {
    const { videoId, versionId } = await context.params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: version, error } = await supabase
      .from('article_versions')
      .select('*')
      .eq('id', versionId)
      .eq('video_id', videoId)
      .single();

    if (error || !version) {
      return NextResponse.json(
        { error: 'バージョンが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({ version });

  } catch (error) {
    console.error('Error in GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// バージョンを削除
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ videoId: string; versionId: string }> }
) {
  try {
    const { videoId, versionId } = await context.params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from('article_versions')
      .delete()
      .eq('id', versionId)
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
