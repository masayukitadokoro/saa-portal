/**
 * 日付ユーティリティ関数
 * 
 * 全ての日付フォーマット処理をここに集約
 * 変更時はここだけ修正すればOK
 */

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

/**
 * 日付を「1/7(火)」形式でフォーマット
 */
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = WEEKDAYS[date.getDay()];
  return `${month}/${day}(${weekday})`;
}

/**
 * 日付を「2026年1月7日(火)」形式でフォーマット
 */
export function formatDateLong(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = WEEKDAYS[date.getDay()];
  return `${year}年${month}月${day}日(${weekday})`;
}

/**
 * 日付を日と曜日のオブジェクトで返す（カレンダー表示用）
 */
export function formatDateParts(dateString: string): { day: number; weekday: string } {
  const date = new Date(dateString);
  return {
    day: date.getDate(),
    weekday: WEEKDAYS[date.getDay()],
  };
}

/**
 * 時刻を「20:00」形式でフォーマット
 */
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

/**
 * 今日からの日数を計算して表示用テキストを返す
 * 過去の場合はnullを返す
 */
export function getDaysUntil(dateString: string): string | null {
  const now = new Date();
  const eventDate = new Date(dateString);
  const diffTime = eventDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return null;
  if (diffDays === 0) return '今日';
  if (diffDays === 1) return '明日';
  return `${diffDays}日後`;
}

/**
 * 今日からの日数を計算して「あと〇日」形式で返す
 */
export function getDaysUntilWithPrefix(dateString: string): string | null {
  const now = new Date();
  const eventDate = new Date(dateString);
  const diffTime = eventDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return null;
  if (diffDays === 0) return '今日';
  if (diffDays === 1) return '明日';
  return `あと${diffDays}日`;
}

/**
 * 動画の長さを「14:24」形式でフォーマット
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

/**
 * 相対的な日時を返す（「今日 14:30」「昨日」「1/5」）
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (targetDate.getTime() === today.getTime()) {
    return `今日 ${formatTime(dateString)}`;
  }
  if (targetDate.getTime() === yesterday.getTime()) {
    return '昨日';
  }
  return formatDateShort(dateString);
}
