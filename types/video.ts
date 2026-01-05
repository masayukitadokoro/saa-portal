// ===========================================
// 動画関連の型定義 - 全ページで共通利用
// ===========================================
/**
 * 動画の基本情報（リスト表示用）
 * - ホームページ、検索結果、ブックマーク、履歴で使用
 */
export interface VideoBase {
  video_id: string;
  title: string;
  thumbnail_url?: string | null;
  custom_thumbnail_url?: string | null;
  video_url?: string;
  duration?: number | null;
  view_count?: number;
  display_order?: number | null;
  sort_order?: number;
}
/**
 * 動画の詳細情報（詳細ページ用）
 */
export interface VideoDetail extends VideoBase {
  summary?: string | null;
  description?: string | null;
  key_points?: string[] | null;
  tags?: string[] | null;
  category_id?: number | null;
  category?: {
    id: number;
    name: string;
    slug?: string;
  } | null;
  script_text?: string | null;
  transcript?: string | null;
  slide_url?: string | null;
  related_article_url?: string | null;
  level?: number;
  importance?: string | null;
  created_at?: string;
}
/**
 * 関連動画
 */
export interface RelatedVideo extends VideoBase {
  score?: number;
}
/**
 * 検索結果
 */
export interface SearchResultVideo extends VideoBase {
  similarity?: number;
  relevant_excerpt?: string;
  category?: string;
}
/**
 * 記事（解説記事ページ用）
 */
export interface Article extends VideoBase {
  id?: string;
  summary?: string;
  content?: string;
  published_at?: string;
  category?: string;
}
/**
 * ブックマークアイテム
 */
export interface BookmarkItem extends VideoBase {
  id?: number;
  created_at: string;
}
/**
 * 視聴履歴アイテム
 */
export interface HistoryItem {
  id: number;
  video_id: string;
  watched_at: string;
  watch_duration_seconds?: number;
  completed?: boolean;
  last_position_seconds?: number;
  video?: VideoBase;
}
/**
 * カテゴリ
 */
export interface Category {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
  type?: 'main' | 'sub';
  icon?: string | null;
  color?: string;
  sort_order?: number;
  is_active?: boolean;
  video_count?: number;
}
