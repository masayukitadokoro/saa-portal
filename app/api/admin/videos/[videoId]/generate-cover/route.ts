import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await context.params;
    const body = await request.json();
    const { customPrompt } = body;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 動画情報を取得
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('video_id, title, summary, key_points, article_content, transcript')
      .eq('video_id', videoId)
      .is('deleted_at', null)
      .single();

    if (videoError || !video) {
      return NextResponse.json(
        { error: '動画が見つかりません' },
        { status: 404 }
      );
    }

    // Step 1: GPT-4o-miniで記事からビジュアルコンセプトを抽出
    let imagePrompt: string;
    
    if (customPrompt) {
      imagePrompt = customPrompt;
    } else {
      const visualConcept = await extractVisualConcept(video);
      imagePrompt = buildFluxPrompt(visualConcept);
    }

    console.log('Generating cover image with FAL.ai Flux:', imagePrompt);

    // Step 2: FAL.ai で画像生成
    const falResponse = await fetch('https://fal.run/fal-ai/flux-pro/v1.1', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: imagePrompt,
        image_size: 'landscape_16_9',
        num_images: 1,
        enable_safety_checker: true,
        safety_tolerance: '2',
        output_format: 'jpeg',
      }),
    });

    if (!falResponse.ok) {
      const errorText = await falResponse.text();
      console.error('FAL.ai error:', errorText);
      return NextResponse.json(
        { error: `FAL.ai API エラー: ${falResponse.status}` },
        { status: 500 }
      );
    }

    const falResult = await falResponse.json();
    console.log('FAL.ai result:', falResult);

    // FAL.aiのレスポンスから画像URLを取得
    const generatedImageUrl = falResult.images?.[0]?.url;

    if (!generatedImageUrl) {
      console.error('Invalid FAL.ai output:', falResult);
      return NextResponse.json(
        { error: '画像URLの取得に失敗しました' },
        { status: 500 }
      );
    }

    // 生成された画像をダウンロード
    const imageResponse = await fetch(generatedImageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json({
        coverUrl: generatedImageUrl,
        temporary: true,
        cost: { usd: 0.04, jpy: 6 }
      });
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const fileName = `cover-${videoId}-${Date.now()}.jpg`;

    // Supabaseにアップロード
    const { error: uploadError } = await supabase.storage
      .from('article-covers')
      .upload(fileName, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({
        coverUrl: generatedImageUrl,
        temporary: true,
        cost: { usd: 0.04, jpy: 6 }
      });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('article-covers')
      .getPublicUrl(fileName);

    // 動画レコードを更新
    await supabase
      .from('videos')
      .update({ 
        article_cover_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('video_id', videoId);

    return NextResponse.json({
      coverUrl: publicUrl,
      cost: { usd: 0.04, jpy: 6 },
      model: 'fal-ai/flux-pro/v1.1'
    });

  } catch (error) {
    console.error('Error generating cover:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `画像生成エラー: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: '画像生成中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

interface VideoContext {
  title: string;
  summary?: string | null;
  key_points?: string[] | null;
  article_content?: string | null;
}

interface VisualConcept {
  core_message: string;
  visual_metaphor: string;
  color_mood: string;
  style_notes: string;
}

// Step 1: GPT-4o-miniで記事からビジュアルコンセプトを抽出
async function extractVisualConcept(video: VideoContext): Promise<VisualConcept> {
  const articleExcerpt = video.article_content?.substring(0, 1500) || '';
  const keyPointsText = video.key_points?.slice(0, 5).join('\n- ') || '';
  
  const prompt = `あなたはビジネス教育コンテンツのカバー画像を企画するクリエイティブディレクターです。
以下の記事を読んで、カバー画像のビジュアルコンセプトを提案してください。

【記事タイトル】
${video.title}

【記事の要約】
${video.summary || '(なし)'}

【キーポイント】
${keyPointsText ? `- ${keyPointsText}` : '(なし)'}

【記事本文（冒頭）】
${articleExcerpt || '(なし)'}

---

以下の形式でJSON出力してください（visual_metaphorは英語で、他は日本語で）：

{
  "core_message": "この記事が伝えたい核心メッセージ（1文）",
  "visual_metaphor": "記事の内容を表現するビジュアルメタファー（英語、非常に具体的で視覚的に描写可能なシーン、80語以内）",
  "color_mood": "warm/cool/contrast/earthy から選択",
  "style_notes": "追加のスタイル指示（英語、30語以内）"
}

ビジュアルメタファーの良い例（具体的かつ象徴的）：
- 良いアイデア → "A glowing lightbulb emerging from a maze of discarded crumpled papers, with one paper airplane successfully flying upward toward bright sunlight"
- 大企業の失敗 → "A massive cruise ship stuck in shallow water while small sailboats navigate freely toward the horizon"
- PMF達成 → "A golden key hovering before a glowing keyhole, with puzzle pieces floating and connecting in mid-air around them"
- 資金調達 → "A small seedling in cupped hands transforming into a flourishing tree with golden coins as leaves"
- タイミング → "A surfer perfectly positioned on a massive wave crest, with other surfers either too early or too late"

必ず有効なJSONのみを出力してください。`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 600,
    });

    const content = response.choices[0]?.message?.content || '';
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        core_message: parsed.core_message || video.title,
        visual_metaphor: parsed.visual_metaphor || 'Abstract business growth concept with geometric shapes',
        color_mood: parsed.color_mood || 'cool',
        style_notes: parsed.style_notes || 'professional and modern',
      };
    }
  } catch (error) {
    console.error('Error extracting visual concept:', error);
  }

  return generateFallbackConcept(video.title);
}

