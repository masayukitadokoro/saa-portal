/**
 * SCM ウィザード型アセスメント（改善版）
 * 
 * 改善点:
 * - フォントサイズ拡大
 * - 折り返しポップアップ
 * - localStorage保存機能
 * - タイトル変更
 */

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { ArrowLeft, BarChart3, Target, Clock, HelpCircle, X, Save, Play, Check } from 'lucide-react';
import Link from 'next/link';
import { StudentLayout } from '@/components/student/StudentLayout';
import {
  SCMProgressBar,
  SCMQuestionCard,
  SCMNavigation,
  SCMScoreCard,
  SCMCategoryScoreBar,
  SCMStrengthWeaknessCard,
  SCMCategoryBadge,
} from '@/components/scm/SCMComponents';
import {
  SCM_QUESTIONS,
  SCM_CATEGORIES,
  SCM_CATEGORY_IDS,
  calculateTotalResult,
  getScoreColor,
} from '@/types/scm';
import type { SCMAnswer, SCMCategoryId, SCMResult } from '@/types/scm';

// ========================================
// localStorage キー
// ========================================

const STORAGE_KEYS = {
  ANSWERS: 'scm_answers',
  CURRENT_INDEX: 'scm_current_index',
  RESULTS: 'scm_results_history',
};

// ========================================
// ステート管理
// ========================================

type SCMPageState = 'intro' | 'quiz' | 'result';

// ========================================
// 折り返しポップアップ
// ========================================

interface HalfwayModalProps {
  isOpen: boolean;
  onContinue: () => void;
  onSaveAndExit: () => void;
  answeredCount: number;
}

function HalfwayModal({ isOpen, onContinue, onSaveAndExit, answeredCount }: HalfwayModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center animate-in fade-in zoom-in duration-300">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          おめでとうございます！
        </h2>
        <p className="text-lg text-gray-600 mb-6">
          ちょうど<span className="font-bold text-indigo-600">折り返し地点</span>です！<br />
          残り半分、この調子で頑張りましょう！
        </p>
        
        <div className="bg-indigo-50 rounded-xl p-4 mb-6">
          <div className="text-sm text-indigo-600 mb-1">ここまでの回答</div>
          <div className="text-2xl font-bold text-indigo-700">{answeredCount}問 完了</div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onSaveAndExit}
            className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            保存して休憩
          </button>
          <button
            onClick={onContinue}
            className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition flex items-center justify-center gap-2"
          >
            続ける 💪
          </button>
        </div>
      </div>
    </div>
  );
}

// ========================================
// 途中保存モーダル
// ========================================

interface SaveProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  answeredCount: number;
}

function SaveProgressModal({ isOpen, onClose, onSave, answeredCount }: SaveProgressModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
        <div className="text-5xl mb-4">💾</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          進捗を保存しますか？
        </h2>
        <p className="text-gray-600 mb-6">
          {answeredCount}問の回答を保存します。<br />
          次回、続きから再開できます。
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
          >
            キャンセル
          </button>
          <button
            onClick={onSave}
            className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition"
          >
            保存して終了
          </button>
        </div>
      </div>
    </div>
  );
}

// ========================================
// 診断完了確認ダイアログ
// ========================================

interface ConfirmSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function ConfirmSubmitModal({ isOpen, onClose, onConfirm }: ConfirmSubmitModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          診断を完了しますか？
        </h2>
        <p className="text-gray-600 mb-6">
          全73問の回答を送信し、<br />
          診断結果を表示します。
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
          >
            いいえ
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 px-4 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition"
          >
            はい、完了する
          </button>
        </div>
      </div>
    </div>
  );
}

// ========================================
// イントロ画面
// ========================================

interface SCMIntroProps {
  onStart: () => void;
  onResume: () => void;
  previousResult?: SCMResult | null;
  hasSavedProgress: boolean;
  savedAnswerCount: number;
}

