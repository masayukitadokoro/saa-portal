import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
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

  const adminSupabase = createAdminClient();

  const { data: users, error } = await adminSupabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const days7Ago = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const usersWithEngagement = await Promise.all(
    (users || []).map(async (u) => {
      if (u.is_super_user) {
        return {
          ...u,
          engagementScore: null,
          churnRisk: null,
        };
      }

      const { data: activities } = await adminSupabase
        .from('user_activities')
        .select('activity_type')
        .eq('user_id', u.id)
        .gte('created_at', days7Ago);

      const stats7Days = {
        login: activities?.filter(a => a.activity_type === 'login').length || 0,
        videoView: activities?.filter(a => a.activity_type === 'video_view').length || 0,
        articleView: activities?.filter(a => a.activity_type === 'article_view').length || 0,
        search: activities?.filter(a => a.activity_type === 'search').length || 0,
        bookmarkAdd: activities?.filter(a => a.activity_type === 'bookmark_add').length || 0,
      };

      const engagementScore = Math.min(100, 
        (stats7Days.login * 10) +
        (stats7Days.videoView * 5) +
        (stats7Days.articleView * 5) +
        (stats7Days.search * 2) +
        (stats7Days.bookmarkAdd * 3)
      );

      let churnRisk: 'low' | 'medium' | 'high' = 'low';
      if (stats7Days.login === 0) {
        churnRisk = 'high';
      } else if (engagementScore <= 10) {
        churnRisk = 'high';
      } else if (engagementScore <= 20) {
        churnRisk = 'medium';
      }

      return {
        ...u,
        engagementScore,
        churnRisk,
      };
    })
  );

  // KPI計算（月額/年額を分ける）
  const kpis = {
    total: usersWithEngagement.length,
    trial: usersWithEngagement.filter(u => u.plan_type === 'trial' && !u.is_super_user).length,
    paidMonthly: usersWithEngagement.filter(u => u.plan_type === 'paid' && u.subscription_type === 'monthly' && !u.is_super_user).length,
    paidYearly: usersWithEngagement.filter(u => u.plan_type === 'paid' && u.subscription_type === 'yearly' && !u.is_super_user).length,
    superUser: usersWithEngagement.filter(u => u.is_super_user).length,
    highRisk: usersWithEngagement.filter(u => u.churnRisk === 'high').length,
    alumniPending: usersWithEngagement.filter(u => u.is_alumni && !u.alumni_approved_at).length,
  };

  return NextResponse.json({ 
    users: usersWithEngagement,
    kpis,
    currentUserId: user.id 
  });
}

export async function PATCH(request: NextRequest) {
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

  const adminSupabase = createAdminClient();
  const body = await request.json();
  const { userId, userIds, action, value } = body;

  const targetUserIds = userIds || [userId];

  for (const targetId of targetUserIds) {
    let updateData: any = {};

    switch (action) {
      case 'toggleSuperUser':
        updateData = { is_super_user: value };
        break;
      case 'toggleRole':
        updateData = { role: value };
        break;
      case 'extendTrial':
        const currentUser = await adminSupabase
          .from('profiles')
          .select('trial_ends_at')
          .eq('id', targetId)
          .single();
        
        const currentEnd = currentUser.data?.trial_ends_at 
          ? new Date(currentUser.data.trial_ends_at)
          : new Date();
        const newEnd = new Date(currentEnd.getTime() + (value * 24 * 60 * 60 * 1000));
        updateData = { trial_ends_at: newEnd.toISOString() };
        break;
      case 'setTrialDays':
        // 残り日数を直接設定
        const now = new Date();
        const newTrialEnd = new Date(now.getTime() + (value * 24 * 60 * 60 * 1000));
        updateData = { trial_ends_at: newTrialEnd.toISOString() };
        break;
      case 'setPlanType':
        updateData = { plan_type: value };
        break;
      case 'approveAlumni':
        const alumniUser = await adminSupabase
          .from('profiles')
          .select('trial_ends_at')
          .eq('id', targetId)
          .single();
        
        const alumniCurrentEnd = alumniUser.data?.trial_ends_at 
          ? new Date(alumniUser.data.trial_ends_at)
          : new Date();
        const alumniNewEnd = new Date(alumniCurrentEnd.getTime() + (90 * 24 * 60 * 60 * 1000));
        updateData = { 
          alumni_approved_at: new Date().toISOString(),
          trial_ends_at: alumniNewEnd.toISOString()
        };
        break;
    }

    const { error } = await adminSupabase
      .from('profiles')
      .update(updateData)
      .eq('id', targetId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
