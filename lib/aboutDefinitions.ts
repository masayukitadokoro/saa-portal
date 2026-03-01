// lib/aboutDefinitions.ts
// 各カテゴリのAboutページ用データ定義

import {
  Lightbulb, Search, Wrench, Target, Rocket, Map,
  Flag, Compass, Users, Settings, Palette, Megaphone,
  BarChart3, ShoppingCart, Heart, DollarSign,
  BookOpen, Eye, Brain, Layers, Boxes, TrendingUp,
} from 'lucide-react';

export interface AboutPhase {
  num: string;
  title: string;
  sub: string;
  color: string;
  bg: string;
  icon: React.ComponentType<{ className?: string }>;
  points: string[];
}

export interface AboutDefinition {
  slug: string;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  heroImage?: string;       // public/ 配下の画像パス
  heroImageAlt?: string;
  phasesTitle: string;
  phases: AboutPhase[];
  sidebarLabel: string;
  sidebarSub: string;
}

// ============================================================
// 起業の科学
// ============================================================
const KAGAKU_ABOUT: AboutDefinition = {
  slug: 'kagaku',
  heroTitle: 'Fit Journey とは？',
  heroSubtitle: '起業の科学の全体像',
  heroDescription: '起業のプロセスを5段階に分解。各フェーズで検証すべき問いに答えながら進みます。',
  phasesTitle: '5つのフェーズ',
  sidebarLabel: 'Fit Journeyとは',
  sidebarSub: '起業の科学の全体像',
  phases: [
    {
      num: '1', title: 'Idea Verification', sub: 'アイデアの検証',
      color: '#2563EB', bg: '#EFF6FF', icon: Lightbulb,
      points: [
        'そのアイデアは取り組む価値があるか？',
        '課題を発見し、リーンキャンバスで仮説を立てる',
      ],
    },
    {
      num: '2', title: 'Customer Problem Fit', sub: '課題の質を上げる',
      color: '#059669', bg: '#ECFDF5', icon: Search,
      points: [
        '顧客は本当にその課題を抱えているか？',
        '顧客インタビューで課題仮説を検証する',
      ],
    },
    {
      num: '3', title: 'Problem Solution Fit', sub: 'ソリューションの検証',
      color: '#D97706', bg: '#FFFBEB', icon: Wrench,
      points: [
        'その解決策は顧客に響くか？',
        'プロトタイプを作り、ユーザーインタビューで検証する',
      ],
    },
    {
      num: '4', title: 'Product Market Fit', sub: '人が欲しがるものを作る',
      color: '#DC2626', bg: '#FEF2F2', icon: Target,
      points: [
        '市場が求めるプロダクトになっているか？',
        'MVPを市場に投入し、反応を計測・改善を繰り返す',
      ],
    },
    {
      num: '5', title: 'Transition to Scale', sub: 'スケールするための変革',
      color: '#7C3AED', bg: '#F5F3FF', icon: Rocket,
      points: [
        '収益性を保ちながら拡大できるか？',
        'ユニットエコノミクスを改善し、事業を拡大する',
      ],
    },
  ],
};

