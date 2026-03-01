// lib/chapterDefinitions.ts
// 3書籍の章構成定義

export interface ChapterStep {
  id: string;
  label: string;
  desc: string;
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  color: string;
  steps: ChapterStep[];
}

export interface BookDefinition {
  slug: string;
  name: string;
  chapters: Chapter[];
}

// ============================================================
// 起業の科学
// ============================================================
const KAGAKU_CHAPTERS: Chapter[] = [
  {
    id: 'ch1', number: 1,
    title: 'Idea Verification',
    subtitle: 'アイデアの検証',
    color: '#2563EB',
    steps: [
      { id: '1-1', label: 'アイディアに気付く', desc: 'どういう課題を解決するかを明確にする' },
      { id: '1-2', label: 'スタートアップのメタ原則', desc: '常識とは異なるスタートアップの原則を知る' },
      { id: '1-3', label: 'アイデアの検証', desc: 'スタートアップとしての潜在性を検証する' },
      { id: '1-4', label: 'Plan Aの作成', desc: 'リーンキャンバスを用いてPlan Aを作る' },
    ],
  },
  {
    id: 'ch2', number: 2,
    title: 'Customer Problem Fit',
    subtitle: '課題の質を上げる',
    color: '#059669',
    steps: [
      { id: '2-1', label: '課題仮説の構築', desc: 'カスタマーの抱えている課題の仮説を構築する' },
      { id: '2-2', label: 'プロブレムインタビューを行う', desc: '実際の顧客からインサイトを取りに行く' },
      { id: '2-3', label: '課題の質を高める', desc: '課題の構造化を行い課題の本質を見極める' },
    ],
  },
  {
    id: 'ch3', number: 3,
    title: 'Problem Solution Fit',
    subtitle: 'ソリューションの検証',
    color: '#D97706',
    steps: [
      { id: '3-1', label: 'ソリューションの本質を理解する', desc: 'ソリューションの土台となるUVPとUXを理解する' },
      { id: '3-2', label: 'Build Prototype', desc: 'コンテクストの質を高めプロトタイプを作る' },
      { id: '3-3', label: 'Solutionインタビュー', desc: 'プロトタイプを活用してインタビューを行う' },
    ],
  },
  {
    id: 'ch4', number: 4,
    title: 'Product Market Fit',
    subtitle: '人が欲しがるものを作る',
    color: '#DC2626',
    steps: [
      { id: '4-1', label: 'MVPを構築する', desc: 'MVPを検討し構築する' },
      { id: '4-2', label: 'MVPをカスタマーに届ける', desc: 'カスタマーにMVPを届け検証する' },
      { id: '4-3', label: '定量・定性計測を行う', desc: '定量・定性の両面から計測する' },
      { id: '4-4', label: '継続的なUX改善', desc: 'UXを継続的に改善しプロダクトの質を高める' },
      { id: '4-5', label: 'PMFの再現性', desc: 'PMF判定と再現性の検証' },
      { id: '4-6', label: 'Pivotを行う', desc: 'ビジネスモデルを見直しPivotする' },
    ],
  },
  {
    id: 'ch5', number: 5,
    title: 'Transition to Scale',
    subtitle: '収益性を改善&スケール',
    color: '#7C3AED',
    steps: [
      { id: '5-1', label: '収益性を改善する', desc: '収益性を確保する仕組みを強化' },
      { id: '5-2', label: 'CACを下げる', desc: '顧客獲得コストの最適化' },
      { id: '5-3', label: 'LTVを高める', desc: 'LTV最大化とカスタマーサクセス' },
      { id: '5-4', label: 'MOATを構築する', desc: '参入障壁の構築' },
      { id: '5-5', label: 'PMFを掛け合わせる', desc: '複数PMFの展開' },
    ],
  },
];

