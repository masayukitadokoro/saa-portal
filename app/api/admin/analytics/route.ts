import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

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

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '7');
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: searchHistory } = await supabase
    .from('search_history')
    .select('query, user_id, searched_at')
    .gte('searched_at', startDate.toISOString());

  if (!searchHistory) {
    return NextResponse.json({
      topKeywords: [],
      searchesByDate: [],
      totalSearches: 0,
      uniqueUsers: 0,
    });
  }

  const keywordCount: Record<string, number> = {};
  searchHistory.forEach((item) => {
    const query = item.query.toLowerCase().trim();
    keywordCount[query] = (keywordCount[query] || 0) + 1;
  });

  const topKeywords = Object.entries(keywordCount)
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const dateCount: Record<string, number> = {};
  searchHistory.forEach((item) => {
    const date = item.searched_at.split('T')[0];
    dateCount[date] = (dateCount[date] || 0) + 1;
  });

  const searchesByDate = Object.entries(dateCount)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const uniqueUsers = new Set(searchHistory.map((item) => item.user_id)).size;

  return NextResponse.json({
    topKeywords,
    searchesByDate,
    totalSearches: searchHistory.length,
    uniqueUsers,
  });
}
