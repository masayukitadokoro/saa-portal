import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    // thumbnail-templates バケットから画像一覧を取得
    const { data: files, error } = await supabase.storage
      .from('thumbnail-templates')
      .list('', {
        limit: 10,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error('Storage error:', error);
      return NextResponse.json({ templates: [] });
    }

    // 画像ファイルのみフィルタ
    const imageFiles = files?.filter(f => 
      f.name.match(/\.(jpg|jpeg|png|webp)$/i)
    ) || [];

    // 公開URLを生成
    const templates = imageFiles.map((file, index) => {
      const { data: { publicUrl } } = supabase.storage
        .from('thumbnail-templates')
        .getPublicUrl(file.name);

      // ファイル名からテンプレート名を生成
      const name = file.name
        .replace(/\.(jpg|jpeg|png|webp)$/i, '')
        .replace(/[-_]/g, ' ')
        .replace(/template\s*/i, '')
        .trim() || `テンプレート ${index + 1}`;

      return {
        id: `template-${index + 1}`,
        name: name,
        url: publicUrl,
        description: ''
      };
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ templates: [] });
  }
}
