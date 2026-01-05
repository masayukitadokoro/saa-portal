import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET: 話者画像一覧を取得
export async function GET() {
  try {
    // Supabase Storageから画像一覧を取得
    const { data: files, error } = await supabase.storage
      .from('speaker-images')
      .list('', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error('Error listing speaker images:', error);
      // フォールバック: デフォルト画像を返す
      return NextResponse.json({
        images: []
      });
    }

    // 画像ファイルのみをフィルター
    const imageFiles = (files || []).filter(f => 
      f.name.match(/\.(jpg|jpeg|png|webp|gif)$/i)
    );

    // 公開URLを生成
    const images = imageFiles.map(file => {
      const { data: { publicUrl } } = supabase.storage
        .from('speaker-images')
        .getPublicUrl(file.name);

      // ファイル名からポーズを推測
      const pose = extractPoseFromFilename(file.name);

      return {
        id: file.id || file.name,
        name: '田所雅之',
        url: publicUrl,
        pose,
        filename: file.name
      };
    });

    return NextResponse.json({ images });

  } catch (error) {
    console.error('Error in speaker-images GET:', error);
    return NextResponse.json({ images: [] });
  }
}

// POST: 話者画像をアップロード
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const pose = formData.get('pose') as string || '標準';

    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが必要です' },
        { status: 400 }
      );
    }

    // ファイル名を生成
    const ext = file.name.split('.').pop();
    const timestamp = Date.now();
    const safePose = pose.replace(/[^a-zA-Z0-9ぁ-んァ-ン一-龯]/g, '-');
    const fileName = `tadokoro-${safePose}-${timestamp}.${ext}`;

    // Supabase Storageにアップロード
    const { data, error } = await supabase.storage
      .from('speaker-images')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return NextResponse.json(
        { error: 'アップロードに失敗しました' },
        { status: 500 }
      );
    }

    // 公開URLを取得
    const { data: { publicUrl } } = supabase.storage
      .from('speaker-images')
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      image: {
        id: fileName,
        name: '田所雅之',
        url: publicUrl,
        pose,
        filename: fileName
      }
    });

  } catch (error) {
    console.error('Error in speaker-images POST:', error);
    return NextResponse.json(
      { error: 'アップロード中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

// DELETE: 話者画像を削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json(
        { error: 'ファイル名が必要です' },
        { status: 400 }
      );
    }

    const { error } = await supabase.storage
      .from('speaker-images')
      .remove([filename]);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json(
        { error: '削除に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in speaker-images DELETE:', error);
    return NextResponse.json(
      { error: '削除中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

// ヘルパー: ファイル名からポーズを推測
function extractPoseFromFilename(filename: string): string {
  const lower = filename.toLowerCase();
  
  if (lower.includes('front') || lower.includes('正面')) return '正面';
  if (lower.includes('point') || lower.includes('指')) return '指差し';
  if (lower.includes('think') || lower.includes('考')) return '考え中';
  if (lower.includes('smile') || lower.includes('笑')) return '笑顔';
  if (lower.includes('serious') || lower.includes('真剣')) return '真剣';
  if (lower.includes('explain') || lower.includes('説明')) return '説明';
  
  return '標準';
}
