import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const revalidate = 300;

type EventType = 'regular' | 'expert' | 'office_hour' | 'special' | 'other';

interface ScheduleEvent {
  id: string;
  date: string;
  endDate?: string;
  name: string;
  eventType: EventType;
  venue: string | null;
  preSurveyUrl: string | null;
  postSurveyUrl: string | null;
  lectureVideoUrl: string | null;
  materialUrl: string | null;
  submissionFolderUrl: string | null;
  zoomUrl: string | null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const upcoming = searchParams.get('upcoming') === 'true';

  try {
    let query = supabase
      .from('saa_schedules')
      .select('*')
      .eq('is_published', true)
      .order('start_at', { ascending: true });

    const { data, error } = await query;

    if (error) throw error;

    let events: ScheduleEvent[] = (data || []).map((schedule) => ({
      id: schedule.id,
      date: schedule.start_at,
      endDate: schedule.end_at || undefined,
      name: schedule.title,
      eventType: schedule.event_type as EventType,
      venue: schedule.location_type === 'offline' ? schedule.offline_location : null,
      preSurveyUrl: null,
      postSurveyUrl: null,
      lectureVideoUrl: schedule.recording_url,
      materialUrl: schedule.materials_url,
      submissionFolderUrl: null,
      zoomUrl: schedule.zoom_url,
    }));

    if (upcoming) {
      const now = new Date();
      events = events.filter(event => {
        if (!event.date) return false;
        return new Date(event.date) >= now;
      });
    }

    if (type && type !== 'all') {
      events = events.filter(event => event.eventType === type);
    }

    return NextResponse.json({
      events,
      total: events.length,
    });
  } catch (error) {
    console.error('Supabase API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedule data', details: String(error) },
      { status: 500 }
    );
  }
}