// ============================================================
// 起業大全
// ============================================================
const TAIZEN_CHAPTERS: Chapter[] = [
  {
    id: 'ch1', number: 1,
    title: 'MVV',
    subtitle: 'MVV（ミッション・ビジョン・バリュー）',
    color: '#2563EB',
    steps: [
      { id: '1-1', label: 'MVVの全体像', desc: 'MVVの本質と重要性を理解する' },
      { id: '1-2', label: 'MVVの実務上の価値', desc: '採用力・広報力への具体的効果' },
      { id: '1-3', label: 'Mission・Vision・Value設定', desc: 'M・V・Vそれぞれの設定ポイント' },
      { id: '1-4', label: 'リーダーシップとストーリー', desc: 'ストーリーテリングと自己マスタリー' },
    ],
  },
  {
    id: 'ch2', number: 2,
    title: 'Strategy',
    subtitle: '戦略',
    color: '#059669',
    steps: [
      { id: '2-1', label: '戦略の全体像', desc: 'スタートアップ戦略の概要を理解する' },
      { id: '2-2', label: '市場選定とビジネスモデル', desc: '狙うべき市場とPMFの型を理解する' },
      { id: '2-3', label: 'コールドスタート問題の解消', desc: 'ニワトリタマゴのジレンマを解消する' },
      { id: '2-4', label: 'Defensibility構築', desc: '競合優位性と参入障壁を構築する' },
    ],
  },
  {
    id: 'ch3', number: 3,
    title: 'HR',
    subtitle: '人事・組織',
    color: '#D97706',
    steps: [
      { id: '3-1', label: 'HR・組織の基盤', desc: '組織の重要性と基盤を理解する' },
      { id: '3-2', label: '創業チーム構築', desc: '初期メンバーの集め方と注意点' },
      { id: '3-3', label: '採用の極意', desc: '人材戦略から採用プロセスまで' },
      { id: '3-4', label: 'エンゲージメント向上', desc: '従業員エンゲージメントを高める施策' },
    ],
  },
  {
    id: 'ch4', number: 4,
    title: 'Operation',
    subtitle: 'オペレーション',
    color: '#DC2626',
    steps: [
      { id: '4-1', label: 'オペレーションの全体像', desc: 'オペレーショナルエクセレンスの重要性' },
      { id: '4-2', label: '業務改善の実践', desc: '業務の見える化から標準化・システム化まで' },
    ],
  },
  {
    id: 'ch5', number: 5,
    title: 'UX',
    subtitle: 'UXデザイン',
    color: '#7C3AED',
    steps: [
      { id: '5-1', label: 'UXの基礎', desc: 'UXの本質と重要性を理解する' },
      { id: '5-2', label: 'UXデザインの実践', desc: '出会いから利用後までのUX設計' },
      { id: '5-3', label: 'UXの高度化', desc: '熟達・投資・報酬のUX設計' },
    ],
  },
  {
    id: 'ch6', number: 6,
    title: 'PR',
    subtitle: 'パブリックリレーション',
    color: '#0891B2',
    steps: [
      { id: '6-1', label: 'PRの基礎', desc: 'ステークホルダーとのリレーション構築' },
    ],
  },
  {
    id: 'ch7', number: 7,
    title: 'Marketing',
    subtitle: 'マーケティング',
    color: '#BE185D',
    steps: [
      { id: '7-1', label: 'マーケティングの全体像', desc: 'マーケティングの目的とファネル' },
      { id: '7-2', label: 'N1分析', desc: 'N1起点のカスタマー分析' },
      { id: '7-3', label: 'メディア戦略', desc: 'Paid/Owned/Earned/Sharedメディア' },
      { id: '7-4', label: 'データドリブンマーケティング', desc: 'データに基づくマーケティング' },
    ],
  },
  {
    id: 'ch8', number: 8,
    title: 'Sales',
    subtitle: 'セールス',
    color: '#EA580C',
    steps: [
      { id: '8-1', label: 'Salesの全体像', desc: 'デジタル時代のセールスを理解する' },
      { id: '8-2', label: '営業プロセス', desc: 'リード管理からクロージングまで' },
      { id: '8-3', label: 'Inside Sales', desc: 'インサイドセールスの実装' },
    ],
  },
  {
    id: 'ch9', number: 9,
    title: 'Customer Success',
    subtitle: 'カスタマーサクセス',
    color: '#4F46E5',
    steps: [
      { id: '9-1', label: 'CSの全体像と重要性', desc: 'なぜCSが重要なのかを理解する' },
      { id: '9-2', label: 'CSのマインドセットとKPI', desc: 'CSの文化とKPIを設計する' },
      { id: '9-3', label: 'CS実装のステップ', desc: 'オンボーディングからPLGまで' },
    ],
  },
  {
    id: 'ch10', number: 10,
    title: 'Finance',
    subtitle: 'ファイナンス',
    color: '#065F46',
    steps: [
      { id: '10-1', label: 'ファイナンスの基礎', desc: '資本政策とCaptableの基本' },
      { id: '10-2', label: 'エクイティとIPO/M&A', desc: 'エクイティストーリーとExit戦略' },
      { id: '10-3', label: '資金調達の手法', desc: 'CB・優先株・SOを理解する' },
      { id: '10-4', label: '投資家対応', desc: 'ピッチからIRまでの投資家コミュニケーション' },
    ],
  },
];

