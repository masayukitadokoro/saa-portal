import { NextRequest, NextResponse } from 'next/server';

const FAL_KEY = process.env.FAL_KEY;

export async function GET(request: NextRequest) {
  try {
    // FAL_KEYの確認
    if (!FAL_KEY) {
      return NextResponse.json({ 
        error: 'FAL_KEY not set',
        hasKey: false 
      });
    }

    // FALキーの一部を表示（デバッグ用）
    const keyPreview = FAL_KEY.substring(0, 10) + '...' + FAL_KEY.substring(FAL_KEY.length - 5);

    // テスト生成
    const testPrompt = 'A simple blue gradient background, minimalist design';
    
    const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: testPrompt,
        image_size: {
          width: 512,
          height: 512
        },
        num_images: 1,
        num_inference_steps: 4,
      }),
    });

    const responseText = await response.text();
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      return NextResponse.json({
        error: 'Failed to parse FAL response',
        status: response.status,
        responseText: responseText.substring(0, 500),
        keyPreview
      });
    }

    if (!response.ok) {
      return NextResponse.json({
        error: 'FAL API error',
        status: response.status,
        falError: result,
        keyPreview
      });
    }

    return NextResponse.json({
      success: true,
      hasKey: true,
      keyPreview,
      imageUrl: result.images?.[0]?.url || null,
      result
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Exception',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
