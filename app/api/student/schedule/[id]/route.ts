import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase-server';
import { ScheduleDetail, BookReference, Assignment, RelatedVideo, ScheduleProgress } from '@/types/schedule';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function formatDate(dateStr: string): { date: string; dayOfWeek: string; startTime: string; endTime: string; duration: string } {
  const date = new Date(dateStr);
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = days[date.getDay()];
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return {
    date: `${year}年${month}月${day}日`,
    dayOfWeek,
    startTime: `${hours}:${minutes}`,
    endTime: '',
    duration: ''
  };
}

function calculateDuration(startAt: string, endAt: string | null): string {
  if (!endAt) return '';
  const start = new Date(startAt);
  const end = new Date(endAt);
  const diffMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  return `${diffMinutes}分`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: schedule, error: scheduleError } = await supabaseAdmin
      .from('saa_schedules')
      .select('*')
      .eq('id', id)
      .single();

    if (scheduleError || !schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    // 関連動画のIDを取得
    const { data: scheduleVideos, error: svError } = await supabaseAdmin
      .from('saa_schedule_videos')
      .select('video_id, order_index, is_required')
      .eq('schedule_id', id)
      .order('order_index');

    // 動画の詳細情報を取得
    let relatedVideos: RelatedVideo[] = [];
    if (scheduleVideos && scheduleVideos.length > 0) {
      const videoIds = scheduleVideos.map(sv => sv.video_id);
      
      const { data: videos, error: videosError } = await supabaseAdmin
        .from('videos')
        .select('id, title, duration, video_id, category_id')
        .in('id', videoIds);

      // カテゴリ情報を取得
      const categoryIds = [...new Set(videos?.map(v => v.category_id).filter(Boolean))];
      let categoriesMap: Record<number, { name: string; slug: string }> = {};
      
      if (categoryIds.length > 0) {
        const { data: categories } = await supabaseAdmin
          .from('categories')
          .select('id, name, slug')
          .in('id', categoryIds);
        
        if (categories) {
          categoriesMap = categories.reduce((acc, cat) => {
            acc[cat.id] = { name: cat.name, slug: cat.slug };
            return acc;
          }, {} as Record<number, { name: string; slug: string }>);
        }
      }

      // 視聴履歴を取得
      const { data: watchHistory } = await supabaseAdmin
        .from('watch_history')
        .select('video_id')
        .eq('user_id', user.id)
        .in('video_id', videoIds);

      const watchedVideoIds = new Set(watchHistory?.map(w => w.video_id) || []);

      // 動画をマップに変換
      const videosMap = videos?.reduce((acc, v) => {
        acc[v.id] = v;
        return acc;
      }, {} as Record<number, any>) || {};

      // 関連動画リストを構築（order_indexの順序を維持）
      relatedVideos = scheduleVideos
        .filter(sv => videosMap[sv.video_id])
        .map(sv => {
          const video = videosMap[sv.video_id];
          const category = categoriesMap[video.category_id];
          return {
            id: video.id,
            title: video.title,
            duration: video.duration || '',
            category: category?.name || '',
            categorySlug: category?.slug || '',
            youtubeId: video.video_id,
            isWatched: watchedVideoIds.has(video.id),
            isRequired: sv.is_required
          };
        });
    }

    const { data: progressData } = await supabaseAdmin
      .from('saa_schedule_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('schedule_id', id)
      .single();

    const dateInfo = formatDate(schedule.start_at);
    if (schedule.end_at) {
      const endDate = new Date(schedule.end_at);
      dateInfo.endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
      dateInfo.duration = calculateDuration(schedule.start_at, schedule.end_at);
    }

    const bookReference: BookReference | null = schedule.book_chapter ? {
      chapter: schedule.book_chapter,
      title: schedule.book_title || '',
      pdfUrl: schedule.book_pdf_url,
      pages: schedule.book_pages || ''
    } : null;

    const preAssignment: Assignment | null = schedule.pre_assignment_title ? {
      title: schedule.pre_assignment_title,
      description: schedule.pre_assignment_description,
      deadline: null,
      folderUrl: schedule.pre_assignment_folder_url
    } : null;

    const postAssignment: Assignment | null = schedule.post_assignment_title ? {
      title: schedule.post_assignment_title,
      description: schedule.post_assignment_description,
      deadline: schedule.post_assignment_deadline,
      folderUrl: schedule.post_assignment_folder_url
    } : null;

    const progress: ScheduleProgress = {
      bookRead: progressData?.book_read || false,
      surveyCompleted: progressData?.survey_completed || false,
      preAssignmentSubmitted: progressData?.pre_assignment_submitted || false,
      postAssignmentSubmitted: progressData?.post_assignment_submitted || false,
      videosWatched: relatedVideos.filter(v => v.isWatched).length,
      videosTotal: relatedVideos.length
    };

    const now = new Date();
    const lectureEnd = schedule.end_at ? new Date(schedule.end_at) : new Date(schedule.start_at);
    const isCompleted = now > lectureEnd;

    const scheduleDetail: ScheduleDetail = {
      id: schedule.id,
      title: schedule.title,
      description: schedule.description,
      lectureNumber: schedule.lecture_number,
      eventType: schedule.event_type,
      date: dateInfo.date,
      dayOfWeek: dateInfo.dayOfWeek,
      startTime: dateInfo.startTime,
      endTime: dateInfo.endTime,
      duration: dateInfo.duration,
      content: schedule.lecture_content,
      purpose: schedule.lecture_purpose,
      instructorName: schedule.instructor_name,
      zoomUrl: schedule.zoom_url,
      bookReference,
      relatedVideos,
      preAssignment,
      postAssignment,
      questionFormUrl: schedule.question_form_url,
      surveyUrl: schedule.survey_url,
      archiveVideoUrl: schedule.archive_video_url,
      materialsUrl: schedule.materials_url,
      progress,
      isCompleted,
      isPublished: schedule.is_published
    };

    return NextResponse.json({ schedule: scheduleDetail });

  } catch (error) {
    console.error('Error fetching schedule detail:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
