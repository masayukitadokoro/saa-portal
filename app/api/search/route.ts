import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    if (!query) {
      return NextResponse.json({ error: 'クエリが必要です' }, { status: 400 });
    }

    // 1. クエリをベクトル化
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // 2. 動画データを取得（thumbnail_url, custom_thumbnail_urlを追加）
    const { data: videos, error: searchError } = await supabase
      .from('videos')
      .select('id, video_id, title, script_text, video_url, tags, embedding, duration, thumbnail_url, custom_thumbnail_url')
      .not('embedding', 'is', null);

    if (searchError) {
      console.error('Search error:', searchError);
      throw new Error('検索に失敗しました');
    }

    if (!videos || videos.length === 0) {
      return NextResponse.json({ results: [] });
    }

    // 3. 類似度を計算してソート
    const videosWithSimilarity = videos.map(video => {
      let embedding = video.embedding;
      
      // embeddingの形式を正規化
      if (typeof embedding === 'string') {
        try {
          embedding = JSON.parse(embedding);
        } catch {
          // パース失敗時は空配列
          embedding = [];
        }
      }
      
      // 配列でない場合や空の場合はスキップ
      if (!Array.isArray(embedding) || embedding.length === 0) {
        return { ...video, similarity: 0 };
      }
      
      const similarity = cosineSimilarity(queryEmbedding, embedding);
      return { ...video, similarity: isNaN(similarity) ? 0 : similarity };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);

    // 4. Claude APIでコメント生成
    const results = await generateComments(query, videosWithSimilarity);
    return NextResponse.json({ results });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) {
    return 0;
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    const valA = Number(a[i]) || 0;
    const valB = Number(b[i]) || 0;
    dotProduct += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  
  return dotProduct / denominator;
}

async function generateComments(query: string, videos: any[]) {
  const prompt = `ユーザーの質問: 「${query}」

以下の動画リストから、なぜ各動画がこの質問に関連するかを簡潔に説明し、該当箇所を引用してください。
JSON形式で回答してください:
[{"index": 1, "comment": "関連する理由", "relevant_excerpt": "該当する引用部分"}]

動画リスト:
${videos.map((v, i) => `${i + 1}. タイトル: ${v.title}\n内容: ${v.script_text?.substring(0, 500) || ''}...`).join('\n\n')}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    const comments = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return videos.map((video, index) => ({
      video_id: video.video_id,
      title: video.title,
      video_url: video.video_url,
      duration: video.duration,
      thumbnail_url: video.thumbnail_url,
      custom_thumbnail_url: video.custom_thumbnail_url,
      similarity: video.similarity,
      comment: comments[index]?.comment || '関連動画です',
      relevant_excerpt: comments[index]?.relevant_excerpt || video.script_text?.substring(0, 100) || '',
    }));
  } catch (error) {
    console.error('Comment generation error:', error);
    return videos.map((video) => ({
      video_id: video.video_id,
      title: video.title,
      video_url: video.video_url,
      duration: video.duration,
      thumbnail_url: video.thumbnail_url,
      custom_thumbnail_url: video.custom_thumbnail_url,
      similarity: video.similarity,
      comment: '関連動画です',
      relevant_excerpt: video.script_text?.substring(0, 100) || '',
    }));
  }
}
