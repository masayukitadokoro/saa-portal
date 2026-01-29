// =====================================================
// types/schedule-api.ts
// スケジュールAPI用の型定義
// =====================================================

import { ScheduleDetail, ScheduleProgress } from './schedule';

// GET /api/student/schedule/[id]
export interface ScheduleDetailResponse {
  schedule: ScheduleDetail;
}

// POST /api/student/schedule/[id]/progress
export interface UpdateProgressRequest {
  type: 'book_read' | 'survey_completed' | 'pre_assignment' | 'post_assignment';
  value: boolean;
}

export interface UpdateProgressResponse {
  success: boolean;
  progress: ScheduleProgress;
}

// POST /api/student/schedule/[id]/video-watched
export interface VideoWatchedRequest {
  videoId: number;
}

export interface VideoWatchedResponse {
  success: boolean;
  isWatched: boolean;
}

// データベースから取得した生データの型
export interface ScheduleRawData {
  id: string;
  batch_id: number;
  title: string;
  description: string | null;
  event_type: string;
  instructor_name: string | null;
  start_at: string;
  end_at: string | null;
  location_type: string;
  zoom_url: string | null;
  offline_location: string | null;
  materials_url: string | null;
  recording_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  
  // 新規追加カラム
  lecture_number: number | null;
  lecture_content: string | null;
  lecture_purpose: string | null;
  book_chapter: string | null;
  book_title: string | null;
  book_pdf_url: string | null;
  book_pages: string | null;
  pre_assignment_title: string | null;
  pre_assignment_description: string | null;
  pre_assignment_folder_url: string | null;
  post_assignment_title: string | null;
  post_assignment_description: string | null;
  post_assignment_deadline: string | null;
  post_assignment_folder_url: string | null;
  question_form_url: string | null;
  survey_url: string | null;
  archive_video_url: string | null;
}

// 関連動画の生データ
export interface ScheduleVideoRawData {
  id: string;
  schedule_id: string;
  video_id: number;
  order_index: number;
  is_required: boolean;
  videos: {
    id: number;
    title: string;
    duration: string | null;
    youtube_id: string;
    categories: {
      name: string;
      slug: string;
    } | null;
  };
}

// ユーザー進捗の生データ
export interface ScheduleProgressRawData {
  id: string;
  user_id: string;
  schedule_id: string;
  book_read: boolean;
  survey_completed: boolean;
  pre_assignment_submitted: boolean;
  post_assignment_submitted: boolean;
  created_at: string;
  updated_at: string;
}
