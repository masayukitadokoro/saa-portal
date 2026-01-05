import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// 資料一覧取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const supabase = await createClient();
    
    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: resources, error } = await supabase
      .from('video_resources')
      .select('*')
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

// 資料一括更新（追加・更新・削除）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const supabase = await createClient();
    
    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { resources } = body;

    if (!Array.isArray(resources)) {
      return NextResponse.json({ error: 'Invalid resources data' }, { status: 400 });
    }

    // 最大5件チェック
    const activeResources = resources.filter((r: { isDeleted?: boolean }) => !r.isDeleted);
    if (activeResources.length > 5) {
      return NextResponse.json({ error: '資料は最大5件までです' }, { status: 400 });
    }

    // 削除対象を処理
    const toDelete = resources.filter((r: { id?: string; isDeleted?: boolean }) => r.id && r.isDeleted);
    for (const r of toDelete) {
      await supabase
        .from('video_resources')
        .delete()
        .eq('id', r.id);
    }

    // 更新・追加対象を処理
    const toUpsert = resources.filter((r: { isDeleted?: boolean }) => !r.isDeleted);
    const results = [];

    for (let i = 0; i < toUpsert.length; i++) {
      const r = toUpsert[i];
      const resourceData = {
        video_id: videoId,
        title: r.title,
        url: r.url,
        resource_type: r.resource_type || 'other',
        display_order: i
      };

      if (r.id && !r.isNew) {
        // 更新
        const { data, error } = await supabase
          .from('video_resources')
          .update(resourceData)
          .eq('id', r.id)
          .select()
          .single();
        
        if (error) {
          console.error('Resource update error:', error);
          continue;
        }
        results.push(data);
      } else {
        // 新規作成
        const { data, error } = await supabase
          .from('video_resources')
          .insert(resourceData)
          .select()
          .single();
        
        if (error) {
          console.error('Resource insert error:', error);
          continue;
        }
        results.push(data);
      }
    }

    // 最新の資料一覧を取得して返す
    const { data: updatedResources, error: fetchError } = await supabase
      .from('video_resources')
      .select('*')
      .eq('video_id', videoId)
      .order('display_order', { ascending: true });

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json({ resources: updatedResources || [] });

  } catch (error) {
    console.error('Error updating resources:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
