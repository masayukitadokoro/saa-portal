import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// グラデーション背景のSVGを生成
function createGradientSVG(
  width: number, 
  height: number, 
  colors: string[]
): string {
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors[0]};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors[1]};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)"/>
    </svg>
  `;
}

// テキストを含むSVGを生成（日本語対応）
function createTextSVG(
  width: number,
  height: number,
  title: string,
  titlePosition: 'left' | 'center' | 'right',
  textColor: string = 'white',
  fontSize: number = 64
): string {
  // テキストを改行で分割（長い場合）
  const maxCharsPerLine = 12;
  const lines: string[] = [];
  let currentLine = '';
  
  for (const char of title) {
    if (currentLine.length >= maxCharsPerLine) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine += char;
    }
  }
  if (currentLine) lines.push(currentLine);
  
  // 位置計算
  let textAnchor = 'start';
  let xPosition = 60;
  
  if (titlePosition === 'center') {
    textAnchor = 'middle';
    xPosition = width / 2;
  } else if (titlePosition === 'right') {
    textAnchor = 'end';
    xPosition = width - 350; // 右側に話者画像のスペースを確保
  }
  
  const lineHeight = fontSize * 1.3;
  const totalTextHeight = lines.length * lineHeight;
  const startY = (height - totalTextHeight) / 2 + fontSize;
  
  const textElements = lines.map((line, index) => 
    `<text 
      x="${xPosition}" 
      y="${startY + index * lineHeight}" 
      font-family="Noto Sans JP, Hiragino Sans, sans-serif" 
      font-size="${fontSize}" 
      font-weight="bold" 
      fill="${textColor}"
      text-anchor="${textAnchor}"
      style="filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.5));"
    >${escapeXml(line)}</text>`
  ).join('\n');
  
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      ${textElements}
    </svg>
  `;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const body = await request.json();
    const { 
      title,
      backgroundUrl,        // AI生成した背景画像URL（オプション）
      backgroundStyle,      // グラデーションスタイルID
      backgroundColors,     // グラデーション色 [color1, color2]
      speakerImageUrl,      // 話者画像URL（オプション）
      showSpeaker = true,
      titlePosition = 'left',
      textColor = 'white',
      fontSize = 64
    } = body;

    const width = 1280;
    const height = 720;

    // 動的インポート（Vercel環境対応）
    const sharp = (await import('sharp')).default;

    // 1. 背景画像を準備
    let backgroundBuffer: Buffer;
    
    if (backgroundUrl) {
      // AI生成した背景画像を使用
      const bgResponse = await fetch(backgroundUrl);
      if (!bgResponse.ok) {
        throw new Error('背景画像の取得に失敗しました');
      }
      const bgArrayBuffer = await bgResponse.arrayBuffer();
      backgroundBuffer = await sharp(Buffer.from(bgArrayBuffer))
        .resize(width, height, { fit: 'cover' })
        .toBuffer();
    } else {
      // グラデーション背景を生成
      const colors = backgroundColors || ['#1e40af', '#3b82f6'];
      const gradientSVG = createGradientSVG(width, height, colors);
      backgroundBuffer = await sharp(Buffer.from(gradientSVG))
        .png()
        .toBuffer();
    }

    // 2. テキストオーバーレイを準備
    const textSVG = createTextSVG(
      width, 
      height, 
      title || '起業の科学', 
      titlePosition,
      textColor,
      fontSize
    );
    const textBuffer = Buffer.from(textSVG);

    // 3. 合成処理
    const composites: { input: Buffer; top: number; left: number }[] = [
      { input: textBuffer, top: 0, left: 0 }
    ];

    // 4. 話者画像を追加（オプション）
    if (showSpeaker && speakerImageUrl) {
      try {
        const speakerResponse = await fetch(speakerImageUrl);
        if (speakerResponse.ok) {
          const speakerArrayBuffer = await speakerResponse.arrayBuffer();
          const speakerBuffer = await sharp(Buffer.from(speakerArrayBuffer))
            .resize(400, 500, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .toBuffer();
          
          composites.push({
            input: speakerBuffer,
            top: height - 500 - 20, // 下から20px
            left: width - 400 - 40  // 右から40px
          });
        }
      } catch (err) {
        console.error('話者画像の読み込みエラー:', err);
        // 話者画像がなくても続行
      }
    }

    // 5. 最終合成
    const finalImage = await sharp(backgroundBuffer)
      .composite(composites)
      .jpeg({ quality: 90 })
      .toBuffer();

    // 6. Supabase Storageにアップロード
    const fileName = `thumbnail-${videoId}-${Date.now()}.jpg`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('thumbnails')
      .upload(fileName, finalImage, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('サムネイルのアップロードに失敗しました');
    }

    // 公開URLを取得
    const { data: { publicUrl } } = supabase.storage
      .from('thumbnails')
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName
    });

  } catch (error) {
    console.error('Error in compose-thumbnail:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '画像合成に失敗しました' },
      { status: 500 }
    );
  }
}
