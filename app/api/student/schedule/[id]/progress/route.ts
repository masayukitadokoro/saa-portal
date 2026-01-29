import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase-server';
import { ScheduleProgress } from '@/types/schedule';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: scheduleId } = await params;
    const supabase = await createServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, value } = body;

    const validTypes = ['book_read', 'survey_completed', 'pre_assignment', 'post_assignment'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const columnMap: Record<string, string> = {
      'book_read': 'book_read',
      'survey_completed': 'survey_completed',
      'pre_assignment': 'pre_assignment_submitted',
      'post_assignment': 'post_assignment_submitted'
    };

    const columnName = columnMap[type];

    const { data: existing } = await supabaseAdmin
      .from('saa_schedule_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('schedule_id', scheduleId)
      .single();

    let progressData;

    if (existing) {
      const { data, error } = await supabaseAdmin
        .from('saa_schedule_progress')
        .update({
          [columnName]: value,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      progressData = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('saa_schedule_progress')
        .insert({
          user_id: user.id,
          schedule_id: scheduleId,
          [columnName]: value
        })
        .select()
        .single();

      if (error) throw error;
      progressData = data;
    }

    const { data: scheduleVideos } = await supabaseAdmin
      .from('saa_schedule_videos')
      .select('video_id')
      .eq('schedule_id', scheduleId);

    const videoIds = scheduleVideos?.map(sv => sv.video_id) || [];

    let videosWatched = 0;
    if (videoIds.length > 0) {
      const { data: watchHistory } = await supabaseAdmin
        .from('watch_history')
        .select('video_id')
        .eq('user_id', user.id)
        .in('video_id', videoIds);

      videosWatched = watchHistory?.length || 0;
    }

    const progress: ScheduleProgress = {
      bookRead: progressData.book_read,
      surveyCompleted: progressData.survey_completed,
      preAssignmentSubmitted: progressData.pre_assignment_submitted,
      postAssignmentSubmitted: progressData.post_assignment_submitted,
      videosWatched,
      videosTotal: videoIds.length
    };

    return NextResponse.json({ success: true, progress });

  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
