import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase-server';
import { SubmissionRaw, mapRawToSubmission, Assignment, AssignmentsResponse } from '@/types/submission';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ユーザーのバッチIDを取得
    const { data: studentData } = await supabaseAdmin
      .from('saa_students')
      .select('batch_id')
      .eq('user_id', user.id)
      .single();

    const batchId = studentData?.batch_id || 9; // デフォルトはバッチ9

    // スケジュールから課題を取得（事前課題・講義後課題があるもの）
    const { data: schedules } = await supabaseAdmin
      .from('saa_schedules')
      .select(`
        id,
        title,
        lecture_number,
        event_type,
        start_at,
        pre_assignment_title,
        pre_assignment_description,
        post_assignment_title,
        post_assignment_description,
        post_assignment_deadline
      `)
      .eq('batch_id', batchId)
      .eq('is_published', true)
      .or('pre_assignment_title.not.is.null,post_assignment_title.not.is.null')
      .order('start_at', { ascending: true });

    // ユーザーの提出履歴を取得
    const { data: submissions } = await supabaseAdmin
      .from('saa_submissions')
      .select(`
        id,
        user_id,
        schedule_id,
        assignment_type,
        assignment_title,
        file_name,
        file_path,
        file_size,
        file_type,
        url_link,
        url_type,
        submitted_at,
        updated_at,
        status,
        admin_notes
      `)
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false });

    // 提出物をマップに変換（schedule_id + assignment_type でキー化）
    const submissionMap = new Map<string, SubmissionRaw>();
    submissions?.forEach((sub) => {
      const key = `${sub.schedule_id}_${sub.assignment_type}`;
      // 最新の提出のみ保持
      if (!submissionMap.has(key)) {
        submissionMap.set(key, sub as SubmissionRaw);
      }
    });

    // 課題リストを構築
    const assignments: Assignment[] = [];
    
    schedules?.forEach((schedule) => {
      // 事前課題
      if (schedule.pre_assignment_title) {
        const key = `${schedule.id}_pre`;
        const submission = submissionMap.get(key);
        assignments.push({
          id: `${schedule.id}_pre`,
          scheduleId: schedule.id,
          type: 'pre',
          title: schedule.pre_assignment_title,
          description: schedule.pre_assignment_description,
          deadline: null,
          lectureNumber: schedule.lecture_number,
          lectureTitle: schedule.title,
          submission: submission ? mapRawToSubmission(submission) : null,
          isSubmitted: !!submission,
        });
      }
      
      // 講義後課題
      if (schedule.post_assignment_title) {
        const key = `${schedule.id}_post`;
        const submission = submissionMap.get(key);
        assignments.push({
          id: `${schedule.id}_post`,
          scheduleId: schedule.id,
          type: 'post',
          title: schedule.post_assignment_title,
          description: schedule.post_assignment_description,
          deadline: schedule.post_assignment_deadline,
          lectureNumber: schedule.lecture_number,
          lectureTitle: schedule.title,
          submission: submission ? mapRawToSubmission(submission) : null,
          isSubmitted: !!submission,
        });
      }
    });

    // 統計計算
    const total = assignments.length;
    const submitted = assignments.filter(a => a.isSubmitted).length;
    const pending = total - submitted;
    const progressRate = total > 0 ? Math.round((submitted / total) * 100) : 0;

    const response: AssignmentsResponse = {
      assignments,
      stats: {
        total,
        submitted,
        pending,
        progressRate,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