// ============================================================
// 起業大全
// ============================================================
const TAIZEN_ABOUT: AboutDefinition = {
  slug: 'taizen',
  heroTitle: 'スタートアップ・バランススコアカード',
  heroSubtitle: '起業大全の全体像',
  heroDescription: 'スタートアップを科学的に経営するための9つの領域。MVVを土台に、戦略・HR・オペレーション・UX・PR・マーケティング・セールス・CS・ファイナンスまで網羅的に学びます。',
  heroImage: '/images/startup-bsc.png',
  heroImageAlt: 'スタートアップ・バランススコアカード',
  phasesTitle: '9つの領域',
  sidebarLabel: 'バランススコアカード',
  sidebarSub: '起業大全の全体像',
  phases: [
    {
      num: '1', title: 'MVV', sub: 'ミッション・ビジョン・バリュー',
      color: '#2563EB', bg: '#EFF6FF', icon: Flag,
      points: [
        'スタートアップの土台であるMVVの本質を理解する',
        '「MVVの武器化」とは何かを知る',
        'MVVの具体的な設定方法を学ぶ',
        '事業の各フェーズにおけるMVVのキーポイントを押さえる',
      ],
    },
    {
      num: '2', title: 'Strategy', sub: '戦略',
      color: '#059669', bg: '#ECFDF5', icon: Compass,
      points: [
        'スタートアップにおける戦略の重要性を理解する',
        'フィージビリティを高めつつスケーラブルな事業を展開するための思考法を学ぶ',
        '持続的競合優位性（ディフェンシビリティ）を身につけるための22の視座を把握する',
        '事業の各フェーズにおける戦略のキーポイントを押さえる',
      ],
    },
    {
      num: '3', title: 'HR', sub: '人的資源',
      color: '#D97706', bg: '#FFFBEB', icon: Users,
      points: [
        '経営陣自らの内省力を高め補完的なメンバーを集めるための手法を学ぶ',
        'スタートアップにとって必要な採用の型を理解する',
        'メンバーが高いパフォーマンスを発揮するためのエンゲージメントの型を身につける',
        '事業の各フェーズにおけるHRのキーポイントを押さえる',
      ],
    },
    {
      num: '4', title: 'Operation', sub: 'オペレーショナル・エクセレンス',
      color: '#DC2626', bg: '#FEF2F2', icon: Settings,
      points: [
        'オペレーショナル・エクセレンス（OE）とは何なのか、その要点を理解する',
        'OEを自社で実装する手法をステップ・バイ・ステップで身につける',
        '事業の各フェーズにおけるOEのキーポイントを押さえる',
      ],
    },
    {
      num: '5', title: 'UX', sub: 'ユーザーエクスペリエンス',
      color: '#7C3AED', bg: '#F5F3FF', icon: Palette,
      points: [
        'UXの基本コンセプト／重要性を確認する',
        'UXエンゲージメントモデルを活用して自社のプロダクトを磨き込む考え方を身につける',
        '事業の各フェーズにおけるUXのキーポイントを押さえる',
      ],
    },
    {
      num: '6', title: 'PR', sub: 'パブリックリレーション',
      color: '#0891B2', bg: '#ECFEFF', icon: Megaphone,
      points: [
        'ステークホルダーとのリレーションをどう高めるかの要諦を学ぶ',
        '事業の各フェーズにおけるPRのキーポイントを押さえる',
      ],
    },
    {
      num: '7', title: 'Marketing', sub: 'マーケティング',
      color: '#BE185D', bg: '#FDF2F8', icon: BarChart3,
      points: [
        'マーケティングの基本を理解する',
        'マーケティングのチャネルを網羅的に理解し適切な施策を打つための知見を身につける',
        'データドリブンなマーケティングを実装するための思考フレームを学ぶ',
        '事業の各フェーズにおけるマーケティングのキーポイントを押さえる',
      ],
    },
    {
      num: '8', title: 'Sales', sub: 'セールス',
      color: '#EA580C', bg: '#FFF7ED', icon: ShoppingCart,
      points: [
        'スタートアップにおけるセールスの重要性を理解する',
        '顧客視点でのセールスとは何か、インサイドセールスの仕組み、フィールドセールスとの連携など、セールスを進化させるためのフレームを身につける',
        '事業の各フェーズにおけるセールスのキーポイントを押さえる',
      ],
    },
    {
      num: '9', title: 'Customer Success', sub: 'カスタマーサクセス',
      color: '#4F46E5', bg: '#EEF2FF', icon: Heart,
      points: [
        'カスタマーサクセスの要諦や重要性について理解する',
        'カスタマーサクセスを自社で実装するための思考フレームを身につける',
        '事業の各フェーズにおけるカスタマーサクセスのキーポイントを押さえる',
      ],
    },
    {
      num: '10', title: 'Finance', sub: 'ファイナンス',
      color: '#065F46', bg: '#ECFDF5', icon: DollarSign,
      points: [
        'スタートアップにおけるファイナンスの要諦を知る',
        '資本政策やエクイティストーリーなど、スケールするためのファイナンス戦略の解像度を上げるフレームを学ぶ',
        'スタートアップにとって重要なピッチの勘所をチェックする',
        '投資家との交渉を有利に進めるための秘訣を知る',
        '事業の各フェーズにおけるファイナンスのキーポイントを押さえる',
      ],
    },
  ],
};

