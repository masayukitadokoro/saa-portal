import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// スタイル一覧取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 全スタイルを取得（全管理者が参照可能）
    const { data: styles, error } = await supabase
      .from('thumbnail_styles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Styles fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ styles: styles || [] });

  } catch (error) {
    console.error('Error fetching styles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// スタイル保存
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, color_scheme, style, mood, elements, custom_prompt, preview_url } = body;

    if (!name || !color_scheme || !style || !mood || !elements) {
      return NextResponse.json({ error: 'Required fields are missing' }, { status: 400 });
    }

    const { data: newStyle, error } = await supabase
      .from('thumbnail_styles')
      .insert({
        name,
        color_scheme,
        style,
        mood,
        elements,
        custom_prompt: custom_prompt || null,
        preview_url: preview_url || null,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Style insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ style: newStyle });

  } catch (error) {
    console.error('Error saving style:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
