'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StudentLayout } from '@/components/student/StudentLayout';
import GuideRenderer from '@/components/student/GuideRenderer';
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Loader2,
  BookOpen,
  Calendar,
  GraduationCap,
  FolderOpen,
  Users,
  BarChart3,
  Plus,
} from 'lucide-react';
import Link from 'next/link';

interface GuidePage {
  id: string;
  title: string;
  slug: string;
  category_id: number;
  sort_order: number;
}

interface GuideCategory {
  id: number;
  slug: string;
  title: string;
  icon: string;
  sort_order: number;
  pages: GuidePage[];
}

interface GuidePageDetail {
  id: string;
  title: string;
  slug: string;
  content: Record<string, unknown>;
  category_id: number;
  updated_at: string;
  saa_guide_categories: {
    id: number;
    title: string;
    slug: string;
    icon: string;
  };
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  introduction: <BookOpen className="w-3.5 h-3.5" />,
  schedule: <Calendar className="w-3.5 h-3.5" />,
  graduation: <GraduationCap className="w-3.5 h-3.5" />,
  resources: <FolderOpen className="w-3.5 h-3.5" />,
  team: <Users className="w-3.5 h-3.5" />,
  scm: <BarChart3 className="w-3.5 h-3.5" />,
  'saa-plus': <Plus className="w-3.5 h-3.5" />,
};

export default function StudentGuideDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [page, setPage] = useState<GuidePageDetail | null>(null);
  const [categories, setCategories] = useState<GuideCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCats, setExpandedCats] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [pageRes, catRes] = await Promise.all([
        fetch(`/api/student/guide/${slug}`),
        fetch('/api/student/guide'),
      ]);
      const pageData = await pageRes.json();
      const catData = await catRes.json();

      if (pageData.page) {
        setPage(pageData.page);
        setExpandedCats(new Set([pageData.page.category_id]));
      }
      if (catData.categories) setCategories(catData.categories);
    } catch {
      setPage(null);
    } finally {
      setLoading(false);
    }
  }, [slug, user]);

  useEffect(() => {
    if (!authLoading && user) fetchData();
  }, [authLoading, user, fetchData]);

  const toggleCat = (catId: number) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
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

  if (!page) {
    return (
      <StudentLayout>
        <div className="text-center py-20">
          <p className="text-gray-500 mb-4">ページが見つかりません</p>
          <Link
            href="/student/guide"
            className="text-indigo-500 hover:underline"
          >
            ガイダンスに戻る
          </Link>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="flex min-h-[calc(100vh-64px)]">
        {/* Tree View Sidebar */}
        <aside className="w-56 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
          <div className="py-3 px-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">
              ガイド
            </p>

            <nav className="space-y-0.5">
              {categories.map((cat) => {
                const isExpanded = expandedCats.has(cat.id);
                const hasActivePage = cat.pages.some(
                  (p) => p.slug === slug
                );

                return (
                  <div key={cat.id}>
                    <button
                      onClick={() => toggleCat(cat.id)}
                      className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-[13px] rounded-md transition hover:bg-gray-50 ${
                        hasActivePage && !isExpanded
                          ? 'text-indigo-600 font-medium'
                          : 'text-gray-700'
                      }`}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      )}
                      <span className="flex-shrink-0 text-gray-500">
                        {CATEGORY_ICONS[cat.slug] || (
                          <FileText className="w-3.5 h-3.5" />
                        )}
                      </span>
                      <span className="truncate">{cat.title}</span>
                    </button>

                    {isExpanded && (
                      <div className="ml-3 border-l border-gray-100 pl-1 space-y-px mt-0.5 mb-1">
                        {cat.pages.map((p) => (
                          <Link
                            key={p.id}
                            href={`/student/guide/${p.slug}`}
                            className={`block px-2 py-1.5 text-[12px] rounded-md transition truncate ${
                              p.slug === slug
                                ? 'bg-indigo-50 text-indigo-700 font-medium'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                            }`}
                          >
                            {p.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-8 py-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-5">
              <span>ガイド</span>
              <ChevronRight className="w-3 h-3" />
              <span>
                {page.saa_guide_categories?.title}
              </span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-gray-600 truncate max-w-[240px]">
                {page.title}
              </span>
            </div>

            {/* Page title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-8">
              {page.title}
            </h1>

            {/* Content */}
            <GuideRenderer content={page.content as any} />

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-gray-200 text-sm text-gray-400">
              最終更新:{' '}
              {new Date(page.updated_at).toLocaleDateString('ja-JP')}
            </div>
          </div>
        </main>
      </div>
    </StudentLayout>
  );
}
