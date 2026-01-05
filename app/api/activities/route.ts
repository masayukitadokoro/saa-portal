import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // スーパーユーザーのアクティビティは記録しない
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_user')
    .eq('id', user.id)
    .single();

  if (profile?.is_super_user) {
    return NextResponse.json({ success: true, skipped: true });
  }

  const body = await request.json();
  const { activity_type, target_id, target_title, metadata } = body;

  if (!activity_type) {
    return NextResponse.json({ error: 'activity_type is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('user_activities')
    .insert({
      user_id: user.id,
      activity_type,
      target_id: target_id || null,
      target_title: target_title || null,
      metadata: metadata || {},
    });

  if (error) {
    console.error('Activity tracking error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
