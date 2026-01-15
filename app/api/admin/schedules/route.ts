import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// スケジュール一覧取得
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batch_id');

    let query = supabase
      .from('saa_schedules')
      .select(`
        *,
        saa_schedule_tasks (*)
      `)
      .order('start_at', { ascending: true });

    if (batchId) {
      query = query.eq('batch_id', parseInt(batchId));
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ schedules: data });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}

// スケジュール新規作成
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tasks, ...scheduleData } = body;

    // スケジュール作成
    const { data: schedule, error: scheduleError } = await supabase
      .from('saa_schedules')
      .insert(scheduleData)
      .select()
      .single();

    if (scheduleError) throw scheduleError;

    // 事前課題があれば作成
    if (tasks && tasks.length > 0) {
      const tasksWithScheduleId = tasks.map((task: any, index: number) => ({
        ...task,
        schedule_id: schedule.id,
        order_index: index,
      }));

      const { error: tasksError } = await supabase
        .from('saa_schedule_tasks')
        .insert(tasksWithScheduleId);

      if (tasksError) throw tasksError;
    }

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    );
  }
}
