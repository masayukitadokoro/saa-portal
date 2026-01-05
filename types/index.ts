// ===========================================
// SAA Portal 型定義
// ===========================================

// ユーザーロール
export type UserRole = 'student' | 'ta' | 'admin';

// カテゴリ
export interface Category {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  type: 'main' | 'sub';
  icon: string | null;
  color: string;
  sort_order: number;
  is_active: boolean;
  video_count?: number;
}

// 動画
export interface Video {
  id: number;
  video_id: string;
  title: string;
  description: string | null;
  summary: string | null;
  category_id: number | null;
  sub_category_id: number | null;
  duration: number | null;
  importance: string | null;
  level: number;
  tags: string[] | null;
  video_url: string | null;
  slide_url: string | null;
  related_article_url: string | null;
  thumbnail_url: string | null;
  sort_order: number;
  display_order: number | null;
  is_featured: boolean;
  view_count: number;
  script_text: string | null;
  transcript: string | null;
  key_points: string[] | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // 検索結果用
  similarity?: number;
  relevant_excerpt?: string;
  // リレーション
  category?: Category;
}

// バッチ（期）
export interface Batch {
  id: number;
  batch_number: number;
  name: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

// ユーザープロファイル
export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  batch_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // リレーション
  batch?: Batch;
}

// 講義
export interface Lecture {
  id: number;
  batch_id: number;
  lecture_number: number;
  title: string;
  description: string | null;
  scheduled_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  is_online: boolean;
  meeting_url: string | null;
  created_at: string;
}

// 出席
export interface Attendance {
  id: number;
  user_id: string;
  lecture_id: number;
  status: 'present' | 'absent' | 'late' | 'excused';
  check_in_time: string | null;
  notes: string | null;
  created_at: string;
  // リレーション
  lecture?: Lecture;
}

// 課題
export interface Assignment {
  id: number;
  batch_id: number;
  title: string;
  description: string | null;
  due_date: string;
  max_score: number;
  weight: number;
  is_required: boolean;
  created_at: string;
}

// 課題提出
export interface AssignmentSubmission {
  id: number;
  assignment_id: number;
  user_id: string;
  submission_url: string | null;
  submission_text: string | null;
  submitted_at: string;
  score: number | null;
  feedback: string | null;
  graded_by: string | null;
  graded_at: string | null;
  // リレーション
  assignment?: Assignment;
}

// 視聴履歴
export interface WatchHistory {
  id: number;
  user_id: string;
  video_id: string;
  watched_at: string;
  watch_duration_seconds: number;
  completed: boolean;
  last_position_seconds: number;
  // リレーション
  video?: Video;
}

// ブックマーク
export interface Bookmark {
  id: number;
  user_id: string;
  video_id: string;
  created_at: string;
  // リレーション
  video?: Video;
}

// 動画メモ
export interface VideoNote {
  id: number;
  user_id: string;
  video_id: string;
  note_text: string;
  timestamp_seconds: number | null;
  created_at: string;
  updated_at: string;
}

// エンゲージメント設定
export interface EngagementSettings {
  id: number;
  weight_video_completion: number;
  weight_attendance: number;
  weight_assignment_submission: number;
  weight_assignment_score: number;
  weight_interaction: number;
  video_completion_threshold: number;
  updated_at: string;
  updated_by: string | null;
}
