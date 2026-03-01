'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { CHAPTERS, getChapterForStep, getBookDefinition } from '@/lib/chapterDefinitions';
import { getAboutDefinition } from '@/lib/aboutDefinitions';
import { formatVideoTitle, getDisplayOrder } from '@/lib/formatTitle';
import {
  Maximize2, Minimize2, ChevronDown, ChevronUp,
  Check, BookOpen, Paperclip, PenLine,
  Presentation, FileText, File, ListVideo, ArrowLeft, ArrowRight,
  Lightbulb, Search, Wrench, Target, Rocket, Map,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================
interface VideoExt {
  id: number;
  video_id: string;
  title: string;
  description?: string | null;
  summary?: string | null;
  thumbnail_url?: string | null;
  custom_thumbnail_url?: string | null;
  duration?: number | null;
  display_order?: number | null;
  view_count?: number;
  key_points?: string[] | null;
  slide_url?: string | null;
  video_url?: string | null;
  chapter?: string | null;
  step?: string | null;
  progress_percent: number;
  is_completed: boolean;
  last_position_seconds: number;
}

// ============================================================
// Helpers
// ============================================================
function extractYouTubeId(videoIdOrUrl?: string | null): string | null {
  if (!videoIdOrUrl) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(videoIdOrUrl)) return videoIdOrUrl;
  const match = videoIdOrUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return match ? match[1] : null;
}

function formatDuration(seconds?: number | null): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function cleanTitle(video: VideoExt): string {
  return formatVideoTitle(video.title, video.display_order) || video.title;
}

function videoOrder(video: VideoExt): number {
  return getDisplayOrder(video.title, video.display_order) ?? 0;
}

