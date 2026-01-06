import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 認証チェック（管理者のみ）
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { video_id, title, style_prompt } = await request.json();

    if (!video_id || !title) {
      return NextResponse.json({ error: 'video_id and title are required' }, { status: 400 });
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // デフォルトのスタイルプロンプト
    const defaultStyle = `
      Professional YouTube thumbnail style for a business/startup education video.
      Clean, modern design with bold typography feel.
      Use a cohesive color palette (blue, white, dark gray).
      Minimalist illustration style, not photorealistic.
      16:9 aspect ratio, suitable for video thumbnail.
      No text or letters in the image.
    `;

    const fullPrompt = `
      Create a thumbnail image for a video titled: "${title}"
      
      Style requirements:
      ${style_prompt || defaultStyle}
    `;

    // DALL-E 3で画像生成
    const dalleResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: fullPrompt,
        n: 1,
        size: '1792x1024', // 16:9に近いアスペクト比
        quality: 'standard',
        response_format: 'b64_json'
      })
    });

    if (!dalleResponse.ok) {
      const error = await dalleResponse.json();
      console.error('DALL-E error:', error);
      return NextResponse.json({ error: 'Failed to generate image', details: error }, { status: 500 });
    }

    const dalleData = await dalleResponse.json();
    const base64Image = dalleData.data[0].b64_json;

    // Base64をBufferに変換
    const imageBuffer = Buffer.from(base64Image, 'base64');

    // Supabase Storageにアップロード
    const fileName = `${video_id}_${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('thumbnails')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload image', details: uploadError }, { status: 500 });
    }

    // 公開URLを取得
    const { data: { publicUrl } } = supabase.storage
      .from('thumbnails')
      .getPublicUrl(fileName);

    // DBのthumbnail_urlを更新
    const { error: updateError } = await supabase
      .from('videos')
      .update({ thumbnail_url: publicUrl })
      .eq('video_id', video_id);

    if (updateError) {
      console.error('DB update error:', updateError);
      return NextResponse.json({ error: 'Failed to update database', details: updateError }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      thumbnail_url: publicUrl,
      video_id 
    });

  } catch (error) {
    console.error('Thumbnail generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
