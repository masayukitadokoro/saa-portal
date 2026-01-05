// ===========================================
// VideoTitle コンポーネント
// タイトル表示の一元管理 - 変更時はここだけ修正
// ===========================================

import { formatVideoTitle } from '@/lib/formatTitle';

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'span' | 'p';

interface VideoTitleProps {
  title: string;
  displayOrder?: number | null;
  as?: HeadingLevel;
  className?: string;
  lineClamp?: 1 | 2 | 3;
}

/**
 * 動画タイトル表示コンポーネント
 * 
 * @example
 * // 基本使用
 * <VideoTitle title={video.title} displayOrder={video.display_order} />
 * 
 * // 見出しレベル指定
 * <VideoTitle title={video.title} displayOrder={video.display_order} as="h1" />
 * 
 * // 行数制限付き
 * <VideoTitle title={video.title} displayOrder={video.display_order} lineClamp={2} />
 */
export function VideoTitle({ 
  title, 
  displayOrder, 
  as: Component = 'span',
  className = '',
  lineClamp
}: VideoTitleProps) {
  const formattedTitle = formatVideoTitle(title, displayOrder);
  
  const lineClampClass = lineClamp 
    ? `line-clamp-${lineClamp}` 
    : '';
  
  const combinedClassName = [className, lineClampClass]
    .filter(Boolean)
    .join(' ');

  return (
    <Component className={combinedClassName || undefined}>
      {formattedTitle}
    </Component>
  );
}

export default VideoTitle;
