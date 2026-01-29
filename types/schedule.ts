// =====================================================
// types/schedule.ts
// 講義詳細ページ用の型定義
// =====================================================

// 事前コンテンツ（書籍）
export interface BookReference {
  chapter: string;        // Chapter 5-2
  title: string;          // 顧客理解とモチベーショングラフ
  pdfUrl: string | null;  // Google DriveのPDF URL
  pages: string;          // P.142-156
}

// 事前コンテンツ（動画）
export interface RelatedVideo {
  id: number;
  title: string;
  duration: string;
  category: string;
  categorySlug: string;
  youtubeId: string;
  isWatched: boolean;     // ユーザーの視聴状態
  isRequired: boolean;    // 必須視聴かどうか
}

// 課題
export interface Assignment {
  title: string;
  description: string | null;
  deadline: string | null;      // 講義後課題のみ
  folderUrl: string | null;     // Google Drive URL
}

// 講義進捗
export interface ScheduleProgress {
  bookRead: boolean;
  surveyCompleted: boolean;
  preAssignmentSubmitted: boolean;
  postAssignmentSubmitted: boolean;
  videosWatched: number;
  videosTotal: number;
}

// 講義詳細（フル）
export interface ScheduleDetail {
  id: string;
  title: string;
  description: string | null;
  lectureNumber: number | null;       // 定例講義の回数
  eventType: 'regular' | 'expert' | 'office_hour' | 'special' | 'other';
  
  // 日時
  date: string;           // 2026-02-16
  dayOfWeek: string;      // 月
  startTime: string;      // 20:00
  endTime: string;        // 21:30
  duration: string;       // 90分
  
  // 講義概要
  content: string | null;
  purpose: string | null;
  instructorName: string | null;
  
  // Zoom
  zoomUrl: string | null;
  
  // 事前コンテンツ
  bookReference: BookReference | null;
  relatedVideos: RelatedVideo[];
  
  // 課題
  preAssignment: Assignment | null;   // 講義前課題（前回出題）
  postAssignment: Assignment | null;  // 講義後課題（今回出題）
  
  // フォーム
  questionFormUrl: string | null;     // 事前質問
  surveyUrl: string | null;           // アンケート
  
  // 講義後コンテンツ
  archiveVideoUrl: string | null;
  materialsUrl: string | null;
  
  // 進捗（ユーザー別）
  progress: ScheduleProgress;
  
  // メタ
  isCompleted: boolean;               // 講義終了済みか
  isPublished: boolean;
}

// イベントタイプの定数
export const EVENT_TYPE_LABELS: Record<string, string> = {
  regular: '定例講義',
  expert: '専門家講義',
  office_hour: 'オフィスアワー',
  special: '特別イベント',
  other: 'その他',
};

// イベントタイプの色
export const EVENT_TYPE_COLORS: Record<string, string> = {
  regular: 'bg-indigo-600',
  expert: 'bg-purple-600',
  office_hour: 'bg-green-600',
  special: 'bg-pink-600',
  other: 'bg-gray-600',
};
