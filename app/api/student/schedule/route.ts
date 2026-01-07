import { NextResponse } from 'next/server';
import { queryNotionDatabase, pageToScheduleEvent, ScheduleEvent, NOTION_DATABASE_ID } from '@/lib/notion';

export const revalidate = 300;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const upcoming = searchParams.get('upcoming') === 'true';

  try {
    const results = await queryNotionDatabase(NOTION_DATABASE_ID);

    let events: ScheduleEvent[] = results.map((page: any) => 
      pageToScheduleEvent(page)
    );

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
    console.error('Notion API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedule data', details: String(error) },
      { status: 500 }
    );
  }
}
