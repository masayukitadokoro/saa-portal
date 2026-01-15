import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 個別スケジュール取得
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('saa_schedules')
      .select(`
        *,
        saa_schedule_tasks (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return NextResponse.json({ schedule: data });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
      { status: 500 }
    );
  }
}

// スケジュール更新
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { tasks, ...scheduleData } = body;

    // スケジュール更新
    const { data: schedule, error: scheduleError } = await supabase
      .from('saa_schedules')
      .update({ ...scheduleData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (scheduleError) throw scheduleError;

    // 事前課題を更新（既存を削除して再作成）
    if (tasks !== undefined) {
      // 既存の課題を削除
      await supabase
        .from('saa_schedule_tasks')
        .delete()
        .eq('schedule_id', id);

      // 新しい課題を作成
      if (tasks && tasks.length > 0) {
        const tasksWithScheduleId = tasks.map((task: any, index: number) => ({
          title: task.title,
          description: task.description,
          is_required: task.is_required,
          schedule_id: id,
          order_index: index,
        }));

        const { error: tasksError } = await supabase
          .from('saa_schedule_tasks')
          .insert(tasksWithScheduleId);

        if (tasksError) throw tasksError;
      }
    }

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error('Error updating schedule:', error);
    return NextResponse.json(
      { error: 'Failed to update schedule' },
      { status: 500 }
    );
  }
}

// スケジュール削除
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from('saa_schedules')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json(
      { error: 'Failed to delete schedule' },
      { status: 500 }
    );
  }
}
