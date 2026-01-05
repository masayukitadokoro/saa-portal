import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'ファイルがありません' }, { status: 400 });
    }

    // ファイルサイズチェック (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'ファイルサイズは5MB以下にしてください' }, { status: 400 });
    }

    // MIMEタイプチェック
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: '画像ファイルのみアップロード可能です' }, { status: 400 });
    }

    // ファイル名を生成
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${videoId}-${Date.now()}.${ext}`;
    
    // ファイルをArrayBufferに変換
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Supabase Storageにアップロード
    const { data, error } = await supabase.storage
      .from('thumbnails')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json({ error: 'アップロードに失敗しました: ' + error.message }, { status: 500 });
    }

    // 公開URLを取得
    const { data: { publicUrl } } = supabase.storage
      .from('thumbnails')
      .getPublicUrl(fileName);

    // ★★★ videosテーブルのcustom_thumbnail_urlを更新 ★★★
    const { error: updateError } = await supabase
      .from('videos')
      .update({ custom_thumbnail_url: publicUrl })
      .eq('video_id', videoId);

    if (updateError) {
      console.error('Database update error:', updateError);
      // アップロードは成功しているので、URLは返す
      return NextResponse.json({ 
        url: publicUrl,
        path: data.path,
        warning: 'サムネイルはアップロードされましたが、データベースの更新に失敗しました'
      });
    }

    return NextResponse.json({ 
      url: publicUrl,
      path: data.path,
      success: true
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'アップロード中にエラーが発生しました' }, { status: 500 });
  }
}
