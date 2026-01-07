'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { formatVideoTitle } from '@/lib/formatTitle';
import { PipGuideModal } from '@/components/PipGuideModal';
import { track } from '@/lib/tracking';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Eye, 
  ChevronDown,
  ChevronUp,
  Play,
  Bookmark,
  BookmarkCheck,
  User,
  Loader2,
  FileText,
  FileSpreadsheet,
  Presentation,
  ArrowRight,
  ImageIcon,
  File,
  PlayCircle,
  PictureInPicture2
} from 'lucide-react';

interface Video {
  video_id: string;
  title: string;
  description?: string;
  summary?: string;
  youtube_id?: string;
  video_url?: string;
  thumbnail_url?: string;
  custom_thumbnail_url?: string;
  duration?: number;
  category_id?: string;
  category_name?: string;
  view_count?: number;
  display_order?: number;
  created_at?: string;
  points?: string[];
  key_points?: string[];
  article_content?: string;
  article_summary?: string;
  categories?: {
    name?: string;
    id?: number;
  };
}

interface RelatedVideo {
  video_id: string;
  title: string;
  thumbnail_url?: string;
  custom_thumbnail_url?: string;
  youtube_id?: string;
  video_url?: string;
  duration?: number;
  view_count?: number;
  display_order?: number;
}

interface Resource {
  id: string;
  title: string;
  url: string;
  type: 'spreadsheet' | 'slides' | 'document' | 'other';
}

interface UserInfo {
  name?: string;
  avatar?: string;
}

// YouTube IDを抽出する関数
function extractYouTubeId(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return match ? match[1] : null;
}

// YouTubeサムネイルURLを生成
function getYouTubeThumbnail(youtubeId: string): string {
  return `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`;
}

// 相対時間を計算する関数
function getRelativeTime(dateString?: string): string {
  if (!dateString) return '';
  
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) return 'たった今';
  if (diffMin < 60) return `${diffMin}分前`;
  if (diffHour < 24) return `${diffHour}時間前`;
  if (diffDay < 7) return `${diffDay}日前`;
  if (diffWeek < 4) return `${diffWeek}週間前`;
  if (diffMonth < 12) return `${diffMonth}ヶ月前`;
  return `${diffYear}年前`;
}

