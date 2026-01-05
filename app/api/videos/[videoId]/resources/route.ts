import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 公開用資料取得（認証不要）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: resources, error } = await supabase
      .from('video_resources')
      .select('id, title, url, resource_type, display_order')
      .eq('video_id', videoId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Resources fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ resources: resources || [] });

  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
