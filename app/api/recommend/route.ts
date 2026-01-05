import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function GET() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ recommendations: [] });
  }

  // ユーザーの検索履歴を取得（最新5件）
  const { data: history } = await supabase
    .from('search_history')
    .select('query')
    .eq('user_id', user.id)
    .order('searched_at', { ascending: false })
    .limit(5);

  if (!history || history.length === 0) {
    return NextResponse.json({ recommendations: [] });
  }

  // 検索履歴を結合
  const combinedQuery = history.map(h => h.query).join(' ');

  try {
    // Embedding生成
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: combinedQuery,
    });

    const embedding = embeddingResponse.data[0].embedding;

    // 類似検索（Supabase RPC）
    const { data, error } = await supabase.rpc('match_videos', {
      query_embedding: embedding,
      match_threshold: 0.1,
      match_count: 3,
    });

    if (error) {
      console.error('Recommendation error:', error);
      return NextResponse.json({ recommendations: [] });
    }

    return NextResponse.json({ recommendations: data || [] });
  } catch (error) {
    console.error('OpenAI error:', error);
    return NextResponse.json({ recommendations: [] });
  }
}
