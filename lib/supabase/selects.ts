// ===========================================
// Supabase SELECT文の一元管理
// フィールド追加時はここだけ修正すればOK
// ===========================================

/**
 * 動画の基本フィールド（リスト表示用）
 */
export const VIDEO_BASE_FIELDS = `
  video_id,
  title,
  thumbnail_url,
  custom_thumbnail_url,
  video_url,
  duration,
  view_count,
  display_order
`;

/**
 * 動画の詳細フィールド（詳細ページ用）
 */
export const VIDEO_DETAIL_FIELDS = `
  video_id,
  title,
  thumbnail_url,
  custom_thumbnail_url,
  video_url,
  duration,
  view_count,
  display_order,
  summary,
  description,
  article_content,
  key_points,
  tags,
  category_id,
  script_text,
  slide_url,
  related_article_url,
  related_spreadsheet_url,
  created_at
`;

/**
 * 記事用フィールド
 */
export const ARTICLE_FIELDS = `
  video_id,
  title,
  summary,
  article_content,
  article_cover_url,
  thumbnail_url,
  custom_thumbnail_url,
  video_url,
  view_count,
  display_order,
  created_at,
  category_id
`;

/**
 * 記事詳細用フィールド（カテゴリ含む）
 */
export const ARTICLE_DETAIL_FIELDS = `
  video_id,
  title,
  summary,
  article_content,
  article_cover_url,
  thumbnail_url,
  custom_thumbnail_url,
  video_url,
  view_count,
  display_order,
  created_at,
  category_id,
  categories (
    name
  )
`;
