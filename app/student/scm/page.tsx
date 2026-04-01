'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StudentLayout } from '@/components/student/StudentLayout';
import {
  Info,
  Play,
  BarChart3,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Target,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';
import { SCM_CATEGORIES } from '@/types/scm';
import type { SCMCategoryId } from '@/types/scm';

const STORAGE_KEY_RESULTS = 'scm_results_history';

interface StoredSCMResult {
  id: string;
  userId: string;
  totalScore: number;
  totalPercentage: number;
  categoryScores: Array<{
    categoryId: SCMCategoryId;
    totalScore: number;
    maxScore: number;
    percentage: number;
    questionCount: number;
  }>;
  strengths: SCMCategoryId[];
  weaknesses: SCMCategoryId[];
  takenAt: string;
}

type ViewType = 'about' | 'take' | { type: 'result'; index: number };

export default function SCMPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<StoredSCMResult[]>([]);
  const [activeView, setActiveView] = useState<ViewType>('about');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }
    const resultsStr = localStorage.getItem(STORAGE_KEY_RESULTS);
    if (resultsStr) {
      const parsed = JSON.parse(resultsStr);
      setResults(parsed);
    }
    setLoading(false);
  }, [authLoading, user, router]);

  const hasResults = results.length > 0;
  const latestResult = hasResults ? results[results.length - 1] : null;

  const getExamLabel = () => {
    if (!hasResults) return '初めて受験する';
    return 'もう一度受験する';
  };

  const getExamIcon = () => {
    if (!hasResults) return <Play className="w-3.5 h-3.5" />;
    return <RotateCcw className="w-3.5 h-3.5" />;
  };

  if (authLoading || loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="flex min-h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
          <div className="py-3 px-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">
              SCM
            </p>

            <nav className="space-y-0.5">
              <button
                onClick={() => setActiveView('about')}
                className={`w-full flex items-center gap-2 px-2 py-2 text-[13px] rounded-md transition ${
                  activeView === 'about'
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Info className="w-3.5 h-3.5 flex-shrink-0" />
                <span>SCMとは</span>
              </button>

              <button
                onClick={() => setActiveView('take')}
                className={`w-full flex items-center gap-2 px-2 py-2 text-[13px] rounded-md transition ${
                  activeView === 'take'
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {getExamIcon()}
                <span>{getExamLabel()}</span>
              </button>
            </nav>

            {results.length > 0 && (
              <>
                <div className="h-px bg-gray-100 my-3 mx-2" />
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1.5">
                  受験履歴
                </p>
                <nav className="space-y-0.5">
                  {results.map((r, i) => {
                    const isActive =
                      typeof activeView === 'object' &&
                      activeView.type === 'result' &&
                      activeView.index === i;
                    const date = new Date(r.takenAt);
                    return (
                      <button
                        key={r.id}
                        onClick={() =>
                          setActiveView({ type: 'result', index: i })
                        }
                        className={`w-full flex items-center gap-2 px-2 py-2 text-[12px] rounded-md transition ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-700 font-medium'
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <Calendar className="w-3 h-3 flex-shrink-0 text-gray-400" />
                        <span className="flex-1 text-left truncate">
                          第{i + 1}回{' '}
                          {date.toLocaleDateString('ja-JP', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="text-[10px] font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded flex-shrink-0">
                          {r.totalPercentage}%
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-8 py-8">
            {activeView === 'about' && <AboutView />}
            {activeView === 'take' && (
              <TakeExamView hasResults={hasResults} />
            )}
            {typeof activeView === 'object' &&
              activeView.type === 'result' && (
                <ResultView result={results[activeView.index]} index={activeView.index} />
              )}
          </div>
        </main>
      </div>
    </StudentLayout>
  );
}

function AboutView() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        SCM（Startup Capability Metrics）とは
      </h1>

      <div className="border border-gray-200 rounded-xl p-5 mb-6">
        <div className="flex items-start gap-3">
          <BarChart3 className="w-6 h-6 text-indigo-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-gray-700 leading-relaxed">
              起業参謀としての総合能力を6つの軸で測定するアセスメントです。
              SAA期間中、何度でも受験でき、自分の成長を可視化できます。
            </p>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        6つの評価カテゴリ
      </h2>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {Object.values(SCM_CATEGORIES).map((cat) => (
          <div
            key={cat.id}
            className="border border-gray-200 rounded-lg p-3 flex items-center gap-3"
          >
            <span className="text-xl">{cat.emoji}</span>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {cat.name}
              </p>
              <p className="text-xs text-gray-500">
                {cat.questions.length}問
              </p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        受験の流れ
      </h2>

      <div className="space-y-3">
        {[
          {
            icon: <Target className="w-5 h-5 text-indigo-500" />,
            title: '全73問に回答',
            desc: '各質問に1〜5段階で自己評価します。約15〜20分程度かかります。',
          },
          {
            icon: <BarChart3 className="w-5 h-5 text-green-500" />,
            title: '結果を確認',
            desc: 'カテゴリ別のスコアと、強み・弱みが表示されます。',
          },
          {
            icon: <TrendingUp className="w-5 h-5 text-amber-500" />,
            title: '成長を追跡',
            desc: '複数回受験することで、成長の軌跡を確認できます。',
          },
        ].map((step, i) => (
          <div
            key={i}
            className="flex items-start gap-3 border border-gray-200 rounded-lg p-4"
          >
            <div className="flex-shrink-0 mt-0.5">{step.icon}</div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {i + 1}. {step.title}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TakeExamView({ hasResults }: { hasResults: boolean }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        {hasResults ? 'もう一度SCMを受験する' : 'SCMを受験する'}
      </h1>

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 mb-6">
        <p className="text-indigo-800 leading-relaxed mb-4">
          {hasResults
            ? '前回の結果と比較して、成長を確認しましょう。全73問、約15〜20分で完了します。'
            : 'まずはSCMを受けて、起業参謀としての現在地を把握しましょう。全73問、約15〜20分で完了します。'}
        </p>
        <a
          href="/student/scm/assessment"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
        >
          <Play className="w-4 h-4" />
          {hasResults ? 'もう一度受験する' : '受験を開始する'}
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>

      <div className="space-y-2 text-sm text-gray-500">
        <p className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          途中保存はされません。時間のあるときに受験してください。
        </p>
        <p className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          回答はブラウザに保存されます。
        </p>
        <p className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          何度でも受験できます。
        </p>
      </div>
    </div>
  );
}

function ResultView({
  result,
  index,
}: {
  result: StoredSCMResult;
  index: number;
}) {
  const date = new Date(result.takenAt);

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
        <span>受験履歴</span>
        <span>•</span>
        <span>
          第{index + 1}回（
          {date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
          ）
        </span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        SCM結果
      </h1>

      {/* Overall score */}
      <div className="flex items-center gap-6 mb-8 p-5 bg-gray-50 rounded-xl">
        <div className="text-center">
          <div className="text-4xl font-bold text-indigo-600">
            {result.totalPercentage}%
          </div>
          <div className="text-xs text-gray-500 mt-1">総合スコア</div>
        </div>
        <div className="flex-1">
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full"
              style={{ width: `${result.totalPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0</span>
            <span>100</span>
          </div>
        </div>
      </div>

      {/* Category scores */}
      <h2 className="text-lg font-semibold text-gray-900 mb-3">
        カテゴリ別スコア
      </h2>

      <div className="space-y-3 mb-8">
        {result.categoryScores.map((cs) => {
          const cat =
            SCM_CATEGORIES[cs.categoryId as keyof typeof SCM_CATEGORIES];
          if (!cat) return null;
          return (
            <div
              key={cs.categoryId}
              className="flex items-center gap-3 text-sm"
            >
              <span className="text-lg flex-shrink-0">{cat.emoji}</span>
              <span className="w-24 text-gray-700 flex-shrink-0 truncate">
                {cat.name}
              </span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${cs.percentage}%`,
                    backgroundColor: cat.color,
                  }}
                />
              </div>
              <span className="w-10 text-right font-medium text-gray-800 flex-shrink-0">
                {cs.percentage}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-green-200 bg-green-50/50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            強み
          </h3>
          <div className="space-y-1">
            {result.strengths.map((s) => {
              const cat =
                SCM_CATEGORIES[s as keyof typeof SCM_CATEGORIES];
              return cat ? (
                <p key={s} className="text-sm text-green-700">
                  {cat.emoji} {cat.name}
                </p>
              ) : null;
            })}
          </div>
        </div>
        <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
            <Target className="w-4 h-4" />
            改善ポイント
          </h3>
          <div className="space-y-1">
            {result.weaknesses.map((w) => {
              const cat =
                SCM_CATEGORIES[w as keyof typeof SCM_CATEGORIES];
              return cat ? (
                <p key={w} className="text-sm text-amber-700">
                  {cat.emoji} {cat.name}
                </p>
              ) : null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
