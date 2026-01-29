// /app/api/student/assignments/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase-server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { data: student } = await supabaseAdmin
      .from('saa_students')
      .select('batch_id')
      .eq('user_id', user.id)
      .single();

    const batchId = student?.batch_id || 9;

    const { data: schedules, error: schedulesError } = await supabaseAdmin
      .from('saa_schedules')
      .select(`
        id,
        title,
        event_type,
        start_at,
        pre_assignment_title,
        pre_assignment_folder_url,
        post_assignment_title,
        post_assignment_deadline,
        post_assignment_folder_url
      `)
      .eq('batch_id', batchId)
      .eq('is_published', true)
      .or('pre_assignment_title.neq.null,post_assignment_title.neq.null')
      .order('start_at', { ascending: true });

    if (schedulesError) {
      console.error('スケジュール取得エラー:', schedulesError);
      return NextResponse.json({ error: 'スケジュール取得に失敗しました' }, { status: 500 });
    }

    const { data: submissions, error: submissionsError } = await supabaseAdmin
      .from('saa_submission_records')
      .select('*')
      .eq('user_id', user.id);

    if (submissionsError) {
      console.error('提出記録取得エラー:', submissionsError);
    }

    const submissionMap = new Map<string, any[]>();
    submissions?.forEach(sub => {
      const key = `${sub.schedule_id}_${sub.assignment_type}`;
      if (!submissionMap.has(key)) {
        submissionMap.set(key, []);
      }
      submissionMap.get(key)!.push(sub);
    });

    const assignments: any[] = [];
    const grouped: any[] = [];

    schedules?.forEach(schedule => {
      const scheduleAssignments: any[] = [];

      if (schedule.pre_assignment_title) {
        const key = `${schedule.id}_pre`;
        const subs = submissionMap.get(key) || [];
        const latestSub = subs.length > 0 
          ? subs.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())[0]
          : null;

        const assignment = {
          id: `${schedule.id}_pre`,
          schedule_id: schedule.id,
          schedule_title: schedule.title,
          schedule_date: schedule.start_at,
          title: schedule.pre_assignment_title,
          description: null,
          is_required: true,
          deadline: schedule.start_at,
          folder_url: schedule.pre_assignment_folder_url,
          type: 'pre' as const,
          submission_status: latestSub 
            ? 'submitted' 
            : (new Date(schedule.start_at) < new Date() ? 'overdue' : 'not_submitted'),
          latest_submission: latestSub,
          submission_count: subs.length,
        };
        assignments.push(assignment);
        scheduleAssignments.push(assignment);
      }

      if (schedule.post_assignment_title) {
        const key = `${schedule.id}_post`;
        const subs = submissionMap.get(key) || [];
        const latestSub = subs.length > 0 
          ? subs.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())[0]
          : null;

        const deadline = schedule.post_assignment_deadline;
        const assignment = {
          id: `${schedule.id}_post`,
          schedule_id: schedule.id,
          schedule_title: schedule.title,
          schedule_date: schedule.start_at,
          title: schedule.post_assignment_title,
          description: null,
          is_required: true,
          deadline: deadline,
          folder_url: schedule.post_assignment_folder_url,
          type: 'post' as const,
          submission_status: latestSub 
            ? 'submitted' 
            : (deadline && new Date(deadline) < new Date() ? 'overdue' : 'not_submitted'),
          latest_submission: latestSub,
          submission_count: subs.length,
        };
        assignments.push(assignment);
        scheduleAssignments.push(assignment);
      }

      if (scheduleAssignments.length > 0) {
        grouped.push({
          schedule_id: schedule.id,
          schedule_title: schedule.title,
          schedule_date: schedule.start_at,
          event_type: schedule.event_type,
          assignments: scheduleAssignments,
        });
      }
    });

    const stats = {
      total: assignments.length,
      submitted: assignments.filter(a => a.submission_status === 'submitted').length,
      pending: assignments.filter(a => a.submission_status === 'not_submitted').length,
      overdue: assignments.filter(a => a.submission_status === 'overdue').length,
    };

    return NextResponse.json({ assignments, grouped, stats });

  } catch (error) {
    console.error('課題一覧取得エラー:', error);
    return NextResponse.json({ error: '課題一覧の取得に失敗しました' }, { status: 500 });
  }
}