function generateFallbackConcept(title: string): VisualConcept {
  const keywords: { [key: string]: VisualConcept } = {
    'アイデア': {
      core_message: '良いアイデアの本質',
      visual_metaphor: 'A brilliant lightbulb emerging from a labyrinth of crumpled paper balls, with one origami crane flying upward toward golden sunlight breaking through clouds',
      color_mood: 'warm',
      style_notes: 'inspirational, breakthrough moment, dramatic lighting',
    },
    '失敗': {
      core_message: '失敗から学ぶ教訓',
      visual_metaphor: 'A broken bridge being reconstructed with golden beams, with a phoenix rising from the gap, symbolizing transformation through failure',
      color_mood: 'contrast',
      style_notes: 'dramatic, transformation, hope emerging from darkness',
    },
    'BigTech': {
      core_message: '大企業の課題',
      visual_metaphor: 'A massive ancient galleon ship stuck in shallow waters while nimble modern speedboats navigate freely toward a bright horizon',
      color_mood: 'cool',
      style_notes: 'scale contrast, movement vs stagnation',
    },
    '大企業': {
      core_message: '大企業とスタートアップの違い',
      visual_metaphor: 'A giant ancient oak tree with roots visibly constraining it, while young bamboo shoots grow rapidly and flexibly beside it reaching for light',
      color_mood: 'earthy',
      style_notes: 'nature metaphor, growth contrast, organic',
    },
    'PMF': {
      core_message: 'プロダクトマーケットフィット',
      visual_metaphor: 'A crystalline key perfectly fitting into an ornate glowing lock, with jigsaw puzzle pieces floating and clicking together in a spiral around them',
      color_mood: 'warm',
      style_notes: 'satisfying fit, achievement, magical realism',
    },
    'MVP': {
      core_message: '最小限の製品で検証',
      visual_metaphor: 'A simple paper airplane soaring high above elaborate unfinished aircraft blueprints scattered on a workshop table below',
      color_mood: 'cool',
      style_notes: 'simplicity wins, contrast between simple and complex',
    },
    '資金調達': {
      core_message: 'スタートアップの資金戦略',
      visual_metaphor: 'Seeds in an open palm transforming into saplings then into a majestic tree with golden leaves, against a sunrise sky gradient',
      color_mood: 'warm',
      style_notes: 'growth progression, prosperity, potential',
    },
    'スタートアップ': {
      core_message: 'スタートアップの挑戦',
      visual_metaphor: 'A sleek rocket launching from a humble garage workshop, trail of light ascending into a starfield of possibilities',
      color_mood: 'contrast',
      style_notes: 'aspiration, humble beginnings to greatness, dynamic',
    },
    '起業': {
      core_message: '起業家精神',
      visual_metaphor: 'A figure standing at a doorway opening from a dim room into a vast luminous landscape of rolling hills and distant cities',
      color_mood: 'warm',
      style_notes: 'new beginnings, courage, vast opportunity',
    },
  };

  for (const [keyword, concept] of Object.entries(keywords)) {
    if (title.includes(keyword)) {
      return concept;
    }
  }

  return {
    core_message: title,
    visual_metaphor: 'An abstract geometric composition of rising interconnected nodes and pathways, suggesting growth, connection, and forward momentum in business',
    color_mood: 'cool',
    style_notes: 'professional, modern, forward-thinking, editorial style',
  };
}

function buildFluxPrompt(concept: VisualConcept): string {
  const colorPalettes: { [key: string]: string } = {
    warm: 'warm golden amber and soft orange tones with cream highlights',
    cool: 'deep blue teal and silver tones with subtle white accents',
    contrast: 'dramatic contrast of deep navy with vibrant orange and gold accents',
    earthy: 'rich browns forest greens and warm terracotta with natural textures',
  };

  const palette = colorPalettes[concept.color_mood] || colorPalettes.cool;

  return `${concept.visual_metaphor}

Style: Modern editorial illustration, sophisticated magazine cover quality, ${concept.style_notes}
Color palette: ${palette}
Composition: Clean with clear focal point, subtle depth and dimensionality
Quality: Ultra high detail, professional, visually striking

Important: No text, no words, no letters, no numbers, no human faces. Use symbolic and metaphorical imagery only. The image should feel premium, intellectual, and suitable for a business education publication like Harvard Business Review or The Economist.`;
}
