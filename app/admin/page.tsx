'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { 
  BarChart3, 
  Upload, 
  Users, 
  Video, 
  Search,
  TrendingUp 
} from 'lucide-react';

interface Stats {
  totalVideos: number;
  totalUsers: number;
  totalSearches: number;
  todaySearches: number;
}

interface Profile {
  id: string;
  email: string;
  role: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAdminAndLoadData() {
      if (authLoading) return;
      
      if (!user) {
        router.push('/');
        return;
      }

      const profileRes = await fetch('/api/profile');
      const profileData = await profileRes.json();
      
      if (profileData.profile?.role !== 'admin') {
        alert('管理者権限がありません');
        router.push('/');
        return;
      }
      
      setProfile(profileData.profile);

      const statsRes = await fetch('/api/admin/stats');
      const statsData = await statsRes.json();
      setStats(statsData);
      
      setIsLoading(false);
    }

    checkAdminAndLoadData();
  }, [user, authLoading, router]);

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">管理者ダッシュボード</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{profile?.email}</span>
            <a href="/" className="text-blue-600 hover:underline text-sm">
              ← サイトに戻る
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Video className="w-6 h-6" />}
            label="総動画数"
            value={stats?.totalVideos || 0}
            color="blue"
          />
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="総ユーザー数"
            value={stats?.totalUsers || 0}
            color="green"
          />
          <StatCard
            icon={<Search className="w-6 h-6" />}
            label="総検索数"
            value={stats?.totalSearches || 0}
            color="purple"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="本日の検索数"
            value={stats?.todaySearches || 0}
            color="orange"
          />
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-4">管理メニュー</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MenuCard
            href="/admin/contents"
            icon={<Video className="w-8 h-8" />}
            title="動画管理"
            description="動画の一覧表示、編集、削除"
          />
          <MenuCard
            href="/admin/upload"
            icon={<Upload className="w-8 h-8" />}
            title="動画一括アップロード"
            description="CSVファイルから動画を一括登録"
          />
          <MenuCard
            href="/admin/users"
            icon={<Users className="w-8 h-8" />}
            title="ユーザー管理"
            description="ユーザー一覧と権限管理"
          />
          <MenuCard
            href="/admin/analytics"
            icon={<BarChart3 className="w-8 h-8" />}
            title="アクセス分析"
            description="検索キーワードランキング、人気動画"
          />
        </div>
      </main>
    </div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number; 
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

function MenuCard({ 
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
    <a
      href={href}
      className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow group"
    >
      <div className="text-blue-600 mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </a>
  );
}