// ============================================================
// 起業参謀
// ============================================================
const SANBO_ABOUT: AboutDefinition = {
  slug: 'sanbo',
  heroTitle: '起業参謀フレームワーク',
  heroSubtitle: '起業参謀の全体像',
  heroDescription: 'スタートアップを支援する「参謀」として必要な眼・能力・フレームワークを体系的に学びます。起業家に寄り添い、的確なアドバイスができるメンターを目指します。',
  phasesTitle: '6つの領域',
  sidebarLabel: 'フレームワーク全体像',
  sidebarSub: '起業参謀の全体像',
  phases: [
    {
      num: '1', title: 'Introduction', sub: '起業参謀概要',
      color: '#2563EB', bg: '#EFF6FF', icon: BookOpen,
      points: [
        '起業参謀の役割と価値を理解する',
        '5つの眼（鳥の眼・虫の眼）で課題を多角的に見極める力を養う',
        'メンタリングに必要なCapabilityとスキルセットを身につける',
      ],
    },
    {
      num: '2', title: 'Frameworks', sub: '鉄板フレームワーク',
      color: '#059669', bg: '#ECFDF5', icon: Layers,
      points: [
        '自己分析・課題発見のフレームワークを習得する',
        '市場・外部環境分析（TAM/SAM, STEEP, VRIO等）を使いこなす',
        '顧客理解とソリューション設計の手法を学ぶ',
        'UX・PMF検証とGTM戦略を実践する',
      ],
    },
    {
      num: '3', title: 'Prototype & MVP', sub: 'プロトタイプ・MVP',
      color: '#D97706', bg: '#FFFBEB', icon: Boxes,
      points: [
        'MSP/MVPの種類と使い分けを理解する',
        '「事業の筋の良さ」をチェックする方法を学ぶ',
        '創業メンバーの見極めと価格設定の手法を習得する',
      ],
    },
    {
      num: '4', title: 'KPI Design', sub: 'KPI設計と運用',
      color: '#DC2626', bg: '#FEF2F2', icon: Target,
      points: [
        'KPIツリー・コホート分析・AARRRの設計を学ぶ',
        'マーケティングファネルとPESO分析を実践する',
        '自社の魅力化（アピールブック）とMOAT構築を理解する',
      ],
    },
    {
      num: '5', title: 'Network Effects', sub: 'ネットワーク効果',
      color: '#7C3AED', bg: '#F5F3FF', icon: TrendingUp,
      points: [
        'ネットワーク効果の13レイヤーと構築戦略を学ぶ',
        'フライホイールとバリュージャーニーの設計を理解する',
        'Startup360によるスケール検証の方法を習得する',
        '採用・業務改善・海外展開のフレームワークを学ぶ',
      ],
    },
    {
      num: '6', title: 'Due Diligence', sub: 'スタートアップ目利き',
      color: '#BE185D', bg: '#FDF2F8', icon: Eye,
      points: [
        'スタートアップの目利きポイント（サマリー・詳細・ノックアウトファクター）を習得する',
        '投資家との交渉を有利に進めるためのポイントを学ぶ',
      ],
    },
  ],
};

// ============================================================
// Exports
// ============================================================
export const ABOUT_DEFINITIONS: Record<string, AboutDefinition> = {
  kagaku: KAGAKU_ABOUT,
  taizen: TAIZEN_ABOUT,
  sanbo: SANBO_ABOUT,
};

export function getAboutDefinition(slug: string): AboutDefinition {
  return ABOUT_DEFINITIONS[slug] || KAGAKU_ABOUT;
}