// ============================================================
// 起業参謀
// ============================================================
const SANBO_CHAPTERS: Chapter[] = [
  {
    id: 'ch1', number: 1,
    title: 'Introduction',
    subtitle: '起業参謀概要',
    color: '#2563EB',
    steps: [
      { id: '1-1', label: '起業参謀とは', desc: '起業参謀の役割とプロセス' },
      { id: '1-2', label: '５つの眼', desc: '鳥の眼・虫の眼で課題を見極める' },
      { id: '1-3', label: 'Capability & メンタリング', desc: '必要なスキルとメンタリング手法' },
    ],
  },
  {
    id: 'ch2', number: 2,
    title: 'Frameworks',
    subtitle: '鉄板フレームワーク',
    color: '#059669',
    steps: [
      { id: '2-1', label: '自己分析・課題発見', desc: 'ライフジャーニー・IKIGAI・課題構造化' },
      { id: '2-2', label: '市場・外部環境分析', desc: 'TAM/SAM・STEEP・VRIO・GTM分析' },
      { id: '2-3', label: '顧客理解とソリューション', desc: 'ペルソナ・インタビュー・リーンキャンバス' },
      { id: '2-4', label: 'UXとPMF検証', desc: 'エンゲージメントマップ・ヘルススコア・PMF' },
      { id: '2-5', label: 'GTM戦略', desc: 'Go-to-market戦略とセールス手法' },
    ],
  },
  {
    id: 'ch3', number: 3,
    title: 'Prototype & MVP',
    subtitle: 'プロトタイプ・MVP',
    color: '#D97706',
    steps: [
      { id: '3-1', label: 'プロトタイプとMVP', desc: 'MSP/MVPの種類と筋の良さチェック' },
      { id: '3-2', label: 'チームと価格設定', desc: '創業メンバー見極めとPSM分析' },
    ],
  },
  {
    id: 'ch4', number: 4,
    title: 'KPI Design',
    subtitle: 'KPI設計と運用',
    color: '#DC2626',
    steps: [
      { id: '4-1', label: 'KPIの基礎', desc: 'KPIツリー・コホート・AARRR' },
      { id: '4-2', label: 'マーケティングとロードマップ', desc: 'PESO分析・ファネル設計・ロードマップ' },
      { id: '4-3', label: '組織の魅力化と防衛', desc: 'アピールブックとMOAT構築' },
    ],
  },
  {
    id: 'ch5', number: 5,
    title: 'Network Effects',
    subtitle: 'ネットワーク効果',
    color: '#7C3AED',
    steps: [
      { id: '5-1', label: 'ネットワーク効果の基礎', desc: '13レイヤーと構築戦略' },
      { id: '5-2', label: 'フライホイールとバリューチェーン', desc: 'フライホイール・バリュージャーニー' },
      { id: '5-3', label: 'スケールと検証', desc: 'Startup360・PMF検証・バランススコアカード' },
      { id: '5-4', label: '組織・業務・展開', desc: '採用・業務改善・両効き経営・海外展開' },
    ],
  },
  {
    id: 'ch6', number: 6,
    title: 'Due Diligence',
    subtitle: 'スタートアップ目利き',
    color: '#BE185D',
    steps: [
      { id: '6-1', label: '目利きの方法', desc: 'サマリー・詳細・ノックアウトファクター' },
      { id: '6-2', label: '投資家交渉', desc: '投資家との交渉ポイント' },
    ],
  },
];

// ============================================================
// Exports
// ============================================================
export const BOOK_DEFINITIONS: Record<string, BookDefinition> = {
  kagaku: { slug: 'kagaku', name: '起業の科学', chapters: KAGAKU_CHAPTERS },
  taizen: { slug: 'taizen', name: '起業大全', chapters: TAIZEN_CHAPTERS },
  sanbo:  { slug: 'sanbo',  name: '起業参謀', chapters: SANBO_CHAPTERS },
};

// 後方互換: 起業の科学のみ使うコードのため
export const CHAPTERS = KAGAKU_CHAPTERS;

export function getBookDefinition(slug: string): BookDefinition | undefined {
  return BOOK_DEFINITIONS[slug];
}

export function getChapterById(id: string, slug = 'kagaku'): Chapter | undefined {
  const book = BOOK_DEFINITIONS[slug];
  return book?.chapters.find(ch => ch.id === id);
}

export function getChapterForStep(stepId: string, slug = 'kagaku') {
  const book = BOOK_DEFINITIONS[slug];
  if (!book) return null;
  for (const ch of book.chapters) {
    const step = ch.steps.find(s => s.id === stepId);
    if (step) return { chapter: ch, step };
  }
  return null;
}
