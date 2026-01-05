import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface VideoRow {
  title: string;
  video_url: string;
  script_text: string;
  tags?: string;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const text = await file.text();
  const rows = parseCSV(text);

  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      const videoIdMatch = row.video_url.match(/(?:v=|\/embed\/|youtu\.be\/)([\w-]{11})/);
      const video_id = videoIdMatch ? videoIdMatch[1] : `video_${Date.now()}`;

      const embeddingText = `${row.title} ${row.script_text}`;
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: embeddingText,
      });
      const embedding = embeddingResponse.data[0].embedding;

      const tags = row.tags ? row.tags.split(',').map(t => t.trim()) : [];

      const { error } = await supabase.from('videos').insert({
        video_id,
        title: row.title,
        video_url: row.video_url,
        script_text: row.script_text || '',
        tags,
        embedding,
      });

      if (error) {
        throw new Error(error.message);
      }

      success++;
    } catch (err) {
      failed++;
      errors.push(`${row.title}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return NextResponse.json({ success, failed, errors });
}

function parseCSV(text: string): VideoRow[] {
  const lines = text.split('\n').filter(line => line.trim());
  const headers = parseCSVLine(lines[0]);
  
  const rows: VideoRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || '';
    });
    
    if (row.title && row.video_url) {
      rows.push({
        title: row.title,
        video_url: row.video_url,
        script_text: row.script_text || '',
        tags: row.tags,
      });
    }
  }
  
  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);

  return result.map(s => s.replace(/^"|"$/g, ''));
}
