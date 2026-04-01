'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StudentLayout } from '@/components/student/StudentLayout';
import { Loader2 } from 'lucide-react';

export default function StudentGuidePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }
    if (!authLoading && user) {
      fetch('/api/student/guide')
        .then((r) => r.json())
        .then((d) => {
          if (d.categories && d.categories.length > 0) {
            const firstCat = d.categories.find(
              (c: { pages: unknown[] }) => c.pages.length > 0
            );
            if (firstCat && firstCat.pages.length > 0) {
              router.replace(
                `/student/guide/${firstCat.pages[0].slug}`
              );
              return;
            }
          }
          setError('ガイドページがありません');
        })
        .catch(() => setError('データの取得に失敗しました'));
    }
  }, [authLoading, user, router]);

  return (
    <StudentLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        {error ? (
          <p className="text-gray-500">{error}</p>
        ) : (
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        )}
      </div>
    </StudentLayout>
  );
}
