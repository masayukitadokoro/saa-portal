import type { EventType } from '@/lib/notion';

/**
 * Zoom URLの定数
 * 変更時はここだけ修正すればOK
 */
export const ZOOM_URLS: Record<EventType, string> = {
  regular: 'https://us02web.zoom.us/j/87857521843?pwd=FQTUcLkKsNxhNxNFTwg1L1WkXOczdv.1',
  office_hour: 'https://us02web.zoom.us/j/87857521843?pwd=FQTUcLkKsNxhNxNFTwg1L1WkXOczdv.1',
  expert: 'https://us02web.zoom.us/j/89982191591?pwd=nYEQ0lA9oBEFVTCMfvQtVN3tYsSAn5.1',
  special: 'https://us02web.zoom.us/j/89982191591?pwd=nYEQ0lA9oBEFVTCMfvQtVN3tYsSAn5.1',
  other: 'https://us02web.zoom.us/j/89982191591?pwd=nYEQ0lA9oBEFVTCMfvQtVN3tYsSAn5.1',
};

/**
 * イベントタイプごとのスタイル定義
 */
export const EVENT_STYLES: Record<EventType, {
  color: string;
  bgColor: string;
  label: string;
  emoji: string;
}> = {
  regular: { color: 'text-red-600', bgColor: 'bg-red-500', label: '定例講義', emoji: '🔴' },
  expert: { color: 'text-green-600', bgColor: 'bg-green-500', label: '専門家講義', emoji: '🟢' },
  office_hour: { color: 'text-blue-600', bgColor: 'bg-blue-500', label: 'オフィスアワー', emoji: '🔵' },
  special: { color: 'text-orange-600', bgColor: 'bg-orange-500', label: '特別講義', emoji: '🟠' },
  other: { color: 'text-gray-600', bgColor: 'bg-gray-500', label: 'その他', emoji: '⚪' },
};

/**
 * カテゴリ関連の定数
 */
export const CATEGORY_NAMES: Record<string, string> = {
  kagaku: '起業の科学',
  taizen: '起業大全',
  sanbo: '起業参謀',
};

export const CATEGORY_COLORS: Record<string, string> = {
  kagaku: '#3B82F6',
  taizen: '#10B981',
  sanbo: '#8B5CF6',
};

export const CATEGORY_SLUG_MAP: Record<number, string> = {
  1: 'kagaku',
  2: 'taizen',
  3: 'sanbo',
};

/**
 * Zoom URLを取得するヘルパー関数
 */
export function getZoomUrl(eventType: EventType): string {
  return ZOOM_URLS[eventType] || ZOOM_URLS.other;
}

/**
 * イベントスタイルを取得するヘルパー関数
 */
export function getEventStyle(eventType: EventType) {
  return EVENT_STYLES[eventType] || EVENT_STYLES.other;
}
