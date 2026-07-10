'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { StudentLayout } from '@/components/student/StudentLayout';
import {
  Bookmark,
  Video,
  Loader2,
  Trash2,
  Play,
  Clock,
} from 'lucide-react';

interface BookmarkedVideo {
  id: string;
  video_id: string;
  created_at: string;
  videos: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    duration: number | null;
    category: string;
    display_order: number;
  };
}

const CATEGORY_NAMES: Record<string, string> = {
  kagaku: '起業の科学',
  taizen: '起業大全',
  sanbo: '起業参謀',
};

export default function BookmarksPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<BookmarkedVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!authLoading && user) {
      fetch('/api/bookmarks')
        .then((r) => r.json())
        .then((d) => setBookmarks(d.bookmarks || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [authLoading, user]);

  const removeBookmark = async (videoId: string) => {
    try {
      await fetch(`/api/bookmarks/${videoId}`, { method: 'DELETE' });
      setBookmarks((prev) => prev.filter((b) => b.video_id !== videoId));
    } catch {}
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
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Bookmark className="w-5 h-5 text-indigo-500" />
          <h1 className="text-xl font-bold text-gray-900">保存した動画</h1>
          <span className="text-sm text-gray-400 ml-1">{bookmarks.length}件</span>
        </div>

        {bookmarks.length === 0 ? (
          <div className="text-center py-16">
            <Bookmark className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">保存した動画はまだありません</p>
            <p className="text-sm text-gray-400 mb-4">
              動画ページでブックマークアイコンをクリックすると保存できます
            </p>
            <Link
              href="/student/videos/kagaku/learn"
              className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 no-underline"
            >
              <Play className="w-3.5 h-3.5" />
              動画を探す
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {bookmarks.map((bm) => (
              <div
                key={bm.id}
                className="flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition group"
              >
                {/* Thumbnail */}
                <Link
                  href={`/videos/${bm.videos.id}`}
                  className="w-32 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative no-underline"
                >
                  {bm.videos.thumbnail_url ? (
                    <img
                      src={bm.videos.thumbnail_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition">
                    <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
                      <Play className="w-4 h-4 text-indigo-600 ml-0.5" />
                    </div>
                  </div>
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/videos/${bm.videos.id}`}
                    className="text-sm font-medium text-gray-900 hover:text-indigo-600 no-underline line-clamp-2"
                  >
                    {bm.videos.title}
                  </Link>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                    <span className="bg-gray-100 px-2 py-0.5 rounded">
                      {CATEGORY_NAMES[bm.videos.category] || bm.videos.category}
                    </span>
                    {bm.videos.duration && (
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {Math.round(bm.videos.duration / 60)}分
                      </span>
                    )}
                    <span>
                      保存日: {new Date(bm.created_at).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeBookmark(bm.video_id)}
                  className="p-2 text-gray-300 hover:text-red-500 transition flex-shrink-0"
                  title="保存を解除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
