/**
 * 動画タイトルを表示用にフォーマットする
 * 
 * @param title - 元のタイトル（例: "1-1_起業の科学新装版とは"）
 * @param displayOrder - 連番（例: 1）
 * @returns フォーマット済みタイトル（例: "1 起業の科学新装版とは"）
 */
export function formatVideoTitle(title: string, displayOrder?: number | null): string {
  if (!title) return '';
  
  // 番号部分（1-1_, 2-3_など）を削除して本文のみ取得
  const textPart = title.replace(/^(\d+(?:-\d+)?)_/, '');
  
  // displayOrderがあれば連番を付ける
  if (displayOrder) {
    return `${displayOrder} ${textPart}`;
  }
  
  // displayOrderがない場合は元の変換（アンダースコアをスペースに）
  return title.replace(/^(\d+(?:-\d+)?)_/, '$1 ');
}

/**
 * 動画の表示用番号を取得する
 * display_orderがあればそれを使い、なければタイトル先頭の数字を抽出
 */
export function getDisplayOrder(title: string, displayOrder?: number | null): number | null {
  if (displayOrder != null) return displayOrder;
  const match = title.match(/^\s*(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}
