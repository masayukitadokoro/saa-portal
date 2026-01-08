// =====================================================
// Supabase SELECT文の一元管理
// =====================================================
// フィールド追加時はここだけ修正すればOK
// =====================================================

// 動画進捗
export const VIDEO_PROGRESS_SELECT = `
  id,
  user_id,
  video_id,
  category,
  progress_percent,
  last_position_seconds,
  is_completed,
  completed_at,
  updated_at
`;

// ブックマーク
export const BOOKMARK_SELECT = `
  id,
  user_id,
  video_id,
  category,
  created_at
`;

// SCM結果
export const SCM_RESULT_SELECT = `
  id,
  user_id,
  total_score,
  score_idea_validation,
  score_customer_development,
  score_pmf,
  score_scaling,
  score_organization,
  score_fundraising,
  taken_at
`;

export const SCM_RESULT_FULL_SELECT = `
  ${SCM_RESULT_SELECT},
  detailed_answers
`;

// 定例講義
export const REGULAR_LECTURE_SELECT = `
  id,
  batch_id,
  lecture_number,
  title,
  description,
  scheduled_at,
  zoom_url,
  archive_video_url,
  materials_url,
  assignment_description,
  assignment_template_url,
  status
`;

// 専門家講義
export const EXPERT_LECTURE_SELECT = `
  id,
  batch_id,
  title,
  description,
  scheduled_at,
  zoom_url,
  archive_video_url,
  materials_url,
  expert_name,
  expert_title,
  expert_company,
  expert_bio,
  expert_photo_url,
  status
`;

// 卒業制作進捗
export const GRADUATION_PROGRESS_SELECT = `
  id,
  user_id,
  current_phase,
  phase1_status,
  phase1_completed_at,
  phase2_status,
  phase2_completed_at,
  phase3_status,
  phase3_completed_at,
  phase4_status,
  phase4_completed_at,
  phase5_status,
  phase5_completed_at,
  document_url,
  notes
`;

// ガイド
export const GUIDE_SELECT = `
  id,
  category,
  title,
  description,
  notion_url,
  display_order,
  is_active
`;

// プロフィール（受講生用）
export const STUDENT_PROFILE_SELECT = `
  id,
  user_id,
  display_name,
  email,
  avatar_url
`;

// 受講生情報
export const SAA_STUDENT_SELECT = `
  id,
  user_id,
  batch_id,
  status,
  engagement_score,
  engagement_status,
  subsidy_eligible,
  payment_status,
  enrolled_at
`;