function SCMIntro({ onStart, onResume, previousResult, hasSavedProgress, savedAnswerCount }: SCMIntroProps) {
  return (
    <div className="max-w-2xl mx-auto">
      {/* 途中から再開 */}
      {hasSavedProgress && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <Play className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-amber-800">前回の続きがあります</h3>
              <p className="text-sm text-amber-600">{savedAnswerCount}問まで回答済み</p>
            </div>
          </div>
          <button
            onClick={onResume}
            className="w-full py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition"
          >
            続きから再開する
          </button>
        </div>
      )}

      {/* 概要カード */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-4 text-xl">📋 アセスメント概要</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <HelpCircle className="w-7 h-7 text-indigo-500" />
            <div>
              <div className="text-sm text-gray-500">問題数</div>
              <div className="font-bold text-gray-900 text-xl">全73問</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <Clock className="w-7 h-7 text-indigo-500" />
            <div>
              <div className="text-sm text-gray-500">所要時間</div>
              <div className="font-bold text-gray-900 text-xl">約25-35分</div>
            </div>
          </div>
        </div>

        {/* 途中保存メッセージ */}
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5 mb-6">
          <p className="text-green-800 text-lg font-medium">
            💡 <span className="font-bold">いつでも中断OK！</span>
          </p>
          <p className="text-green-700 text-base mt-1">
            途中で保存して、好きなタイミングで続きから再開できます。
          </p>
        </div>

        <h3 className="font-bold text-gray-900 mb-4 text-xl">🎯 測定カテゴリ</h3>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {SCM_CATEGORY_IDS.map(catId => {
            const cat = SCM_CATEGORIES[catId];
            return (
              <div key={catId} className="flex items-center gap-3 p-4 rounded-xl bg-gray-50">
                <span className="text-3xl">{cat.emoji}</span>
                <div className="flex-1">
                  <span className="text-lg font-medium text-gray-700">{cat.name}</span>
                </div>
                <span className="text-lg font-bold text-indigo-600">{cat.questions.length}問</span>
              </div>
            );
          })}
        </div>

        {previousResult && (
          <div className="p-4 bg-indigo-50 rounded-xl mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-indigo-600 font-medium">前回のスコア</div>
                <div className="text-2xl font-bold text-indigo-700">{previousResult.totalPercentage}点</div>
              </div>
              <div className="text-sm text-indigo-600">
                {new Date(previousResult.takenAt).toLocaleDateString('ja-JP')}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onStart}
          className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2"
        >
          🚀 {hasSavedProgress ? '最初から始める' : 'アセスメントを開始する'}
        </button>
      </div>
    </div>
  );
}

// ========================================
// クイズ画面
// ========================================

interface SCMQuizProps {
  currentIndex: number;
  answers: Map<number, number>;
  onAnswer: (questionId: number, score: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onSaveProgress: () => void;
}

function SCMQuiz({ 
  currentIndex, 
  answers, 
  onAnswer, 
  onPrev, 
  onNext, 
  onSubmit,
  onSaveProgress 
}: SCMQuizProps) {
  const question = SCM_QUESTIONS[currentIndex];
  const selectedScore = answers.get(question.id) ?? null;
  const isLastQuestion = currentIndex === SCM_QUESTIONS.length - 1;
  const answeredCount = answers.size;

  // 現在のカテゴリの進捗
  const category = SCM_CATEGORIES[question.categoryId];
  const categoryQuestions = category.questions;
  const categoryIndex = categoryQuestions.indexOf(question.id);

  return (
    <div className="max-w-2xl mx-auto">
      {/* 全体進捗 */}
      <div className="mb-6">
        <SCMProgressBar
          current={answeredCount}
          total={SCM_QUESTIONS.length}
        />
      </div>

      {/* カテゴリ進捗 */}
      <div className="flex items-center justify-between mb-4 px-1">
        <SCMCategoryBadge categoryId={question.categoryId} size="lg" />
        <span className="text-lg font-medium text-gray-500">
          セクション {categoryIndex + 1} / {categoryQuestions.length}
        </span>
      </div>

      {/* 質問カード（カテゴリバッジなし版） */}
      <div className="mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-end mb-3">
              <span className="text-lg font-medium text-gray-500">
                Q{currentIndex + 1} / {SCM_QUESTIONS.length}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 leading-relaxed">
              {question.title}
            </h2>
          </div>
          
          <div className="p-5 space-y-3">
            {question.options.map((option, index) => {
              const score = index + 1;
              const isSelected = selectedScore === score;
              
              return (
                <button
                  key={score}
                  onClick={() => onAnswer(question.id, score)}
                  className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 shadow-md'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-base font-bold ${
                        isSelected
                          ? 'bg-indigo-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {isSelected ? <Check className="w-5 h-5" /> : score}
                    </div>
                    <span className={`text-base leading-relaxed pt-1.5 ${isSelected ? 'text-indigo-900 font-medium' : 'text-gray-700'}`}>
                      {option}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ナビゲーション */}
      <div className="flex justify-between items-center gap-3 mb-4">
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className={`px-6 py-3 rounded-xl font-medium transition text-base ${
            currentIndex > 0
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-gray-50 text-gray-300 cursor-not-allowed'
          }`}
        >
          ← 戻る
        </button>

        {/* 保存ボタン（中央） */}
        <button
          onClick={onSaveProgress}
          className="px-5 py-3 bg-amber-100 text-amber-700 rounded-xl font-medium hover:bg-amber-200 transition flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          保存して中断
        </button>
        
        <button
          onClick={isLastQuestion ? onSubmit : onNext}
          disabled={!selectedScore}
          className={`px-6 py-3 rounded-xl font-medium transition text-base ${
            selectedScore
              ? isLastQuestion
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isLastQuestion ? '診断を完了する 🎉' : '次へ →'}
        </button>
      </div>
    </div>
  );
}

// ========================================
// 結果画面
// ========================================

interface SCMResultViewProps {
  result: Omit<SCMResult, 'id' | 'takenAt'>;
  attemptNumber: number;
  onRetry: () => void;
}

function SCMResultView({ result, attemptNumber, onRetry }: SCMResultViewProps) {
  // カテゴリ別スコアをマップに変換
  const categoryScoreMap = useMemo(() => {
    const map: Record<SCMCategoryId, number> = {} as Record<SCMCategoryId, number>;
    result.categoryScores.forEach(cs => {
      map[cs.categoryId] = cs.percentage;
    });
    return map;
  }, [result.categoryScores]);

  const takenDate = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-3xl mx-auto">
      {/* 完了ヘッダー */}
      <div className="text-center mb-8">
        <div className="text-7xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">診断完了！</h1>
        <p className="text-xl text-indigo-600 font-bold">{attemptNumber}回目</p>
        <p className="text-lg text-gray-500 mt-1">受験日 {takenDate}</p>
      </div>

      {/* 総合スコア（大きく） */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">📊 総合スコア</h3>
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <svg width="180" height="180" className="transform -rotate-90">
              <circle
                cx="90"
                cy="90"
                r="75"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="15"
              />
              <circle
                cx="90"
                cy="90"
                r="75"
                fill="none"
                stroke={result.totalPercentage >= 60 ? '#6366F1' : result.totalPercentage >= 40 ? '#F59E0B' : '#EF4444'}
                strokeWidth="15"
                strokeDasharray={2 * Math.PI * 75}
                strokeDashoffset={2 * Math.PI * 75 * (1 - result.totalPercentage / 100)}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold text-gray-900">{result.totalPercentage}</span>
              <span className="text-xl text-gray-500">点</span>
            </div>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-base font-medium ${
            result.totalPercentage >= 80 ? 'bg-green-50 text-green-600' :
            result.totalPercentage >= 60 ? 'bg-indigo-50 text-indigo-600' :
            result.totalPercentage >= 40 ? 'bg-amber-50 text-amber-600' :
            'bg-red-50 text-red-600'
          }`}>
            {result.totalPercentage >= 80 ? '優秀' :
             result.totalPercentage >= 60 ? '良好' :
             result.totalPercentage >= 40 ? '成長中' : '要改善'}
          </span>
        </div>
      </div>

      {/* 強み・弱み */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <SCMStrengthWeaknessCard
          type="strength"
          categories={result.strengths}
          scores={categoryScoreMap}
        />
        <SCMStrengthWeaknessCard
          type="weakness"
          categories={result.weaknesses}
          scores={categoryScoreMap}
        />
      </div>

      {/* カテゴリ別スコア（バーチャート版） */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-6 text-xl">📈 カテゴリ別スコア</h2>
        <div className="space-y-4">
          {result.categoryScores
            .sort((a, b) => b.percentage - a.percentage)
            .map(cs => {
              const cat = SCM_CATEGORIES[cs.categoryId];
              const color = cs.percentage >= 80 ? '#10B981' : cs.percentage >= 60 ? '#6366F1' : cs.percentage >= 40 ? '#F59E0B' : '#EF4444';
              return (
                <div key={cs.categoryId} className="flex items-center gap-4">
                  <div className="flex items-center gap-2 w-32 flex-shrink-0">
                    <span className="text-xl">{cat.emoji}</span>
                    <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                  </div>
                  <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
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

      {/* AI分析 */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-indigo-100 p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-xl">
          <span className="text-2xl">🤖</span>
          AIからのアドバイス
        </h2>
        <div className="text-gray-700 leading-relaxed text-lg">
          <p className="mb-3">
            あなたは<strong className="text-indigo-600">「{SCM_CATEGORIES[result.strengths[0]].name}」</strong>と
            <strong className="text-indigo-600">「{SCM_CATEGORIES[result.strengths[1]].name}」</strong>に強みがあります。
          </p>
          <p className="mb-3">
            一方で、<strong className="text-amber-600">「{SCM_CATEGORIES[result.weaknesses[0]].name}」</strong>と
            <strong className="text-amber-600">「{SCM_CATEGORIES[result.weaknesses[1]].name}」</strong>が改善ポイントです。
          </p>
        </div>
      </div>

      {/* アクション */}
      <div className="flex">
        <Link
          href="/student/scm"
          className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-bold text-center hover:bg-indigo-700 transition text-xl"
        >
          SCMトップへ →
        </Link>
      </div>
    </div>
  );
}

// ========================================
// メインページ
// ========================================

export default function SCMAssessmentPage() {
  const [pageState, setPageState] = useState<SCMPageState>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, number>>(new Map());
  const [result, setResult] = useState<Omit<SCMResult, 'id' | 'takenAt'> | null>(null);
  const [showHalfwayModal, setShowHalfwayModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showConfirmSubmitModal, setShowConfirmSubmitModal] = useState(false);
  const [halfwayShown, setHalfwayShown] = useState(false);
  const [attemptNumber, setAttemptNumber] = useState(1);

  // localStorage から保存データを読み込み
  const [savedAnswers, setSavedAnswers] = useState<Map<number, number>>(new Map());
  const [savedIndex, setSavedIndex] = useState(0);

  useEffect(() => {
    // 保存された回答を読み込み
    const savedAnswersStr = localStorage.getItem(STORAGE_KEYS.ANSWERS);
    const savedIndexStr = localStorage.getItem(STORAGE_KEYS.CURRENT_INDEX);
    
    if (savedAnswersStr) {
      const parsed = JSON.parse(savedAnswersStr);
      setSavedAnswers(new Map(parsed));
    }
    if (savedIndexStr) {
      setSavedIndex(parseInt(savedIndexStr, 10));
    }

    // 受験回数を取得
    const resultsStr = localStorage.getItem(STORAGE_KEYS.RESULTS);
    if (resultsStr) {
      const results = JSON.parse(resultsStr);
      setAttemptNumber(results.length + 1);
    }
  }, []);

  // 前回の結果を取得
  const previousResult = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const resultsStr = localStorage.getItem(STORAGE_KEYS.RESULTS);
    if (!resultsStr) return null;
    const results = JSON.parse(resultsStr);
    return results.length > 0 ? results[results.length - 1] : null;
  }, []);

  const hasSavedProgress = savedAnswers.size > 0;

  const handleStart = useCallback(() => {
    // 新規開始時は保存データをクリア
    localStorage.removeItem(STORAGE_KEYS.ANSWERS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_INDEX);
    setPageState('quiz');
    setCurrentIndex(0);
    setAnswers(new Map());
    setHalfwayShown(false);
  }, []);

  const handleResume = useCallback(() => {
    // 保存データから再開
    setAnswers(savedAnswers);
    setCurrentIndex(savedIndex);
    setPageState('quiz');
    setHalfwayShown(savedAnswers.size >= 37);
  }, [savedAnswers, savedIndex]);

  const handleAnswer = useCallback((questionId: number, score: number) => {
    setAnswers(prev => {
      const next = new Map(prev);
      next.set(questionId, score);
      return next;
    });
  }, []);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    // 折り返しチェック
    if (!halfwayShown && answers.size === 37) {
      setShowHalfwayModal(true);
      setHalfwayShown(true);
      return;
    }

    if (currentIndex < SCM_QUESTIONS.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, answers.size, halfwayShown]);

  const handleContinueFromHalfway = useCallback(() => {
    setShowHalfwayModal(false);
    if (currentIndex < SCM_QUESTIONS.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex]);

  const handleSaveAndExit = useCallback(() => {
    // localStorageに保存
    localStorage.setItem(STORAGE_KEYS.ANSWERS, JSON.stringify(Array.from(answers.entries())));
    localStorage.setItem(STORAGE_KEYS.CURRENT_INDEX, currentIndex.toString());
    setShowHalfwayModal(false);
    setShowSaveModal(false);
    setPageState('intro');
    // 保存データを更新
    setSavedAnswers(answers);
    setSavedIndex(currentIndex);
  }, [answers, currentIndex]);

  const handleSaveProgress = useCallback(() => {
    setShowSaveModal(true);
  }, []);

  const handleRequestSubmit = useCallback(() => {
    setShowConfirmSubmitModal(true);
  }, []);

  const handleConfirmSubmit = useCallback(() => {
    setShowConfirmSubmitModal(false);
    
    // 回答をSCMAnswer形式に変換
    const answerArray: SCMAnswer[] = Array.from(answers.entries()).map(([questionId, score]) => ({
      questionId,
      score,
    }));

    // スコア計算
    const calculatedResult = calculateTotalResult(answerArray, 'temp-user-id');
    setResult(calculatedResult);

    // 結果をlocalStorageに保存
    const resultsStr = localStorage.getItem(STORAGE_KEYS.RESULTS);
    const results = resultsStr ? JSON.parse(resultsStr) : [];
    const newResult = {
      ...calculatedResult,
      id: `result-${Date.now()}`,
      takenAt: new Date().toISOString(),
    };
    results.push(newResult);
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(results));

    // 途中保存データをクリア
    localStorage.removeItem(STORAGE_KEYS.ANSWERS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_INDEX);

    setPageState('result');
  }, [answers]);

  const handleRetry = useCallback(() => {
    setPageState('intro');
    setCurrentIndex(0);
    setAnswers(new Map());
    setResult(null);
    setHalfwayShown(false);
    
    // 受験回数を更新
    const resultsStr = localStorage.getItem(STORAGE_KEYS.RESULTS);
    if (resultsStr) {
      const results = JSON.parse(resultsStr);
      setAttemptNumber(results.length + 1);
    }
  }, []);

  return (
    <StudentLayout pageTitle="SCM アセスメント">
      <div className="py-4">
        {pageState === 'intro' && (
          <SCMIntro 
            onStart={handleStart} 
            onResume={handleResume}
            previousResult={previousResult}
            hasSavedProgress={hasSavedProgress}
            savedAnswerCount={savedAnswers.size}
          />
        )}
        {pageState === 'quiz' && (
          <SCMQuiz
            currentIndex={currentIndex}
            answers={answers}
            onAnswer={handleAnswer}
            onPrev={handlePrev}
            onNext={handleNext}
            onSubmit={handleRequestSubmit}
            onSaveProgress={handleSaveProgress}
          />
        )}
        {pageState === 'result' && result && (
          <SCMResultView 
            result={result} 
            attemptNumber={attemptNumber}
            onRetry={handleRetry} 
          />
        )}

        {/* モーダル */}
        <HalfwayModal
          isOpen={showHalfwayModal}
          onContinue={handleContinueFromHalfway}
          onSaveAndExit={handleSaveAndExit}
          answeredCount={answers.size}
        />
        <SaveProgressModal
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          onSave={handleSaveAndExit}
          answeredCount={answers.size}
        />
        <ConfirmSubmitModal
          isOpen={showConfirmSubmitModal}
          onClose={() => setShowConfirmSubmitModal(false)}
          onConfirm={handleConfirmSubmit}
        />
      </div>
    </StudentLayout>
  );
}
