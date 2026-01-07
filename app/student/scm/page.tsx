'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Play, TrendingUp, Target, ExternalLink, Info, ArrowRight, Rocket, Sparkles } from 'lucide-react';
import { StudentLayout } from '@/components/student/StudentLayout';
import { Card, CardHeader, ProgressBar } from '@/components/student/ui';
import { PieChartLarge } from '@/components/ui/PieChart';
import { SCM_CATEGORIES, SCM_CATEGORY_IDS } from '@/types/scm';
import type { SCMCategoryId } from '@/types/scm';

// localStorage キー
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

export default function SCMPage() {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<StoredSCMResult[]>([]);
  const [hasResults, setHasResults] = useState(false);

  useEffect(() => {
    // localStorageから結果を取得
    const resultsStr = localStorage.getItem(STORAGE_KEY_RESULTS);
    if (resultsStr) {
      const parsed = JSON.parse(resultsStr);
      setResults(parsed);
      setHasResults(parsed.length > 0);
    }
    setLoading(false);
  }, []);

  const latestResult = results.length > 0 ? results[results.length - 1] : null;
  const previousResults = results.slice(0, -1);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#6366F1';
    if (score >= 40) return '#F59E0B';
    return '#EF4444';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return { text: '優秀', color: 'text-green-600 bg-green-50' };
    if (score >= 60) return { text: '良好', color: 'text-indigo-600 bg-indigo-50' };
    if (score >= 40) return { text: '成長中', color: 'text-amber-600 bg-amber-50' };
    return { text: '要改善', color: 'text-red-600 bg-red-50' };
  };

  const scoreDiff = latestResult && previousResults.length > 0 
    ? latestResult.totalPercentage - previousResults[previousResults.length - 1].totalPercentage 
    : 0;

  if (loading) {
    return (
      <StudentLayout pageTitle="SCM">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout pageTitle="SCM">
      <div className="max-w-4xl mx-auto">
        {/* SCMとは */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-7 h-7 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Startup Adviser Capability Metrics（通称 SCM）とは
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  起業参謀としての総合能力を6つの軸で測定するアセスメントです。
                  SAA期間中、何度でも受験でき、自分の成長を可視化できます。
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* 初回ユーザー向けUI */}
        {!hasResults && (
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 text-white mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Rocket className="w-10 h-10" />
              <div>
                <h2 className="text-2xl font-bold">まずはSCMを受けてみましょう！</h2>
                <p className="text-white/80">あなたの強みと改善ポイントを発見できます</p>
              </div>
            </div>
            <p className="text-white/90 text-lg leading-relaxed mb-6">
              SCMを受けることで、起業参謀としての現在地がわかります。
              結果に基づいて、最適な学習プランを提案します。
            </p>
            <Link
              href="/student/scm/assessment"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold text-lg hover:bg-indigo-50 transition"
            >
              <Sparkles className="w-5 h-5" />
              今すぐSCMを受験する
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        )}

        {/* SCMを受ける（結果がある場合） */}
        {hasResults && (
          <Card className="mb-6 border-2 border-indigo-100">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">SCMを受験する</h3>
                  <p className="text-sm text-gray-500">所要時間: 約25-35分 / 問題数: 73問</p>
                </div>
                <Link
                  href="/student/scm/assessment"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
                >
                  🚀 受験する
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <p className="text-sm text-gray-500 mt-4 pt-4 border-t">
                前回の受験: {formatDate(latestResult!.takenAt)}（{results.length}回目）
              </p>
            </div>
          </Card>
        )}

        {/* SCMの結果 */}
        {latestResult && (
          <>
            {/* 総合スコア（大きく） */}
            <Card className="mb-6 p-8">
              <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2 text-xl">
                <Target className="w-6 h-6 text-indigo-600" />
                総合スコア
                <span className="text-base font-normal text-gray-500">（{results.length}回目）</span>
              </h3>
              <div className="flex items-center justify-center gap-8">
                <div className="relative">
                  <svg width="160" height="160" className="transform -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r="65"
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="14"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="65"
                      fill="none"
                      stroke={getScoreColor(latestResult.totalPercentage)}
                      strokeWidth="14"
                      strokeDasharray={2 * Math.PI * 65}
                      strokeDashoffset={2 * Math.PI * 65 * (1 - latestResult.totalPercentage / 100)}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-gray-900">{latestResult.totalPercentage}</span>
                    <span className="text-lg text-gray-500">点</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreLabel(latestResult.totalPercentage).color}`}>
                      {getScoreLabel(latestResult.totalPercentage).text}
                    </span>
                  </div>
                  {scoreDiff !== 0 && (
                    <div className={`flex items-center gap-1 text-base ${scoreDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      <TrendingUp className={`w-5 h-5 ${scoreDiff < 0 ? 'rotate-180' : ''}`} />
                      前回比 {scoreDiff > 0 ? '+' : ''}{scoreDiff}点
                    </div>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    {formatDate(latestResult.takenAt)} 時点
                  </p>
                </div>
              </div>
            </Card>

            {/* 改善ポイント */}
            <Card className="mb-6 p-6 bg-amber-50/50">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                <Info className="w-5 h-5 text-amber-600" />
                改善ポイント
              </h3>
              <div className="space-y-3">
                {latestResult.weaknesses.map((catId) => {
                  const cat = SCM_CATEGORIES[catId];
                  const score = latestResult.categoryScores.find(cs => cs.categoryId === catId);
                  return (
                    <div key={catId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{cat.emoji}</span>
                        <span className="text-gray-700 text-lg">{cat.name}</span>
                      </div>
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded text-base font-medium">
                        {score?.percentage ?? 0}点
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-base text-amber-700 mt-4">
                これらの分野を重点的に学習することをおすすめします。
              </p>
            </Card>
          </>
        )}

        {/* カテゴリ別スコア（バーチャート版） */}
        {latestResult && (
          <Card className="mb-6">
            <div className="p-6">
              <h3 className="font-bold text-gray-900 mb-6 text-xl">📈 カテゴリ別スコア</h3>
              <div className="space-y-4">
                {latestResult.categoryScores
                  .sort((a, b) => b.percentage - a.percentage)
                  .map((cs) => {
                    const cat = SCM_CATEGORIES[cs.categoryId];
                    const color = getScoreColor(cs.percentage);
                    return (
                      <div key={cs.categoryId} className="flex items-center gap-4">
                        <div className="flex items-center gap-2 w-32 flex-shrink-0">
                          <span className="text-xl">{cat.emoji}</span>
                          <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                        </div>
                        <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${cs.percentage}%`, backgroundColor: color }}
                          />
                        </div>
                        <span className="text-lg font-bold w-12 text-right" style={{ color }}>
                          {cs.percentage}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </Card>
        )}

        {/* スコア推移（パイチャート版） */}
        {results.length > 0 && (
          <Card className="mb-6">
            <div className="p-6">
              <h3 className="font-bold text-gray-900 mb-6 text-xl">📊 スコア推移</h3>
              <div className="flex items-center justify-center gap-6 flex-wrap">
                {results.map((result, index) => {
                  const prevResult = index > 0 ? results[index - 1] : null;
                  const diff = prevResult ? result.totalPercentage - prevResult.totalPercentage : 0;
                  
                  return (
                    <div key={result.id} className="flex flex-col items-center">
                      {/* 矢印（2回目以降） */}
                      {index > 0 && (
                        <div className={`text-sm font-bold mb-2 ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {diff >= 0 ? '↑' : '↓'} {Math.abs(diff)}点
                        </div>
                      )}
                      {index === 0 && <div className="h-6" />}
                      
                      {/* パイチャート */}
                      <div className={`relative ${index === results.length - 1 ? 'ring-4 ring-indigo-200 rounded-full' : ''}`}>
                        <PieChartLarge 
                          percent={result.totalPercentage} 
                          color={getScoreColor(result.totalPercentage)}
                          size={index === results.length - 1 ? 'lg' : 'md'}
                        />
                      </div>
                      
                      {/* ラベル */}
                      <div className="mt-3 text-center">
                        <div className={`font-bold ${index === results.length - 1 ? 'text-indigo-600' : 'text-gray-700'}`}>
                          {index + 1}回目
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatShortDate(result.takenAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {results.length === 1 && (
                <p className="text-center text-gray-500 text-base mt-4">
                  2回目以降の受験で、成長の推移が表示されます
                </p>
              )}
            </div>
          </Card>
        )}

        {/* おすすめ動画（結果がある場合のみ） */}
        {latestResult && (
          <Card>
            <div className="p-6">
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Play className="w-5 h-5 text-purple-600" />
                おすすめ動画
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                SCMの結果に基づいて、あなたにおすすめの動画です。
              </p>
              <div className="space-y-3">
                {latestResult.weaknesses.map((catId, idx) => {
                  const cat = SCM_CATEGORIES[catId];
                  return (
                    <div
                      key={catId}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition"
                    >
                      <div className="w-16 h-10 bg-slate-800 rounded flex items-center justify-center flex-shrink-0">
                        <Play className="w-4 h-4 text-white/70" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">
                          {cat.name}の基礎
                        </h4>
                        <p className="text-xs text-gray-500">
                          弱点カテゴリ #{idx + 1}
                        </p>
                      </div>
                      <div className="text-amber-500 text-sm">
                        {'★'.repeat(5 - idx)}{'☆'.repeat(idx)}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-4 text-center">
                ※ 動画レコメンドは今後のアップデートでより詳細になります
              </p>
            </div>
          </Card>
        )}
      </div>
    </StudentLayout>
  );
}
