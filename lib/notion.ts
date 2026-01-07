import { Client } from '@notionhq/client';

// Notion Client初期化（遅延初期化）
let notionClient: Client | null = null;

export function getNotionClient(): Client {
  if (!notionClient) {
    notionClient = new Client({
      auth: process.env.NOTION_API_SECRET,
    });
  }
  return notionClient;
}

// データベースID
export const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || '';

// イベントタイプの判定
export type EventType = 'regular' | 'expert' | 'office_hour' | 'special' | 'other';

export function getEventType(name: string): EventType {
  if (name.includes('定例講義')) return 'regular';
  if (name.includes('専門家講義')) return 'expert';
  if (name.includes('オフィスアワー')) return 'office_hour';
  if (name.includes('特別講義') || name.includes('守屋')) return 'special';
  return 'other';
}

// Notionのプロパティから値を取得するヘルパー関数
export function getPropertyValue(property: any): string | null {
  if (!property) return null;
  
  switch (property.type) {
    case 'title':
      return property.title?.[0]?.plain_text || null;
    case 'rich_text':
      return property.rich_text?.[0]?.plain_text || null;
    case 'date':
      return property.date?.start || null;
    case 'select':
      return property.select?.name || null;
    case 'multi_select':
      return property.multi_select?.map((s: any) => s.name).join(', ') || null;
    case 'url':
      return property.url || null;
    case 'checkbox':
      return property.checkbox ? 'true' : 'false';
    case 'number':
      return property.number?.toString() || null;
    default:
      return null;
  }
}

// スケジュールイベントの型定義
export interface ScheduleEvent {
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

// Notionページをスケジュールイベントに変換
export function pageToScheduleEvent(page: any): ScheduleEvent {
  const props = page.properties;
  
  const name = getPropertyValue(props['Name']) || '';
  const dateProperty = props['日時'];
  
  let date = '';
  let endDate = undefined;
  
  if (dateProperty?.date) {
    date = dateProperty.date.start || '';
    endDate = dateProperty.date.end || undefined;
  }
  
  return {
    id: page.id,
    date,
    endDate,
    name,
    eventType: getEventType(name),
    venue: getPropertyValue(props['会場']),
    preSurveyUrl: getPropertyValue(props['事前アンケート/質問表']),
    postSurveyUrl: getPropertyValue(props['事後アンケート']),
    lectureVideoUrl: getPropertyValue(props['講義動画']),
    materialUrl: getPropertyValue(props['資料（あれば）']),
    submissionFolderUrl: getPropertyValue(props['提出課題フォルダ']),
    zoomUrl: null, // 会場がZoomの場合は別途設定
  };
}

// Notionデータベースをクエリ
export async function queryNotionDatabase(
  databaseId: string,
  filter?: any,
  sorts?: any[]
): Promise<any[]> {
  const client = getNotionClient();
  
  const response = await client.databases.query({
    database_id: databaseId,
    filter,
    sorts,
  });
  
  return response.results;
}
