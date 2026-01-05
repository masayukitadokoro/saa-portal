import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: batches, error } = await supabase
      .from('saa_batches')
      .select('batch_number, name, graduation_date')
      .eq('is_active', true)
      .order('batch_number', { ascending: true });

    if (error) {
      console.error('Error fetching batches:', error);
      return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 });
    }

    return NextResponse.json({ batches: batches || [] });

  } catch (error) {
    console.error('Error in batches API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
