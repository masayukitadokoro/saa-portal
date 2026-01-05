import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // 認証チェック
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

  // ユーザー基本情報
  const { data: userProfile } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (!userProfile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // 日付計算
  const now = new Date();
  const days7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const days30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // ブックマーク数（累計）
  const { count: bookmarkCount } = await adminSupabase
    .from('bookmarks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', id);

  // 視聴履歴数（累計）
  const { count: watchHistoryCount } = await adminSupabase
    .from('watch_history')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', id);

  // 視聴完了数（累計）
  const { count: completedCount } = await adminSupabase
    .from('watch_history')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', id)
    .eq('completed', true);

  // === 7日間のアクティビティ ===
  const { data: activities7Days } = await adminSupabase
    .from('user_activities')
    .select('activity_type')
    .eq('user_id', id)
    .gte('created_at', days7Ago);

  const stats7Days = {
    login: activities7Days?.filter(a => a.activity_type === 'login').length || 0,
    videoView: activities7Days?.filter(a => a.activity_type === 'video_view').length || 0,
    articleView: activities7Days?.filter(a => a.activity_type === 'article_view').length || 0,
    search: activities7Days?.filter(a => a.activity_type === 'search').length || 0,
    bookmarkAdd: activities7Days?.filter(a => a.activity_type === 'bookmark_add').length || 0,
  };

  // === 30日間のアクティビティ ===
  const { data: activities30Days } = await adminSupabase
    .from('user_activities')
    .select('activity_type')
    .eq('user_id', id)
    .gte('created_at', days30Ago);

  const stats30Days = {
    login: activities30Days?.filter(a => a.activity_type === 'login').length || 0,
    videoView: activities30Days?.filter(a => a.activity_type === 'video_view').length || 0,
    articleView: activities30Days?.filter(a => a.activity_type === 'article_view').length || 0,
    search: activities30Days?.filter(a => a.activity_type === 'search').length || 0,
    bookmarkAdd: activities30Days?.filter(a => a.activity_type === 'bookmark_add').length || 0,
  };

  // エンゲージメントスコア計算（100点満点）
  const engagementScore = Math.min(100, Math.round(
    (stats7Days.login * 10) +           // ログイン: 10点/回
    (stats7Days.videoView * 5) +        // 動画視聴: 5点/回
    (stats7Days.articleView * 5) +      // 記事閲覧: 5点/回
    (stats7Days.search * 2) +           // 検索: 2点/回
    (stats7Days.bookmarkAdd * 3)        // ブックマーク: 3点/回
  ));

  // 解約リスク判定（エンゲージメントスコアベース）
  let churnRisk: 'low' | 'medium' | 'high' = 'low';
  let churnReason = '';
  
  if (stats7Days.login === 0) {
    churnRisk = 'high';
    churnReason = '7日間ログインなし';
  } else if (engagementScore <= 10) {
    churnRisk = 'high';
    churnReason = 'エンゲージメント極低（10点以下）';
  } else if (engagementScore <= 20) {
    churnRisk = 'medium';
    churnReason = 'エンゲージメント低（11-20点）';
  }
  // 21点以上は低リスク（デフォルト）

  // 最近の視聴履歴（5件）
  const { data: recentHistory } = await adminSupabase
    .from('watch_history')
    .select(`
      watched_at,
      completed,
      videos (
        title
      )
    `)
    .eq('user_id', id)
    .order('watched_at', { ascending: false })
    .limit(5);

  // 最近のブックマーク（5件）
  const { data: recentBookmarks } = await adminSupabase
    .from('bookmarks')
    .select(`
      created_at,
      videos (
        title
      )
    `)
    .eq('user_id', id)
    .order('created_at', { ascending: false })
    .limit(5);

  // 最近のアクティビティ（10件）
  const { data: recentActivities } = await adminSupabase
    .from('user_activities')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
    .limit(10);

  return NextResponse.json({
    user: userProfile,
    stats: {
      bookmarkCount: bookmarkCount || 0,
      watchHistoryCount: watchHistoryCount || 0,
      completedCount: completedCount || 0,
    },
    stats7Days,
    stats30Days,
    engagementScore,
    churnRisk,
    churnReason,
    recentHistory: recentHistory || [],
    recentBookmarks: recentBookmarks || [],
    recentActivities: recentActivities || [],
  });
}
