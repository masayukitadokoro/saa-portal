'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, TrendingUp, Calendar } from 'lucide-react';

interface KeywordRanking {
  query: string;
  count: number;
}

interface Analytics {
  topKeywords: KeywordRanking[];
  searchesByDate: { date: string; count: number }[];
  totalSearches: number;
  uniqueUsers: number;
}

export default function AdminAnalytics() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'7' | '30' | '90'>('7');

  useEffect(() => {
    async function checkAdminAndLoadData() {
      const profileRes = await fetch('/api/profile');
      const profileData = await profileRes.json();
      
      if (profileData.profile?.role !== 'admin') {
        router.push('/');
        return;
      }

      loadAnalytics();
    }
    checkAdminAndLoadData();
  }, [router]);

  useEffect(() => {
    if (analytics) {
      loadAnalytics();
    }
  }, [period]);

  async function loadAnalytics() {
    setIsLoading(true);
    const res = await fetch(`/api/admin/analytics?days=${period}`);
    const data = await res.json();
    setAnalytics(data);
    setIsLoading(false);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <a href="/admin" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" />
            管理者ダッシュボードに戻る
          </a>
          
          <div className="flex gap-2">
            {(['7', '30', '90'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded text-sm ${
                  period === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {p}日間
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">アクセス分析</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <Search className="w-5 h-5 text-blue-600" />
              <span className="text-gray-500">期間内の検索数</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {analytics?.totalSearches.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-gray-500">ユニークユーザー数</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {analytics?.uniqueUsers.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Search className="w-5 h-5" />
            検索キーワードランキング
          </h2>
          
          {analytics?.topKeywords && analytics.topKeywords.length > 0 ? (
            <div className="space-y-3">
              {analytics.topKeywords.map((item, index) => (
                <div key={item.query} className="flex items-center gap-4">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-100 text-gray-600' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-50 text-gray-500'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-900">{item.query}</span>
                      <span className="text-sm text-gray-500">{item.count}回</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{
                          width: `${(item.count / analytics.topKeywords[0].count) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">データがありません</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            日別検索数
          </h2>
          
          {analytics?.searchesByDate && analytics.searchesByDate.length > 0 ? (
            <div className="space-y-2">
              {analytics.searchesByDate.map((item) => (
                <div key={item.date} className="flex items-center gap-4">
                  <span className="w-24 text-sm text-gray-500">{item.date}</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded"
                      style={{
                        width: `${(item.count / Math.max(...analytics.searchesByDate.map(d => d.count))) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="w-12 text-sm text-gray-600 text-right">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">データがありません</p>
          )}
        </div>
      </main>
    </div>
  );
}