export default function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [video, setVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<RelatedVideo[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [showAllPoints, setShowAllPoints] = useState(false);
  const [showFullArticle, setShowFullArticle] = useState(false);
  const [showPipGuide, setShowPipGuide] = useState(false);
  const hasRecordedHistory = useRef(false);

  useEffect(() => {
    fetchVideo();
    fetchUserInfo();
    checkBookmark();
    fetchResources();
  }, [resolvedParams.id]);

  const fetchVideo = async () => {
    try {
      const res = await fetch(`/api/videos/${resolvedParams.id}`);
      if (res.ok) {
        const data = await res.json();
        setVideo(data.video || data);
        setRelatedVideos(data.relatedVideos || []);
        
        if (!hasRecordedHistory.current) {
          recordWatchHistory();
          track.videoView(resolvedParams.id, data.video?.title || data.title || '');
          hasRecordedHistory.current = true;
        }
      }
    } catch (error) {
      console.error('Failed to fetch video:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async () => {
    try {
      const res = await fetch(`/api/videos/${resolvedParams.id}/resources`);
      if (res.ok) {
        const data = await res.json();
        setResources(data.resources || []);
      }
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    }
  };

  const fetchUserInfo = async () => {
    try {
      const res = await fetch('/api/mypage/profile');
      if (res.ok) {
        const data = await res.json();
        setUserInfo({
          name: data.display_name || data.email?.split('@')[0],
          avatar: data.avatar_url,
        });
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  };

  const checkBookmark = async () => {
    try {
      const res = await fetch(`/api/bookmarks/${resolvedParams.id}`);
      if (res.ok) {
        const data = await res.json();
        setIsBookmarked(data.isBookmarked);
      }
    } catch (error) {
      console.error('Failed to check bookmark:', error);
    }
  };

  const recordWatchHistory = async () => {
    try {
      await fetch('/api/mypage/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          video_id: resolvedParams.id,
          progress_seconds: 0 
        }),
      });
    } catch (error) {
      console.error('Failed to record watch history:', error);
    }
  };

  const toggleBookmark = async () => {
    setBookmarkLoading(true);
    try {
      if (isBookmarked) {
        const res = await fetch(`/api/bookmarks/${resolvedParams.id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setIsBookmarked(false);
          track.bookmarkRemove(resolvedParams.id, video?.title || '');
        }
      } else {
        const res = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ video_id: resolvedParams.id }),
        });
        if (res.ok) {
          setIsBookmarked(true);
          track.bookmarkAdd(resolvedParams.id, video?.title || '');
        }
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    } finally {
      setBookmarkLoading(false);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'spreadsheet':
        return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
      case 'slides':
        return <Presentation className="w-5 h-5 text-orange-500" />;
      case 'document':
        return <FileText className="w-5 h-5 text-blue-600" />;
      default:
        return <File className="w-5 h-5 text-purple-600" />;
    }
  };

  const getResourceTypeLabel = (type: string) => {
    switch (type) {
      case 'spreadsheet':
        return 'スプレッドシートで開く';
      case 'slides':
        return 'スライドで開く';
      case 'document':
        return 'ドキュメントで開く';
      default:
        return '外部リンクで開く';
    }
  };

  const getVideoThumbnail = (relatedVideo: RelatedVideo): string | null => {
    if (relatedVideo.custom_thumbnail_url) return relatedVideo.custom_thumbnail_url;
    if (relatedVideo.thumbnail_url) return relatedVideo.thumbnail_url;
    
    const ytId = relatedVideo.youtube_id || extractYouTubeId(relatedVideo.video_url);
    if (ytId) return getYouTubeThumbnail(ytId);
    
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">動画が見つかりませんでした</p>
        <Link href="/" className="text-rose-600 hover:text-rose-700">
          ホームに戻る
        </Link>
      </div>
    );
  }

  const youtubeId = video.youtube_id || video.video_id || extractYouTubeId(video.video_url);
  
  // points または key_points を使用
  const videoPoints = video.points || video.key_points || [];
  const displayPoints = showAllPoints ? videoPoints : videoPoints.slice(0, 4);
  
  // カテゴリ名を取得
  const categoryName = video.category_name || video.categories?.name;
  const categoryId = video.category_id || video.categories?.id;

  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 bg-gray-100 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* 左: ロゴ */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">🔬</span>
            </div>
            <span className="hidden sm:block font-bold text-gray-900">
              起業の科学<span className="text-rose-500">ポータル</span>
            </span>
          </Link>

          {/* 中央: シリーズ名 */}
          <div className="flex-1 flex justify-center px-4">
            {categoryName && (
              <Link
                href={`/category/startup-science`}
                className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-purple-100 to-blue-100 hover:from-purple-200 hover:to-blue-200 rounded-full transition-all border border-purple-200"
              >
                <PlayCircle className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">{categoryName}動画シリーズ</span>
                <ChevronDown className="w-4 h-4 text-purple-500" />
              </Link>
            )}
          </div>

          {/* 右: 保存 + ユーザー（アイコン+名前） */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={toggleBookmark}
              disabled={bookmarkLoading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                isBookmarked
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-300'
              } ${bookmarkLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-4 h-4" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">保存</span>
            </button>

            <Link
              href="/mypage"
              className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {userInfo?.avatar ? (
                <Image
                  src={userInfo.avatar}
                  alt={userInfo.name || 'User'}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {userInfo?.name ? userInfo.name[0].toUpperCase() : <User className="w-4 h-4" />}
                </div>
              )}
              {userInfo?.name && (
                <span className="hidden md:block text-sm font-medium text-gray-700">
                  {userInfo.name}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* 動画プレーヤー（フル幅） */}
      <div className="w-full bg-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="relative aspect-video bg-black">
            {youtubeId ? (
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
                title={formatVideoTitle(video.title, video.display_order)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <Play className="w-16 h-16" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PiPガイドボタン（モバイル向け） */}
      <div className="max-w-6xl mx-auto px-4 pt-2 lg:hidden">
        <button
          onClick={() => setShowPipGuide(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-full transition"
        >
          <PictureInPicture2 className="w-4 h-4" />
          バックグラウンド再生の方法
        </button>
      </div>

      {/* メインコンテンツエリア */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row lg:gap-8">
          {/* 左: メインコンテンツ */}
          <div className="flex-1 min-w-0">
            {/* タイトル + 保存ボタン */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                  {formatVideoTitle(video.title, video.display_order)}
                </h1>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {video.view_count?.toLocaleString() || 0}回視聴
                  </span>
                  <span>•</span>
                  <span>{getRelativeTime(video.created_at)}</span>
                </div>
              </div>
              {/* モバイル用保存ボタン */}
              <button
                onClick={toggleBookmark}
                disabled={bookmarkLoading}
                className={`lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border ${
                  isBookmarked
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-white text-gray-600 border-gray-300'
                }`}
              >
                {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                <span>保存</span>
              </button>
            </div>

            {/* この動画のポイント */}
            {videoPoints.length > 0 && (
              <div className="mt-6 p-5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                <h2 className="flex items-center gap-2 font-bold text-gray-900 mb-4">
                  <span className="text-lg">📖</span>
                  この動画のポイント
                </h2>
                
                {video.summary && (
                  <div className="mb-4 p-3 bg-white/60 rounded-lg border border-blue-100">
                    <p className="text-sm text-gray-700 leading-relaxed">{video.summary}</p>
                  </div>
                )}

                <ol className="space-y-3">
                  {displayPoints.map((point, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                      <span className="text-sm text-gray-700 leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ol>

                {videoPoints.length > 4 && (
                  <button
                    onClick={() => setShowAllPoints(!showAllPoints)}
                    className="mt-4 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {showAllPoints ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        閉じる
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        すべて表示
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* 解説記事 */}
            <div className="mt-6 p-5 bg-white rounded-xl border border-gray-200">
              <h2 className="flex items-center gap-2 font-bold text-gray-900 mb-2">
                <FileText className="w-5 h-5 text-blue-600" />
                解説記事
              </h2>
              
              <p className="text-xs text-gray-500 mb-3">この動画で学べること</p>

              {(video.article_content || video.description) ? (
                <>
                  <div className={`text-sm text-gray-700 leading-relaxed ${!showFullArticle ? 'line-clamp-3' : ''}`}>
                    <p className="whitespace-pre-wrap">{video.article_content || video.description}</p>
                  </div>
                  
                  <button
                    onClick={() => setShowFullArticle(!showFullArticle)}
                    className="mt-3 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {showFullArticle ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        テキストを閉じる
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        テキストで続きを読む
                      </>
                    )}
                  </button>
                </>
              ) : (
                <p className="text-sm text-gray-500">この動画の解説記事はありません</p>
              )}

              {/* 画像付きの記事で読むボタン */}
              <Link
                href={`/articles/${video.video_id}`}
                className="mt-4 flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 hover:border-purple-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">画像付きの記事で読む</p>
                    <p className="text-xs text-gray-500">カバー画像・解説図付きのリッチな記事</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-purple-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
              </Link>
            </div>

            {/* 関連資料 */}
            <div className="mt-6 p-5 bg-white rounded-xl border border-gray-200">
              <h2 className="flex items-center gap-2 font-bold text-gray-900 mb-4">
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
                関連資料
              </h2>
              
              {resources.length > 0 ? (
                <div className="space-y-3">
                  {resources.map((resource) => (
                    <a
                      key={resource.id}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 hover:border-purple-300 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          {getResourceIcon(resource.type)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{resource.title}</p>
                          <p className="text-xs text-gray-500">{getResourceTypeLabel(resource.type)}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-purple-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">この動画の関連資料はありません</p>
              )}
            </div>

            {/* モバイル用関連動画 */}
            <div className="mt-6 lg:hidden">
              <h2 className="font-bold text-gray-900 mb-4">関連動画</h2>
              <div className="space-y-3">
                {relatedVideos.length > 0 ? (
                  relatedVideos.slice(0, 5).map((related) => {
                    const thumbUrl = getVideoThumbnail(related);
                    return (
                      <Link
                        key={related.video_id}
                        href={`/videos/${related.video_id}`}
                        className="flex gap-3 group"
                      >
                        <div className="relative w-32 flex-shrink-0 aspect-video rounded-lg overflow-hidden bg-gray-200">
                          {thumbUrl ? (
                            <Image
                              src={thumbUrl}
                              alt={formatVideoTitle(related.title, related.display_order)}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          {related.duration && (
                            <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/80 text-white text-xs rounded">
                              {formatDuration(related.duration)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-rose-600 transition-colors">
                            {formatVideoTitle(related.title, related.display_order)}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {related.view_count?.toLocaleString() || 0}回視聴
                          </p>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500">関連動画はありません</p>
                )}
              </div>
            </div>
          </div>

          {/* 右: 関連動画（デスクトップ用 - sticky） */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-20">
              <h2 className="font-bold text-gray-900 mb-4">関連動画</h2>
              <div className="space-y-3 max-h-[calc(100vh-120px)] overflow-y-auto pr-2">
                {relatedVideos.length > 0 ? (
                  relatedVideos.map((related) => {
                    const thumbUrl = getVideoThumbnail(related);
                    return (
                      <Link
                        key={related.video_id}
                        href={`/videos/${related.video_id}`}
                        className="flex gap-3 group"
                      >
                        <div className="relative w-40 flex-shrink-0 aspect-video rounded-lg overflow-hidden bg-gray-200">
                          {thumbUrl ? (
                            <Image
                              src={thumbUrl}
                              alt={formatVideoTitle(related.title, related.display_order)}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          {related.duration && (
                            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-white text-xs rounded">
                              {formatDuration(related.duration)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-rose-600 transition-colors">
                            {formatVideoTitle(related.title, related.display_order)}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {related.view_count?.toLocaleString() || 0}回視聴
                          </p>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500">関連動画はありません</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PiPガイドモーダル */}
      <PipGuideModal isOpen={showPipGuide} onClose={() => setShowPipGuide(false)} />
    </div>

  );
}
