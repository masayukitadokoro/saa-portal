import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// 検索履歴取得
export async function GET() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ history: [] });
  }

  const { data, error } = await supabase
    .from('search_history')
    .select('id, query, results_count, searched_at')
    .eq('user_id', user.id)
    .order('searched_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('History fetch error:', error);
    return NextResponse.json({ history: [] });
  }

  return NextResponse.json({ history: data });
}

// 検索履歴追加
export async function POST(request: Request) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { query, results_count } = await request.json();

  // 重複チェック（同じクエリが直近にあれば更新）
  const { data: existing } = await supabase
    .from('search_history')
    .select('id')
    .eq('user_id', user.id)
    .eq('query', query)
    .single();

  if (existing) {
    // 既存の履歴を更新
    await supabase
      .from('search_history')
      .update({ 
        results_count, 
        searched_at: new Date().toISOString() 
      })
      .eq('id', existing.id);
  } else {
    // 新規追加
    await supabase.from('search_history').insert({
      user_id: user.id,
      query,
      results_count,
    });
  }

  // 古い履歴を削除（20件以上の場合）
  const { data: allHistory } = await supabase
    .from('search_history')
    .select('id')
    .eq('user_id', user.id)
    .order('searched_at', { ascending: false });

  if (allHistory && allHistory.length > 20) {
    const idsToDelete = allHistory.slice(20).map(h => h.id);
    await supabase
      .from('search_history')
      .delete()
      .in('id', idsToDelete);
  }

  return NextResponse.json({ success: true });
}

// 検索履歴全削除
export async function DELETE() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await supabase
    .from('search_history')
    .delete()
    .eq('user_id', user.id);

  return NextResponse.json({ success: true });
}
