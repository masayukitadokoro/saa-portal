/**
 * SCM 共通コンポーネント
 * 
 * 原則3: 表示ロジックはコンポーネント化する
 * ビジネスルール変更時の修正箇所を1つに
 */

'use client';

import { Check } from 'lucide-react';
import { SCM_CATEGORIES, getScoreColor, getScoreLabel } from '@/types/scm';
import type { SCMCategoryId, SCMQuestion } from '@/types/scm';

// ========================================
// プログレスバー
// ========================================

interface SCMProgressBarProps {
  current: number;
  total: number;
  categoryId?: SCMCategoryId;
}

export function SCMProgressBar({ current, total, categoryId }: SCMProgressBarProps) {
  const percentage = Math.round((current / total) * 100);
  const category = categoryId ? SCM_CATEGORIES[categoryId] : null;
  
  return (
    <div className="w-full">
      <div className="flex justify-between text-base font-medium text-gray-600 mb-2">
        <span>{current} / {total} 問完了</span>
        <span className="text-indigo-600 font-bold">{percentage}%</span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-300 ease-out rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: category?.color ?? '#6366F1',
          }}
        />
      </div>
    </div>
  );
}

// ========================================
// カテゴリバッジ
// ========================================

interface SCMCategoryBadgeProps {
  categoryId: SCMCategoryId;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

export function SCMCategoryBadge({ categoryId, size = 'md', showName = true }: SCMCategoryBadgeProps) {
  const category = SCM_CATEGORIES[categoryId];
  
  const sizeClasses = {
    sm: 'text-sm px-3 py-1',
    md: 'text-base px-4 py-1.5',
    lg: 'text-lg px-5 py-2',
  };
  
  const emojiSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  };
  
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full font-bold ${sizeClasses[size]}`}
      style={{ backgroundColor: `${category.color}20`, color: category.color }}
    >
      <span className={emojiSizes[size]}>{category.emoji}</span>
      {showName && <span>{category.name}</span>}
    </span>
  );
}

// ========================================
// 質問カード
// ========================================

interface SCMQuestionCardProps {
  question: SCMQuestion;
  selectedScore: number | null;
  onSelect: (score: number) => void;
  questionNumber: number;
  totalQuestions: number;
}

export function SCMQuestionCard({
  question,
  selectedScore,
  onSelect,
  questionNumber,
  totalQuestions,
}: SCMQuestionCardProps) {
  const category = SCM_CATEGORIES[question.categoryId];
  const maxScore = question.id >= 64 ? 5 : 7;
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* ヘッダー */}
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <SCMCategoryBadge categoryId={question.categoryId} size="md" />
          <span className="text-base font-medium text-gray-500">
            Q{questionNumber} / {totalQuestions}
          </span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 leading-relaxed">
          {question.title}
        </h2>
      </div>
      
      {/* 選択肢 */}
      <div className="p-5 space-y-3">
        {question.options.map((option, index) => {
          const score = index + 1;
          const isSelected = selectedScore === score;
          
          return (
            <button
              key={score}
              onClick={() => onSelect(score)}
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
  );
}

// ========================================
// スコアカード
// ========================================

interface SCMScoreCardProps {
  percentage: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function SCMScoreCard({ percentage, label, size = 'md', showLabel = true }: SCMScoreCardProps) {
  const color = getScoreColor(percentage);
  const scoreLabel = getScoreLabel(percentage);
  
  const sizeConfig = {
    sm: { circle: 60, stroke: 6, text: 'text-lg' },
    md: { circle: 100, stroke: 8, text: 'text-3xl' },
    lg: { circle: 140, stroke: 10, text: 'text-5xl' },
  };
  
  const config = sizeConfig[size];
  const radius = (config.circle - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: config.circle, height: config.circle }}>
        {/* 背景円 */}
        <svg className="transform -rotate-90" width={config.circle} height={config.circle}>
          <circle
            cx={config.circle / 2}
            cy={config.circle / 2}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={config.stroke}
          />
          <circle
            cx={config.circle / 2}
            cy={config.circle / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={config.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        {/* スコア表示 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${config.text} font-bold`} style={{ color }}>
            {percentage}
          </span>
        </div>
      </div>
      {showLabel && (
        <span className={`mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${scoreLabel.color}`}>
          {label || scoreLabel.text}
        </span>
      )}
    </div>
  );
}

// ========================================
// カテゴリスコアバー
// ========================================

interface SCMCategoryScoreBarProps {
  categoryId: SCMCategoryId;
  percentage: number;
  showPercentage?: boolean;
}

export function SCMCategoryScoreBar({ categoryId, percentage, showPercentage = true }: SCMCategoryScoreBarProps) {
  const category = SCM_CATEGORIES[categoryId];
  const color = getScoreColor(percentage);
  
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span>{category.emoji}</span>
          <span className="text-sm font-medium text-gray-700">{category.name}</span>
        </div>
        {showPercentage && (
          <span className="text-sm font-bold" style={{ color }}>
            {percentage}%
          </span>
        )}
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ========================================
// 強み・弱みカード
// ========================================

interface SCMStrengthWeaknessCardProps {
  type: 'strength' | 'weakness';
  categories: SCMCategoryId[];
  scores: Record<SCMCategoryId, number>;
}

export function SCMStrengthWeaknessCard({ type, categories, scores }: SCMStrengthWeaknessCardProps) {
  const isStrength = type === 'strength';
  
  return (
    <div className={`p-4 rounded-xl ${isStrength ? 'bg-green-50' : 'bg-amber-50'}`}>
      <h3 className={`font-bold mb-3 flex items-center gap-2 ${isStrength ? 'text-green-800' : 'text-amber-800'}`}>
        {isStrength ? '💪 強み' : '📚 改善ポイント'}
      </h3>
      <div className="space-y-2">
        {categories.map((catId, index) => {
          const category = SCM_CATEGORIES[catId];
          const percentage = scores[catId] ?? 0;
          
          return (
            <div key={catId} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${isStrength ? 'text-green-600' : 'text-amber-600'}`}>
                  {index === 0 ? '🥇' : '🥈'}
                </span>
                <span>{category.emoji}</span>
                <span className="text-sm text-gray-700">{category.name}</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-sm font-medium ${
                isStrength ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {percentage}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ========================================
// ナビゲーションボタン
// ========================================

interface SCMNavigationProps {
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
  isLastQuestion: boolean;
  isAnswered: boolean;
}

export function SCMNavigation({
  onPrev,
  onNext,
  canPrev,
  canNext,
  isLastQuestion,
  isAnswered,
}: SCMNavigationProps) {
  return (
    <div className="flex justify-between items-center">
      <button
        onClick={onPrev}
        disabled={!canPrev}
        className={`px-6 py-3 rounded-xl font-medium transition ${
          canPrev
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            : 'bg-gray-50 text-gray-300 cursor-not-allowed'
        }`}
      >
        ← 戻る
      </button>
      
      <button
        onClick={onNext}
        disabled={!isAnswered}
        className={`px-6 py-3 rounded-xl font-medium transition ${
          isAnswered
            ? isLastQuestion
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        {isLastQuestion ? '診断を完了する 🎉' : '次へ →'}
      </button>
    </div>
  );
}
