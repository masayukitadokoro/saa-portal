import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// アルムナイ一覧を取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, approved, rejected, all
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // まずsaa_alumniテーブルからデータを取得
    let query = supabase
      .from('saa_alumni')
      .select('*', { count: 'exact' })
      .order('applied_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: alumniList, error, count } = await query;

    if (error) {
      console.error('Error fetching alumni list:', error);
      return NextResponse.json({ error: 'Failed to fetch alumni' }, { status: 500 });
    }

    // 各アルムナイのプロフィール情報とバッチ情報を取得
    const alumniWithDetails = await Promise.all(
      (alumniList || []).map(async (alumni) => {
        // プロフィール情報を取得（user_idで検索）
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, email')
          .eq('user_id', alumni.user_id)
          .single();

        // バッチ情報を取得
        const { data: batch } = await supabase
          .from('saa_batches')
          .select('name')
          .eq('batch_number', alumni.batch_number)
          .single();

        return {
          ...alumni,
          profiles: profile || null,
          saa_batches: batch || null,
        };
      })
    );

    return NextResponse.json({
      alumni: alumniWithDetails,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });

  } catch (error) {
    console.error('Error in admin alumni API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// アルムナイ承認/却下
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, action, rejection_reason } = await request.json();

    if (!id || !action) {
      return NextResponse.json({ error: 'ID and action are required' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // 申請を取得
    const { data: alumni, error: fetchError } = await supabase
      .from('saa_alumni')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !alumni) {
      return NextResponse.json({ error: 'Alumni application not found' }, { status: 404 });
    }

    if (action === 'approve') {
      // 承認処理
      const now = new Date();
      
      // saa_alumni テーブルを更新
      const { error: updateError } = await supabase
        .from('saa_alumni')
        .update({
          status: 'approved',
          approved_at: now.toISOString(),
          approved_by: user.id,
        })
        .eq('id', id);

      if (updateError) {
        console.error('Error approving alumni:', updateError);
        return NextResponse.json({ error: 'Failed to approve' }, { status: 500 });
      }

      // profiles テーブルを更新
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          is_alumni: true,
          alumni_batch_number: alumni.batch_number,
          alumni_approved_at: now.toISOString(),
        })
        .eq('user_id', alumni.user_id);

      if (profileUpdateError) {
        console.error('Error updating profile for alumni:', profileUpdateError);
      }

      return NextResponse.json({ message: 'Approved successfully' });

    } else {
      // 却下処理
      const { error: updateError } = await supabase
        .from('saa_alumni')
        .update({
          status: 'rejected',
          rejection_reason: rejection_reason || null,
        })
        .eq('id', id);

      if (updateError) {
        console.error('Error rejecting alumni:', updateError);
        return NextResponse.json({ error: 'Failed to reject' }, { status: 500 });
      }

      return NextResponse.json({ message: 'Rejected successfully' });
    }

  } catch (error) {
    console.error('Error in admin alumni API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
