// generate-summaries.js
// 使い方: ANTHROPIC_API_KEY=your_key node generate-summaries.js

const { createClient } = require('@supabase/supabase-js');

// Supabase設定（.env.localから取得するか、直接設定）
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // service roleキーが必要

// Anthropic API
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase環境変数が設定されていません');
  console.log('以下を設定してください:');
  console.log('  NEXT_PUBLIC_SUPABASE_URL');
  console.log('  SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY が設定されていません');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function generateSummaryWithClaude(title, scriptText) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `以下は「${title}」という動画の書き起こしテキストです。

この動画の内容について、以下の形式でJSONを返してください：

{
  "summary": "動画の要約を2-3文で簡潔に（100-150文字程度）",
  "key_points": ["キーポイント1（20-30文字）", "キーポイント2", "キーポイント3"]
}

キーポイントは3-5個、それぞれ簡潔に。
JSONのみを返してください。説明は不要です。

---
${scriptText.substring(0, 8000)}
---`
        }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.content[0].text;
  
  // JSONをパース（コードブロックで囲まれている場合も対応）
  let jsonStr = content;
  if (content.includes('```')) {
    jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
  }
  
  return JSON.parse(jsonStr);
}

async function main() {
  console.log('🚀 要約生成を開始します...\n');

  // script_textがあってsummaryがない動画を取得
  const { data: videos, error } = await supabase
    .from('videos')
    .select('video_id, title, script_text')
    .not('script_text', 'is', null)
    .is('summary', null)
    .limit(10); // 一度に処理する件数を制限

  if (error) {
    console.error('❌ データベースエラー:', error);
    process.exit(1);
  }

  if (!videos || videos.length === 0) {
    console.log('✅ 処理対象の動画はありません（すべて要約済み、またはscript_textがない）');
    return;
  }

  console.log(`📹 ${videos.length}件の動画を処理します\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const video of videos) {
    console.log(`処理中: ${video.video_id} - ${video.title}`);
    
    try {
      // 要約生成
      const result = await generateSummaryWithClaude(video.title, video.script_text);
      
      // DBに保存
      const { error: updateError } = await supabase
        .from('videos')
        .update({
          summary: result.summary,
          key_points: result.key_points
        })
        .eq('video_id', video.video_id);

      if (updateError) {
        throw updateError;
      }

      console.log(`  ✅ 完了`);
      console.log(`     要約: ${result.summary.substring(0, 50)}...`);
      console.log(`     キーポイント: ${result.key_points.length}個\n`);
      successCount++;

      // レート制限対策で少し待機
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (err) {
      console.error(`  ❌ エラー: ${err.message}\n`);
      errorCount++;
    }
  }

  console.log('\n========== 完了 ==========');
  console.log(`✅ 成功: ${successCount}件`);
  console.log(`❌ 失敗: ${errorCount}件`);
}

main().catch(console.error);
