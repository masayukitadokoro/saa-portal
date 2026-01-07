// =====================================================
// SAA現役生ダッシュボード - 型定義
// =====================================================
// 全ての型定義をここに集約し、DRY原則を守る
// =====================================================

// =====================================================
// 基本型
// =====================================================

export type VideoCategory = 'kagaku' | 'taizen' | 'sanbo';

export type LectureStatus = 'scheduled' | 'live' | 'completed';

export type PhaseStatus = 'not_started' | 'in_progress' | 'completed';

export type EventType = 'regular' | 'expert';

// =====================================================
// 動画関連
// =====================================================

export interface VideoBase {
  video_id: string;
  title: string;
  thumbnail_url?: string;
  custom_thumbnail_url?: string;
  duration?: number;
  display_order?: number | null;
}

export interface VideoWithProgress extends VideoBase {
  category: VideoCategory;
  progress_percent: number;
  is_completed: boolean;
  last_position_seconds: number;
}

export interface VideoProgress {
  id: string;
  user_id: string;
  video_id: string;
  category: VideoCategory;
  progress_percent: number;
  last_position_seconds: number;
  is_completed: boolean;
  completed_at: string | null;
  updated_at: string;
}

export interface CategoryProgress {
  category: VideoCategory;
  categoryName: string;
  totalVideos: number;
  completedVideos: number;
  progressPercent: number;
  color: string;
}

// =====================================================
// ブックマーク
// =====================================================

export interface Bookmark {
  id: string;
  user_id: string;
  video_id: string;
  category: VideoCategory;
  created_at: string;
  // JOINで取得する動画情報
  video?: VideoBase;
}

// =====================================================
// SCM関連
// =====================================================

export interface SCMScores {
  idea_validation: number;
  customer_development: number;
  pmf: number;
  scaling: number;
  organization: number;
  fundraising: number;
}

export interface SCMResult {
  id: string;
  user_id: string;
  total_score: number;
  score_idea_validation: number;
  score_customer_development: number;
  score_pmf: number;
  score_scaling: number;
  score_organization: number;
  score_fundraising: number;
  detailed_answers?: Record<string, unknown>;
  taken_at: string;
}

export interface SCMRecommendation {
  weakness: string;
  score: number;
  recommended_videos: VideoBase[];
}

// =====================================================
// 講義関連
// =====================================================

export interface RegularLecture {
  id: string;
  batch_id: number;
  lecture_number: number;
  title: string;
  description?: string;
  scheduled_at: string;
  zoom_url?: string;
  archive_video_url?: string;
  materials_url?: string;
  assignment_description?: string;
  assignment_template_url?: string;
  status: LectureStatus;
}

export interface ExpertLecture {
  id: string;
  batch_id: number;
  title: string;
  description?: string;
  scheduled_at: string;
  zoom_url?: string;
  archive_video_url?: string;
  materials_url?: string;
  expert_name: string;
  expert_title?: string;
  expert_company?: string;
  expert_bio?: string;
  expert_photo_url?: string;
  status: LectureStatus;
}

export interface UpcomingEvent {
  id: string;
  event_type: EventType;
  title: string;
  description?: string;
  scheduled_at: string;
  zoom_url?: string;
  status: LectureStatus;
  batch_id: number;
}

// =====================================================
// 卒業制作
// =====================================================

export interface GraduationPhase {
  phase: number;
  name: string;
  status: PhaseStatus;
  completed_at: string | null;
}

export interface GraduationProgress {
  id: string;
  user_id: string;
  current_phase: number;
  phase1_status: PhaseStatus;
  phase1_completed_at: string | null;
  phase2_status: PhaseStatus;
  phase2_completed_at: string | null;
  phase3_status: PhaseStatus;
  phase3_completed_at: string | null;
  phase4_status: PhaseStatus;
  phase4_completed_at: string | null;
  phase5_status: PhaseStatus;
  phase5_completed_at: string | null;
  document_url?: string;
  notes?: string;
}

export const GRADUATION_PHASES: { phase: number; name: string }[] = [
  { phase: 1, name: '目次作成' },
  { phase: 2, name: 'コンテンツ作成' },
  { phase: 3, name: 'レビュー' },
  { phase: 4, name: '修正' },
  { phase: 5, name: '最終提出' },
];

// =====================================================
// ガイド
// =====================================================

export type GuideCategory = 'getting_started' | 'lectures' | 'graduation' | 'community';

export interface Guide {
  id: string;
  category: GuideCategory;
  title: string;
  description?: string;
  notion_url: string;
  display_order: number;
  is_active: boolean;
}

export interface GuideGroup {
  category: GuideCategory;
  categoryName: string;
  guides: Guide[];
}

export const GUIDE_CATEGORY_NAMES: Record<GuideCategory, string> = {
  getting_started: 'はじめに',
  lectures: '講義について',
  graduation: '卒業制作',
  community: 'コミュニティ',
};

// =====================================================
// ユーザー・受講生
// =====================================================

export interface StudentProfile {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  company_name?: string;
  business_description?: string;
  founded_year?: number;
  slack_handle?: string;
}

export interface StudentDashboardData {
  profile: StudentProfile;
  batch_id: number;
  categoryProgress: CategoryProgress[];
  upcomingEvents: UpcomingEvent[];
  latestSCM: SCMResult | null;
  scmRecommendations: SCMRecommendation[];
  recentlyWatched: VideoWithProgress[];
  continueWatching: VideoWithProgress | null;
  graduationProgress: GraduationProgress | null;
}

// =====================================================
// APIレスポンス型
// =====================================================

export interface APIResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

// =====================================================
// 定数
// =====================================================

export const CATEGORY_INFO: Record<VideoCategory, { name: string; color: string }> = {
  kagaku: { name: '起業の科学', color: '#3B82F6' },
  taizen: { name: '起業大全', color: '#10B981' },
  sanbo: { name: '起業参謀', color: '#8B5CF6' },
};

export const SCM_SCORE_LABELS: Record<keyof SCMScores, string> = {
  idea_validation: 'アイデア検証',
  customer_development: '顧客開発',
  pmf: 'PMF検証',
  scaling: 'スケール',
  organization: '組織構築',
  fundraising: '資金調達',
};
