import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // 認証チェック
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 管理者チェック
  const { data: profile } = await supabase
    .from('profiles')
    .select('saa_role')
    .eq('user_id', user.id)
    .single();

  if (profile?.saa_role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 受講生データを取得
  const { data: student, error } = await supabase
    .from('saa_students')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  // プロフィール情報を取得
  const { data: studentProfile } = await supabase
    .from('profiles')
    .select('id, display_name, email, avatar_url')
    .eq('id', student.user_id)
    .single();

  // バッチ情報を取得
  const { data: batch } = await supabase
    .from('saa_batches')
    .select('id, name, start_date, end_date')
    .eq('id', student.batch_id)
    .single();

  // 担当TA情報を取得（存在する場合）
  let taProfile = null;
  if (student.assigned_ta_id) {
    const { data: ta } = await supabase
      .from('profiles')
      .select('id, display_name, email, avatar_url')
      .eq('id', student.assigned_ta_id)
      .single();
    taProfile = ta;
  }

  return NextResponse.json({
    student: {
      ...student,
      profile: studentProfile,
      batch,
      ta: taProfile,
    }
  });
}
