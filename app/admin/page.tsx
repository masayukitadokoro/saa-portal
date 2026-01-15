'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  Video, 
  Users, 
  Search,
  TrendingUp,
  Calendar,
  FileText,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface Stats {
  totalVideos: number;
  totalUsers: number;
  totalSearches: number;
  todaySearches: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/admin/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Stats fetch error:', error);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* ヘッダー */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
          <p className="text-sm text-gray-500 mt-1">SAA管理画面の概要</p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={<Video className="w-6 h-6" />}
            label="総動画数"
            value={stats?.totalVideos || 0}
            color="blue"
            loading={loading}
          />
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="総ユーザー数"
            value={stats?.totalUsers || 0}
            color="green"
            loading={loading}
          />
          <StatCard
            icon={<Search className="w-6 h-6" />}
            label="総検索数"
            value={stats?.totalSearches || 0}
            color="purple"
            loading={loading}
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="本日の検索数"
            value={stats?.todaySearches || 0}
            color="orange"
            loading={loading}
          />
        </div>

        {/* クイックアクション */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">クイックアクション</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <QuickActionCard
              href="/admin/events"
              icon={<Calendar className="w-8 h-8" />}
              title="イベント管理"
              description="講義・オフィスアワーの管理"
            />
            <QuickActionCard
              href="/admin/students"
              icon={<Users className="w-8 h-8" />}
              title="受講生管理"
              description="受講生・TAの情報管理"
            />
            <QuickActionCard
              href="/admin/contents"
              icon={<FileText className="w-8 h-8" />}
              title="コンテンツ管理"
              description="動画・記事・資料の管理"
            />
          </div>
        </div>

        {/* 最近のアクティビティ（プレースホルダー） */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">最近のアクティビティ</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-gray-500 text-center py-8">
              アクティビティ機能は今後実装予定です
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  color,
  loading
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number; 
  color: 'blue' | 'green' | 'purple' | 'orange';
  loading: boolean;
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          {loading ? (
            <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
          ) : (
            <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ 
  href, 
  icon, 
  title, 
  description 
}: { 
  href: string; 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-indigo-200 transition-all group"
    >
      <div className="text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
        {title}
        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
      </h3>
      <p className="text-sm text-gray-500">{description}</p>
    </Link>
  );
}
