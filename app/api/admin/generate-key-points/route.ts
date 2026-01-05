import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

async function generateKeyPoints(title: string, articleContent: string): Promise<string[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `あなたは動画コンテンツの要点を抽出するアシスタントです。
与えられた記事内容から、視聴者が得られる主要な学びを5つのポイントにまとめてください。

【ルール】
- 各ポイントは1文で簡潔に（30-50文字程度）
- 具体的で実用的な内容にする
- 「〜する」「〜が重要」など動詞で終わる形式
- 専門用語はそのまま使用してOK`
      },
      {
        role: 'user',
        content: `【動画タイトル】
${title}

【記事内容】
${articleContent.substring(0, 3000)}

---
上記の内容から、この動画の5つの主要ポイントを抽出してください。
JSON配列形式で出力してください。例: ["ポイント1", "ポイント2", ...]`
      }
    ],
    temperature: 0.3,
    max_tokens: 500,
  });

  const content = response.choices[0]?.message?.content || '[]';
  const match = content.match(/\[[\s\S]*\]/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {
      return [];
    }
  }
  return [];
}

export async function POST() {
  try {
    // key_pointsがない動画を取得
    const { data: videos, error } = await supabase
      .from('videos')
      .select('video_id, title, article_content')
      .or('key_points.is.null,key_points.eq.[]')
      .not('article_content', 'is', null)
      .order('video_id');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!videos || videos.length === 0) {
      return NextResponse.json({ message: '処理対象の動画がありません', results: [] });
    }

    const results: { video_id: string; title: string; status: string; points?: string[] }[] = [];

    for (const video of videos) {
      try {
        const keyPoints = await generateKeyPoints(video.title, video.article_content);
        
        if (keyPoints.length > 0) {
          const { error: updateError } = await supabase
            .from('videos')
            .update({ key_points: keyPoints })
            .eq('video_id', video.video_id);

          if (updateError) {
            results.push({ video_id: video.video_id, title: video.title, status: 'error', points: [] });
          } else {
            results.push({ video_id: video.video_id, title: video.title, status: 'success', points: keyPoints });
          }
        } else {
          results.push({ video_id: video.video_id, title: video.title, status: 'no_points' });
        }
      } catch {
        results.push({ video_id: video.video_id, title: video.title, status: 'error' });
      }

      // API制限対策
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status !== 'success').length;

    return NextResponse.json({
      message: `完了: 成功${successCount}本, エラー${errorCount}本`,
      total: videos.length,
      successCount,
      errorCount,
      results
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
