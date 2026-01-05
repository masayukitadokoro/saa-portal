import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // アルムナイ申請状況を取得
    const { data: alumni, error: alumniError } = await supabase
      .from('saa_alumni')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // エラーがあってもPGRST116（レコードなし）は正常
    if (alumniError && alumniError.code !== 'PGRST116') {
      console.error('Error fetching alumni status:', alumniError);
    }

    // プロフィール情報を取得
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_alumni, alumni_batch_number, alumni_approved_at, signed_up_at')
      .eq('user_id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
    }

    return NextResponse.json({
      alumni: alumni || null,
      profile: profile || null,
    });

  } catch (error) {
    console.error('Error in alumni status API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
