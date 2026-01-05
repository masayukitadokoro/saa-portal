import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

interface CSVRow {
  email: string;
  name: string;
  batch_number: number;
}

function parseCSV(csvText: string): CSVRow[] {
  const lines = csvText.trim().split('\n');
  const rows: CSVRow[] = [];
  
  // ヘッダーをスキップ（最初の行がヘッダーの場合）
  const startIndex = lines[0].toLowerCase().includes('email') ? 1 : 0;
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // カンマで分割（引用符内のカンマは無視）
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    
    if (values.length >= 3) {
      const email = values[0];
      const name = values[1];
      const batch_number = parseInt(values[2]);
      
      if (email && name && !isNaN(batch_number)) {
        rows.push({ email, name, batch_number });
      }
    }
  }
  
  return rows;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // ファイルタイプチェック
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'CSV file required' }, { status: 400 });
    }

    // CSVを読み込み
    const csvText = await file.text();
    const rows = parseCSV(csvText);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No valid data found in CSV' }, { status: 400 });
    }

    // バッチ番号の有効性を確認
    const { data: batches } = await supabase
      .from('saa_batches')
      .select('batch_number')
      .eq('is_active', true);
    
    const validBatchNumbers = new Set(batches?.map(b => b.batch_number) || []);

    // データを検証
    const validRows: CSVRow[] = [];
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const lineNum = i + 2; // ヘッダー + 1-indexed
      
      // メールアドレス形式チェック
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.email)) {
        errors.push(`Line ${lineNum}: Invalid email format - ${row.email}`);
        continue;
      }
      
      // バッチ番号チェック
      if (!validBatchNumbers.has(row.batch_number)) {
        errors.push(`Line ${lineNum}: Invalid batch number - ${row.batch_number}`);
        continue;
      }
      
      validRows.push(row);
    }

    if (validRows.length === 0) {
      return NextResponse.json({ 
        error: 'No valid rows to import',
        details: errors 
      }, { status: 400 });
    }

    // Upsert（既存データは更新、新規は挿入）
    const { data: inserted, error: insertError } = await supabase
      .from('saa_alumni_master')
      .upsert(
        validRows.map(row => ({
          email: row.email.toLowerCase(),
          name: row.name,
          batch_number: row.batch_number,
        })),
        { onConflict: 'email' }
      )
      .select();

    if (insertError) {
      console.error('Error inserting alumni master data:', insertError);
      return NextResponse.json({ error: 'Failed to import data' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Import successful',
      imported: inserted?.length || 0,
      total: rows.length,
      skipped: rows.length - validRows.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // 最初の10件のみ
    });

  } catch (error) {
    console.error('Error in alumni upload API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// マスターデータ一覧を取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const { data: masterData, error, count } = await supabase
      .from('saa_alumni_master')
      .select('*, saa_batches:batch_number (name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching alumni master:', error);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    return NextResponse.json({
      data: masterData || [],
      total: count || 0,
      page,
      limit,
    });

  } catch (error) {
    console.error('Error in alumni master API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
