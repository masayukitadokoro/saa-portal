'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Play, Clock, CheckCircle, Calendar, ExternalLink } from 'lucide-react';
import type {
  UpcomingEvent,
  VideoWithProgress,
  CategoryProgress,
  SCMResult,
  GraduationProgress,
  GRADUATION_PHASES,
} from '@/types/student-dashboard';

// =====================================================
// 基本カード
// =====================================================

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  const baseClass = 'bg-white rounded-xl shadow-sm border border-gray-100';
  const clickableClass = onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : '';
  return (
    <div className={`${baseClass} ${clickableClass} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function CardHeader({ title, icon, action }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-100">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      {action}
    </div>
  );
}

// =====================================================
// 進捗バー
// =====================================================

interface ProgressBarProps {
  progress: number;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ProgressBar({
  progress,
  color = '#3B82F6',
  size = 'md',
  showLabel = false,
}: ProgressBarProps) {
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };

  return (
    <div className="flex items-center gap-3">
      <div className={`flex-1 bg-gray-200 rounded-full ${heights[size]} overflow-hidden`}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, backgroundColor: color }}
        />
      </div>
      {showLabel && <span className="text-sm text-gray-600 min-w-[40px]">{progress}%</span>}
    </div>
  );
}

// =====================================================
// イベントカード
// =====================================================

interface EventCardProps {
  event: UpcomingEvent;
}

export function EventCard({ event }: EventCardProps) {
  const date = new Date(event.scheduled_at);
  const isRegular = event.event_type === 'regular';
  const dotColor = isRegular ? 'bg-red-500' : 'bg-orange-500';

  return (
    <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 rounded-full mt-2 ${dotColor}`} />
        <div className="flex-1">
          <div className="text-sm text-gray-500">
            {date.toLocaleDateString('ja-JP', {
              month: 'numeric',
              day: 'numeric',
              weekday: 'short',
            })}{' '}
            {date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="font-medium text-gray-900 mt-1">
            {isRegular ? '定例講義' : '専門家講義'}
          </div>
          <div className="text-sm text-gray-600">{event.title}</div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// 続きから再生カード
// =====================================================

interface ContinueWatchingCardProps {
  video: VideoWithProgress;
  onPlay?: () => void;
}

export function ContinueWatchingCard({ video, onPlay }: ContinueWatchingCardProps) {
  const remainingSeconds = video.duration
    ? video.duration - video.last_position_seconds
    : 0;
  const remainingMinutes = Math.floor(remainingSeconds / 60);
  const remainingSecs = remainingSeconds % 60;

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Play className="w-5 h-5 text-indigo-600" />
          続きから再生
        </h3>
        <div className="flex gap-4">
          <div
            className="w-32 h-20 bg-slate-800 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors"
            onClick={onPlay}
          >
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Play className="w-5 h-5 text-white ml-1" />
            </div>
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{video.title}</h4>
            <p className="text-sm text-gray-500 mt-1">
              残り {remainingMinutes}:{remainingSecs.toString().padStart(2, '0')}
            </p>
            <div className="mt-2">
              <ProgressBar progress={video.progress_percent} size="sm" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// =====================================================
// カテゴリ進捗カード
// =====================================================

interface CategoryProgressCardProps {
  category: CategoryProgress;
  href: string;
}

export function CategoryProgressCard({ category, href }: CategoryProgressCardProps) {
  return (
    <Link href={href}>
      <Card className="p-4 hover:shadow-md transition-all hover:-translate-y-0.5">
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: category.color }}
          />
          <span className="font-medium text-gray-900">{category.categoryName}</span>
        </div>
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-2xl font-bold" style={{ color: category.color }}>
            {category.progressPercent}%
          </span>
          <span className="text-sm text-gray-500">
            {category.completedVideos}/{category.totalVideos}本
          </span>
        </div>
        <ProgressBar progress={category.progressPercent} color={category.color} size="sm" />
      </Card>
    </Link>
  );
}

// =====================================================
// 動画サムネイルカード
// =====================================================

interface VideoThumbnailCardProps {
  video: VideoWithProgress;
  onClick?: () => void;
}

export function VideoThumbnailCard({ video, onClick }: VideoThumbnailCardProps) {
  return (
    <div
      className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="relative aspect-video bg-slate-800 flex items-center justify-center">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <Play className="w-8 h-8 text-white/50" />
        )}
        {video.is_completed && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            視聴済
          </div>
        )}
        {!video.is_completed && video.progress_percent > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
            <div
              className="h-full bg-indigo-500"
              style={{ width: `${video.progress_percent}%` }}
            />
          </div>
        )}
      </div>
      <div className="p-3">
        <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{video.title}</h4>
        {video.duration && (
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            {Math.floor(video.duration / 60)}:{(video.duration % 60)
              .toString()
              .padStart(2, '0')}
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// SCMスコアカード
// =====================================================

interface SCMScoreCardProps {
  result: SCMResult | null;
  previousScore?: number;
}

export function SCMScoreCard({ result, previousScore }: SCMScoreCardProps) {
  if (!result) {
    return (
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-3">📊 SCMスコア</h3>
        <p className="text-gray-500 text-sm">まだSCMを受験していません</p>
        <Link
          href="/student/scm"
          className="mt-3 inline-block text-sm text-indigo-600 hover:underline"
        >
          SCMを受験する →
        </Link>
      </Card>
    );
  }

  const scoreDiff = previousScore ? result.total_score - previousScore : 0;

  return (
    <Card className="p-4">
      <h3 className="font-semibold text-gray-900 mb-3">📊 SCMスコア</h3>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-indigo-600">{result.total_score}</span>
        <span className="text-gray-500">/ 100</span>
        {scoreDiff > 0 && (
          <span className="text-sm text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            +{scoreDiff} ↑
          </span>
        )}
      </div>
      <Link
        href="/student/scm"
        className="mt-3 inline-block text-sm text-indigo-600 hover:underline"
      >
        詳細を見る →
      </Link>
    </Card>
  );
}

// =====================================================
// 卒業制作進捗カード
// =====================================================

interface GraduationProgressCardProps {
  progress: GraduationProgress | null;
}

const PHASES = [
  { phase: 1, name: '目次作成' },
  { phase: 2, name: 'コンテンツ作成' },
  { phase: 3, name: 'レビュー' },
  { phase: 4, name: '修正' },
  { phase: 5, name: '最終提出' },
];

export function GraduationProgressCard({ progress }: GraduationProgressCardProps) {
  const currentPhase = progress?.current_phase || 1;
  const progressPercent = ((currentPhase - 1) / 5) * 100;

  return (
    <Card className="p-4">
      <h3 className="font-semibold text-gray-900 mb-3">🎓 卒業制作</h3>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">
          Phase {currentPhase} / 5
        </span>
        <span className="text-sm text-gray-500">{Math.round(progressPercent)}%</span>
      </div>
      <ProgressBar progress={progressPercent} color="#F59E0B" size="md" />
      <p className="text-sm text-gray-600 mt-2">
        現在: {PHASES[currentPhase - 1]?.name}
      </p>
      <Link
        href="/student/graduation"
        className="mt-3 inline-block text-sm text-indigo-600 hover:underline"
      >
        詳細を見る →
      </Link>
    </Card>
  );
}

// =====================================================
// ガイドカード
// =====================================================

interface GuideCardProps {
  title: string;
  description?: string;
  notionUrl: string;
}

export function GuideCard({ title, description, notionUrl }: GuideCardProps) {
  return (
    <a
      href={notionUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium text-gray-900">{title}</h4>
          {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        </div>
        <ExternalLink className="w-4 h-4 text-gray-400" />
      </div>
      <span className="text-sm text-indigo-600 mt-2 inline-block">Notionで見る →</span>
    </a>
  );
}
