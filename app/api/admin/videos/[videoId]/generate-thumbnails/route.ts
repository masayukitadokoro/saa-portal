import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const FAL_KEY = process.env.FAL_KEY;

// 背景スタイルに応じたプロンプト
const BACKGROUND_PROMPTS: { [key: string]: string } = {
  'blue-gradient': 'modern blue gradient background, professional business style',
  'orange-gradient': 'warm orange gradient background, energetic startup vibe',
  'purple-gradient': 'creative purple gradient background, innovative tech style',
  'green-gradient': 'fresh green gradient background, growth and success theme',
  'dark': 'dark sophisticated background, premium business style',
  'light': 'clean white background, minimalist modern style',
};

async function generateSingleImage(prompt: string): Promise<{ url: string; prompt: string } | null> {
  try {
    console.log('Generating image with prompt:', prompt.substring(0, 100));
    
    // FAL.ai Flux schnell (最速・無料に近い)
    const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        image_size: {
          width: 1280,
          height: 720
        },
        num_images: 1,
        num_inference_steps: 4,
        enable_safety_checker: true,
      }),
    });

    const responseText = await response.text();
    console.log('FAL response status:', response.status);
    
    if (!response.ok) {
      console.error('FAL API error:', response.status, responseText);
      return null;
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response:', responseText);
      return null;
    }
    
    console.log('FAL result keys:', Object.keys(result));
    
    if (result.images?.[0]?.url) {
      return {
        url: result.images[0].url,
        prompt,
      };
    }
    
    console.error('No images in result:', result);
    return null;
  } catch (error) {
    console.error('Error generating image:', error);
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const body = await request.json();
    const { title, background_style, count = 2 } = body;

    console.log('Generate thumbnails request:', { videoId, title, background_style, count });

    if (!FAL_KEY) {
      console.error('FAL_KEY not set');
      return NextResponse.json(
        { error: 'FAL API key not configured' },
        { status: 500 }
      );
    }

    // 動画情報を取得
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('title, summary')
      .eq('video_id', videoId)
      .single();

    if (videoError || !video) {
      console.error('Video not found:', videoError);
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    const thumbnailTitle = title || video.title;
    const backgroundPrompt = BACKGROUND_PROMPTS[background_style] || BACKGROUND_PROMPTS['blue-gradient'];

    // サムネイル用のプロンプトバリエーション
    const promptVariations = [
      `YouTube thumbnail, ${backgroundPrompt}, bold text design, professional business content, high contrast, modern clean layout, 16:9 aspect ratio`,
      `Video thumbnail design, ${backgroundPrompt}, impactful typography style, startup entrepreneurship theme, eye-catching visual`,
    ];

    // 2枚生成
    const actualCount = Math.min(count, 2);
    const generatePromises = promptVariations.slice(0, actualCount).map(prompt => 
      generateSingleImage(prompt)
    );

    const results = await Promise.all(generatePromises);
    const thumbnails = results.filter(r => r !== null);

    console.log('Generated thumbnails:', thumbnails.length);

    if (thumbnails.length === 0) {
      return NextResponse.json(
        { error: '画像生成に失敗しました。もう一度お試しください。' },
        { status: 500 }
      );
    }

    // コスト計算（Flux schnell: 約$0.003/枚 = ¥0.5）
    const cost = {
      usd: thumbnails.length * 0.003,
      jpy: Math.ceil(thumbnails.length * 0.5)
    };

    return NextResponse.json({
      thumbnails,
      count: thumbnails.length,
      cost
    });

  } catch (error) {
    console.error('Error in generate-thumbnails:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
