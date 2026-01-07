/**
 * 円形プログレスチャート（パイチャート）
 * 
 * 進捗表示に使用する共通コンポーネント
 */

interface PieChartProps {
  /** 進捗率（0-100） */
  percent: number;
  /** チャートのサイズ（px） */
  size?: number;
  /** プログレス部分の色 */
  color?: string;
  /** 背景色 */
  bgColor?: string;
  /** 線の太さ */
  strokeWidth?: number;
  /** 中央に表示するテキスト（デフォルトはpercent%） */
  label?: string;
  /** ラベルのフォントサイズクラス */
  labelClassName?: string;
}

export function PieChart({
  percent,
  size = 80,
  color = '#6366F1',
  bgColor = '#E5E7EB',
  strokeWidth = 8,
  label,
  labelClassName = 'text-lg font-bold text-gray-900',
}: PieChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* 背景の円 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        {/* プログレスの円 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      {/* 中央のラベル */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={labelClassName}>{label ?? `${percent}%`}</span>
      </div>
    </div>
  );
}

/**
 * 小サイズのパイチャート（カテゴリ進捗用）
 */
export function PieChartSmall({
  percent,
  color = '#6366F1',
}: {
  percent: number;
  color?: string;
}) {
  return (
    <PieChart
      percent={percent}
      size={60}
      color={color}
      strokeWidth={6}
      labelClassName="text-sm font-bold text-gray-900"
    />
  );
}

/**
 * 大サイズのパイチャート（全体進捗用）
 */
export function PieChartLarge({
  percent,
  color = '#6366F1',
  size = 'lg',
}: {
  percent: number;
  color?: string;
  size?: 'md' | 'lg';
}) {
  const config = {
    md: { size: 80, stroke: 8, label: 'text-lg font-bold text-gray-900' },
    lg: { size: 100, stroke: 10, label: 'text-xl font-bold text-gray-900' },
  };
  
  const cfg = config[size];
  
  return (
    <PieChart
      percent={percent}
      size={cfg.size}
      color={color}
      strokeWidth={cfg.stroke}
      labelClassName={cfg.label}
    />
  );
}