// ============================================================
// Points List
// ============================================================
function PointsList({ points, color }: { points: string[]; color: string }) {
  return (
    <div className="flex flex-col gap-2.5">
      {points.map((p, i) => (
        <div key={i} className="flex gap-3 items-start text-[15px] leading-relaxed">
          <span
            className="shrink-0 w-[24px] h-[24px] rounded-full flex items-center justify-center text-[12px] font-bold text-white mt-0.5"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
          >{i + 1}</span>
          <span className="text-gray-700">{p}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Portal Header
// ============================================================
function PortalHeader() {
  const { profile } = useAuth();
  return (
    <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 sticky top-0 z-50 shadow-lg">
      <div className="px-4">
        <div className="h-16 flex items-center justify-between gap-4">
          <Link href="/student" className="flex items-center gap-2 flex-shrink-0 no-underline">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:flex items-baseline gap-0.5">
              <span className="font-bold text-lg text-white">ダッシュ</span>
              <span className="font-medium text-lg text-white/90">ボードへ</span>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}

// ============================================================
// Tree Sidebar (Left) — 280px
// ============================================================
function TreeSidebar({
  chapters, videos, completedVideoIds, selectedStep, expandedCh, setExpandedCh,
  onStepClick, currentVideoIdx, onVideoClick, stepVideos, isAboutActive, onAboutClick, slug,
}: {
  chapters: typeof CHAPTERS; videos: VideoExt[]; completedVideoIds: string[];
  selectedStep: string; expandedCh: string; setExpandedCh: (id: string) => void;
  onStepClick: (stepId: string) => void; currentVideoIdx: number;
  onVideoClick: (idx: number) => void; stepVideos: VideoExt[];
  isAboutActive: boolean; onAboutClick: () => void; slug: string;
}) {
  const stepCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    chapters.forEach(ch => ch.steps.forEach(s => {
      counts[s.id] = videos.filter(v => v.step === s.id).length;
    }));
    return counts;
  }, [chapters, videos]);

  return (
    <div
      className="w-[280px] bg-white border-r border-gray-200 overflow-y-auto shrink-0 hidden lg:flex flex-col"
      style={{ height: 'calc(100vh - 64px)', position: 'sticky', top: 64 }}
    >
      {/* About */}
      <button
        onClick={onAboutClick}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all border-none cursor-pointer"
        style={{
          background: isAboutActive ? '#eef2ff' : 'transparent',
          borderLeft: isAboutActive ? '3px solid #6366f1' : '3px solid transparent',
          borderBottom: '1px solid #f3f4f6',
        }}
      >
        <span className="w-[30px] h-[30px] rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          <Map className="w-4 h-4 text-white" />
        </span>
        <div>
          <div className="text-[14px]" style={{ fontWeight: isAboutActive ? 700 : 600, color: isAboutActive ? '#4f46e5' : '#374151' }}>
            {getAboutDefinition(slug).sidebarLabel}
          </div>
          <div className="text-[11px] text-gray-400">{getAboutDefinition(slug).sidebarSub}</div>
        </div>
      </button>

      {chapters.map(ch => {
        const isExp = expandedCh === ch.id;
        return (
          <div key={ch.id}>
            <button
              onClick={() => setExpandedCh(isExp ? '' : ch.id)}
              className="w-full text-left flex items-center gap-2.5 py-3 px-4 border-none cursor-pointer transition-all"
              style={{
                background: isExp ? `${ch.color}06` : 'transparent',
                borderLeft: isExp ? `3px solid ${ch.color}` : '3px solid transparent',
              }}
            >
              <span className="w-[28px] h-[28px] rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0" style={{ background: ch.color }}>{ch.number}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold text-gray-700 truncate">{ch.subtitle}</div>
                <div className="text-[11px] text-gray-400">{ch.steps.reduce((a, s) => a + (stepCounts[s.id] || 0), 0)}本</div>
              </div>
              <span className="text-gray-400">{isExp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
            </button>

            {isExp && ch.steps.map(s => {
              const isSel = selectedStep === s.id && !isAboutActive;
              const cnt = stepCounts[s.id] || 0;
              return (
                <div key={s.id}>
                  <button
                    onClick={() => onStepClick(s.id)}
                    className="w-full text-left flex items-center gap-2 py-2.5 pr-4 border-none cursor-pointer transition-all"
                    style={{ paddingLeft: 48, background: isSel ? `${ch.color}10` : 'transparent' }}
                  >
                    <span className="text-[12px] font-bold px-2 py-0.5 rounded-md" style={{ color: ch.color, background: `${ch.color}15` }}>{s.id}</span>
                    <span className="text-[13px] flex-1 truncate" style={{ fontWeight: isSel ? 700 : 400, color: isSel ? ch.color : '#374151' }}>{s.label}</span>
                    <span className="text-[11px] text-gray-400">{cnt}本</span>
                  </button>

                  {isSel && stepVideos.map((vid, i) => {
                    const isActive = i === currentVideoIdx;
                    const isWatched = completedVideoIds.includes(vid.video_id);
                    return (
                      <button
                        key={vid.id}
                        onClick={() => onVideoClick(i)}
                        className="w-full text-left flex items-center gap-2 py-2 border-none cursor-pointer transition-all"
                        style={{ paddingLeft: 64, paddingRight: 16, background: isActive ? `${ch.color}08` : 'transparent' }}
                      >
                        <span
                          className="w-[20px] h-[20px] rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
                          style={{ background: isWatched ? '#10b981' : isActive ? ch.color : '#e5e7eb', color: isWatched || isActive ? '#fff' : '#9ca3af' }}
                        >{isWatched ? <Check className="w-3 h-3" /> : (videoOrder(vid) || i + 1)}</span>
                        <span className="text-[13px] truncate" style={{ color: isActive ? ch.color : '#6b7280', fontWeight: isActive ? 600 : 400 }}>
                          {cleanTitle(vid)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Resizable Playlist Sidebar (Right) — default 400px
// ============================================================
function PlaylistSidebar({
  stepVideos, currentVideoIdx, onVideoClick, completedVideoIds, color, stepId,
}: {
  stepVideos: VideoExt[]; currentVideoIdx: number; onVideoClick: (i: number) => void;
  completedVideoIds: string[]; color: string; stepId: string;
}) {
  const [width, setWidth] = useState(400);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(400);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = startX.current - ev.clientX;
      const newWidth = Math.min(560, Math.max(280, startWidth.current + delta));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const thumbW = Math.round(width * 0.38);
  const thumbH = Math.round(thumbW * 0.5625);
  const fontSize = width >= 400 ? 14 : width >= 340 ? 13 : 12;

  return (
    <div
      className="border-l border-gray-200 bg-white overflow-hidden shrink-0 hidden xl:flex relative"
      style={{ width, height: 'calc(100vh - 64px)', position: 'sticky', top: 64 }}
    >
      <div
        onMouseDown={handleMouseDown}
        className="absolute left-0 top-0 bottom-0 w-[8px] cursor-col-resize z-10 flex items-center justify-center group"
        title="ドラッグでサイズ変更"
      >
        <div className="w-[4px] h-12 rounded-full bg-gray-200 group-hover:bg-indigo-400 transition-colors" />
      </div>

      <div className="flex-1 overflow-y-auto pl-2">
        <div className="px-3 py-3 border-b border-gray-100">
          <div className="text-[14px] font-bold text-gray-700 flex items-center gap-1.5">
            <ListVideo className="w-4 h-4 text-gray-400" />
            {stepId} の動画
          </div>
          <div className="mt-2 flex gap-[3px]">
            {stepVideos.map((v, i) => (
              <div key={v.id} className="flex-1 h-[4px] rounded-sm transition-all" style={{
                background: completedVideoIds.includes(v.video_id) ? '#10b981' : i === currentVideoIdx ? color : '#e5e7eb',
              }} />
            ))}
          </div>
        </div>

        {stepVideos.map((vid, i) => {
          const isActive = i === currentVideoIdx;
          const isWatched = completedVideoIds.includes(vid.video_id);
          const thumb = vid.custom_thumbnail_url || vid.thumbnail_url;
          return (
            <button
              key={vid.id}
              onClick={() => onVideoClick(i)}
              className="w-full flex gap-3 py-3 px-3 border-none cursor-pointer text-left transition-all"
              style={{ background: isActive ? `${color}06` : 'transparent', borderLeft: isActive ? `3px solid ${color}` : '3px solid transparent' }}
            >
              <div className="relative rounded-lg overflow-hidden shrink-0 bg-gray-200" style={{ width: thumbW, height: thumbH }}>
                {thumb ? (
                  <Image src={thumb} alt="" fill className="object-cover" sizes={`${thumbW}px`} />
                ) : (
                  <div className="w-full h-full bg-slate-200" />
                )}
                {isWatched && (
                  <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </span>
                  </div>
                )}
                {vid.duration && (
                  <span className="absolute bottom-[2px] right-[3px] bg-black/75 text-white text-[10px] px-1.5 rounded-sm font-medium">
                    {formatDuration(vid.duration)}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="leading-snug line-clamp-2" style={{ fontSize, fontWeight: isActive ? 700 : 500, color: isActive ? color : '#374151' }}>
                  {cleanTitle(vid)}
                </div>
                {isWatched && <span className="text-[12px] text-emerald-500 font-semibold flex items-center gap-1 mt-1"><Check className="w-3 h-3" /> 視聴済み</span>}
                {!isWatched && vid.duration && <span className="text-[12px] text-gray-400 mt-1 block">{formatDuration(vid.duration)}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// About Page
// ============================================================
function AboutPage({ slug }: { slug: string }) {
  const about = getAboutDefinition(slug);
  const phases = about.phases;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="text-center px-6 pt-8 pb-4">
        <div className="inline-flex items-center gap-2 mb-2">
          <Map className="w-7 h-7 text-indigo-500" />
          <h1 className="text-[28px] font-extrabold text-gray-900 m-0">
            {about.heroTitle}
          </h1>
        </div>
        <p className="text-[15px] text-gray-500 max-w-[580px] mx-auto leading-relaxed">
          {about.heroDescription}<br />
          <span className="hidden lg:inline">左のメニュー</span><span className="lg:hidden">下のボタン</span>からチャプターを選んで学習を始めましょう。
        </p>
      </div>

      {about.heroImage && (
        <div className="max-w-[680px] mx-auto px-6 mb-6">
          <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            <img src={about.heroImage} alt={about.heroImageAlt || ''} className="w-full h-auto" />
          </div>
        </div>
      )}

      <div className="max-w-[680px] mx-auto px-6 pb-10 mt-4">
        <h2 className="text-[20px] font-bold text-gray-900 mb-5 text-center">{about.phasesTitle}</h2>
        {phases.map((p, i) => {
          const Icon = p.icon;
          return (
            <div key={p.num} className="flex gap-4">
              <div className="flex flex-col items-center w-10 shrink-0">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white z-[1]"
                  style={{ background: p.color }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                {i < phases.length - 1 && <div className="w-[2px] flex-1 bg-gray-200 min-h-[40px]" />}
              </div>
              <div className="pb-6 flex-1">
                <div className="text-[12px] font-bold" style={{ color: p.color }}>{p.title}</div>
                <div className="text-[17px] font-bold text-gray-900 mb-1">{p.sub}</div>
                <div
                  className="text-[14px] text-gray-600 leading-relaxed p-3.5 rounded-xl"
                  style={{ background: p.bg, borderLeft: `3px solid ${p.color}` }}
                >
                  {p.points.map((pt, j) => (
                    <div key={j} className={j > 0 ? 'mt-1' : ''}>
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white mr-1.5" style={{ background: p.color }}>{j + 1}</span>
                      {pt}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ============================================================
// Main Page
// ============================================================
export default function LearnPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.category as string;
  const { profile } = useAuth();

  const [videos, setVideos] = useState<VideoExt[]>([]);
  const [completedVideoIds, setCompletedVideoIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const stepParam = searchParams.get('step');
  const isAbout = !stepParam || stepParam === 'about';

  const [selectedStep, setSelectedStep] = useState(isAbout ? '1-1' : stepParam || '1-1');
  const [expandedCh, setExpandedCh] = useState('ch1');
  const [currentVideoIdx, setCurrentVideoIdx] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [mobileStepSheet, setMobileStepSheet] = useState(false);

  const bookDef = useMemo(() => getBookDefinition(slug), [slug]);
  const chapters = bookDef?.chapters || CHAPTERS;
  const info = useMemo(() => getChapterForStep(selectedStep, slug), [selectedStep, slug]);
  const color = info?.chapter.color || '#2563EB';

  const stepVideos = useMemo(() => {
    return videos
      .filter(v => v.step === selectedStep)
      .sort((a, b) => (videoOrder(a)) - (videoOrder(b)));
  }, [videos, selectedStep]);

  const current = stepVideos[currentVideoIdx] || null;
  const youtubeId = current ? (extractYouTubeId(current.video_url) || extractYouTubeId(current.video_id)) : null;

  useEffect(() => {
    async function loadAll() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/student/videos/${slug}/learn`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setVideos(data.videos || []);
        setCompletedVideoIds(data.completedVideoIds || []);
      } catch (err) {
        console.error('Load error:', err);
      }
      setIsLoading(false);
    }
    loadAll();
  }, [slug]);

  useEffect(() => {
    if (stepParam && stepParam !== 'about') {
      setSelectedStep(stepParam);
      const ch = chapters.find(c => c.steps.some(s => s.id === stepParam));
      if (ch) setExpandedCh(ch.id);
    }
  }, [stepParam]);

  const handleStepClick = (stepId: string) => {
    setSelectedStep(stepId);
    setCurrentVideoIdx(0);
    const ch = chapters.find(c => c.steps.some(s => s.id === stepId));
    if (ch) setExpandedCh(ch.id);
    window.history.replaceState(null, '', `?step=${stepId}`);
  };

  const handleAboutClick = () => {
    window.history.replaceState(null, '', `?step=about`);
    window.location.search = '?step=about';
  };

  const goNext = () => { if (currentVideoIdx < stepVideos.length - 1) setCurrentVideoIdx(currentVideoIdx + 1); };
  const goPrev = () => { if (currentVideoIdx > 0) setCurrentVideoIdx(currentVideoIdx - 1); };

  const videoPoints: string[] = current?.key_points || [];

  // Expanded fullscreen
  if (expanded && current && youtubeId) {
    return (
      <div className="fixed inset-0 z-[200] bg-black flex flex-col">
        <div className="px-4 py-2.5 flex justify-between items-center">
          <span className="text-white text-[15px] font-medium truncate mr-4">
            {videoOrder(current) || currentVideoIdx + 1}. {cleanTitle(current)}
          </span>
          <button onClick={() => setExpanded(false)} className="bg-white/15 border-none rounded-lg px-4 py-1.5 text-white text-[13px] cursor-pointer hover:bg-white/25 transition flex items-center gap-1.5">
            <Minimize2 className="w-4 h-4" /> 閉じる
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-[1200px] aspect-video rounded-lg overflow-hidden">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&autoplay=1`}
              className="w-full h-full border-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
        <div className="px-4 pb-4 flex justify-center gap-3">
          <button onClick={goPrev} disabled={currentVideoIdx === 0} className="bg-white/10 border-none rounded-lg px-6 py-2 text-slate-400 text-[13px] cursor-pointer disabled:opacity-30 flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> 前</button>
          <button onClick={goNext} disabled={currentVideoIdx >= stepVideos.length - 1} className="border-none rounded-lg px-6 py-2 text-white text-[13px] cursor-pointer font-semibold disabled:opacity-30 flex items-center gap-1" style={{ background: color }}>次 <ArrowRight className="w-4 h-4" /></button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: color }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ fontFamily: "'Noto Sans JP', 'Helvetica Neue', sans-serif" }}>
      <PortalHeader />

      <div className="flex flex-1">
        <TreeSidebar
          chapters={chapters} videos={videos} completedVideoIds={completedVideoIds}
          selectedStep={selectedStep} expandedCh={expandedCh} setExpandedCh={setExpandedCh}
          onStepClick={handleStepClick} currentVideoIdx={currentVideoIdx}
          onVideoClick={setCurrentVideoIdx} stepVideos={stepVideos}
          isAboutActive={isAbout} onAboutClick={handleAboutClick} slug={slug}
        />

        {isAbout ? (
          <>
            <AboutPage slug={slug} />
            <div className="lg:hidden fixed bottom-14 left-0 right-0 px-4 py-3 z-[55] flex justify-center">
              <button onClick={() => setMobileStepSheet(true)} className="w-full max-w-sm bg-indigo-600 text-white font-bold text-[14px] py-3 rounded-xl border-none cursor-pointer flex items-center justify-center gap-2 shadow-lg"><ListVideo className="w-4 h-4" /> ステップを選んで学習開始</button>
            </div>
          </>
        ) : (
          <div className="flex-1 bg-gray-50 flex flex-col min-w-0">
            <div className="px-5 py-3" style={{ background: `linear-gradient(135deg, ${color}12, ${color}06)`, borderBottom: '1px solid #e5e7eb' }}>
              <div className="text-[13px] text-gray-500">Ch{info?.chapter.number} {info?.chapter.title}</div>
              <div className="text-[18px] font-bold text-gray-900">Step {selectedStep} {info?.step.label}</div>
            </div>

            {stepVideos.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-[14px]">このステップの動画はまだ登録されていません</div>
            ) : (
              <div className="flex-1 overflow-y-auto p-5 pb-20">
                {current && youtubeId && (
                  <div className="relative rounded-xl overflow-hidden" style={{ paddingTop: '56.25%', background: '#0f172a' }}>
                    <iframe
                      key={youtubeId}
                      src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
                      className="absolute inset-0 w-full h-full border-none"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                    <button onClick={() => setExpanded(true)} className="absolute bottom-3 right-3 bg-black/60 backdrop-blur border-none rounded-lg px-3 py-1.5 text-white text-[12px] cursor-pointer hover:bg-black/80 transition flex items-center gap-1.5 z-10">
                      <Maximize2 className="w-4 h-4" /> 拡大
                    </button>
                  </div>
                )}
                {current && !youtubeId && (
                  <div className="rounded-xl bg-gray-200 relative" style={{ paddingTop: '56.25%' }}>
                    <span className="absolute inset-0 flex items-center justify-center text-gray-500 text-[14px]">動画URLが見つかりません</span>
                  </div>
                )}

                {/* Title */}
                <div className="mt-4">
                  <h2 className="text-[28px] font-extrabold text-gray-900 m-0 leading-tight">
                    {current ? (videoOrder(current) || currentVideoIdx + 1) : ''}. {current ? cleanTitle(current) : ''}
                  </h2>
                </div>

                {/* Action bar */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex gap-2">
                    {current?.slide_url && (
                      <a
                        href={current.slide_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-[10px] text-[14px] font-bold text-white no-underline hover:opacity-90 transition"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 2px 8px rgba(99,102,241,0.35)' }}
                      >
                        <Presentation className="w-4 h-4" />
                        動画のスライドを見る
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={goPrev} disabled={currentVideoIdx === 0} className="bg-gray-100 border-none rounded-[10px] px-3.5 py-2 text-[14px] text-gray-700 cursor-pointer disabled:opacity-30 hover:bg-gray-200 transition flex items-center gap-1">
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <button onClick={goNext} disabled={currentVideoIdx >= stepVideos.length - 1} className="border-none rounded-[10px] px-5 py-2 text-[14px] text-white cursor-pointer font-bold disabled:opacity-30 hover:opacity-90 transition flex items-center gap-1" style={{ background: color }}>
                      次 <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Key Points */}
                {videoPoints.length > 0 && (
                  <div className="mt-4 p-5 bg-white rounded-xl border border-gray-200">
                    <div className="text-[15px] font-bold text-gray-700 mb-3 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-gray-500" /> この動画のポイント
                    </div>
                    <PointsList points={videoPoints} color={color} />
                  </div>
                )}

                {/* Article link */}
                {current && (
                  <a href={`/articles/${current.video_id}`} target="_blank" rel="noopener noreferrer" className="mt-3 w-full block py-3 px-5 bg-white border border-gray-200 rounded-xl text-[14px] text-indigo-500 font-semibold no-underline hover:bg-indigo-50 transition flex items-center gap-2">
                    <FileText className="w-4 h-4" /> 解説記事を読む
                  </a>
                )}
              </div>
            )}

            {/* Mobile bottom nav */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2.5 flex items-center justify-between z-50">
              <button onClick={goPrev} disabled={currentVideoIdx === 0} className="text-[13px] text-gray-500 disabled:opacity-30 bg-transparent border-none cursor-pointer flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> 前</button>
              <button onClick={() => setMobileStepSheet(true)} className="text-[12px] font-bold text-indigo-600 bg-indigo-50 border-none rounded-full px-3 py-1.5 cursor-pointer flex items-center gap-1"><ListVideo className="w-3.5 h-3.5" /> {info?.step?.label || selectedStep} ({currentVideoIdx + 1}/{stepVideos.length})</button>
              <button onClick={goNext} disabled={currentVideoIdx >= stepVideos.length - 1} className="text-[13px] text-white font-semibold px-4 py-2 rounded-lg border-none cursor-pointer disabled:opacity-30 flex items-center gap-1" style={{ background: color }}>次 <ArrowRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {!isAbout && (
          <PlaylistSidebar
            stepVideos={stepVideos} currentVideoIdx={currentVideoIdx}
            onVideoClick={setCurrentVideoIdx} completedVideoIds={completedVideoIds}
            color={color} stepId={selectedStep}
          />
        )}
      </div>

      {/* Mobile Step Sheet */}
      {mobileStepSheet && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileStepSheet(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[70vh] flex flex-col" style={{ boxShadow: '0 -8px 30px rgba(0,0,0,0.12)' }}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
              <span className="text-[15px] font-bold text-gray-900">ステップ一覧</span>
              <button onClick={() => setMobileStepSheet(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border-none cursor-pointer text-gray-500 text-[14px]">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 pb-6">
              {chapters.map(ch => (
                <div key={ch.id}>
                  <div className="px-5 py-2.5 bg-gray-50 text-[12px] font-bold text-gray-500 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: ch.color }}>{ch.id.replace('ch','')}</span>
                    {ch.subtitle}
                  </div>
                  {ch.steps.map(s => {
                    const isActive = s.id === selectedStep;
                    const stepVids = videos.filter(v => v.step === s.id);
                    const watchedInStep = stepVids.filter(v => completedVideoIds.includes(v.video_id)).length;
                    return (
                      <button
                        key={s.id}
                        onClick={() => {
                          setSelectedStep(s.id);
                          setCurrentVideoIdx(0);
                          setExpandedCh(ch.id);
                          setMobileStepSheet(false);
                          window.history.replaceState(null, '', `?step=${s.id}`);
                        }}
                        className="w-full text-left flex items-center gap-3 px-5 py-3 border-none cursor-pointer transition-all"
                        style={{
                          background: isActive ? `${ch.color}08` : 'transparent',
                          borderLeft: isActive ? `3px solid ${ch.color}` : '3px solid transparent',
                        }}
                      >
                        <span className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{
                          background: isActive ? ch.color : '#f3f4f6',
                          color: isActive ? 'white' : '#9ca3af',
                        }}>{s.id}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] truncate" style={{ fontWeight: isActive ? 700 : 500, color: isActive ? ch.color : '#374151' }}>{s.label}</div>
                          <div className="text-[11px] text-gray-400">{stepVids.length}本{watchedInStep > 0 ? ` · ${watchedInStep}視聴済` : ''}</div>
                        </div>
                        {isActive && <span className="text-[11px] font-bold" style={{ color: ch.color }}>▶</span>}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
