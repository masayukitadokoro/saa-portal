import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('saa_role')
    .eq('user_id', user.id)
    .single();

  if (profile?.saa_role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: students, error } = await supabase
    .from('saa_students')
    .select(`
      *,
      profiles:user_id (
        display_name,
        email,
        avatar_url
      ),
      ta:assigned_ta_id (
        display_name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ students });
}
