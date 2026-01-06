'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, Calendar, FileText, 
  Settings, BarChart3, GraduationCap, Bell,
  Video, ClipboardList
} from 'lucide-react';

export default function AdminDashboard() {
  const { profile, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/');
    }
  }, [loading, isAdmin, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const menuItems = [
    { icon: BarChart3, label: 'ダッシュボード', href: '/admin', active: true },
    { icon: Users, label: '受講生管理', href: '/admin/students', active: false },
    { icon: GraduationCap, label: 'TA管理', href: '/admin/tas', active: false },
    { icon: Video, label: '動画管理', href: '/admin/videos', active: false },
    { icon: Calendar, label: '講義管理', href: '/admin/lectures', active: false },
    { icon: ClipboardList, label: '課題管理', href: '/admin/assignments', active: false },
    { icon: FileText, label: '出席管理', href: '/admin/attendance', active: false },
    { icon: Bell, label: '通知管理', href: '/admin/notifications', active: false },
    { icon: Settings, label: '設定', href: '/admin/settings', active: false },
  ];

  const stats = {
    totalStudents: 0,
    totalVideos: 360,
    totalLectures: 0,
    pendingAssignments: 0,
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* サイドバー */}
      <aside className="w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white fixed h-full">
        <div className="p-6">
          <h1 className="text-xl font-bold">SAA管理画面</h1>
          <p className="text-sm text-slate-400 mt-1">{profile?.display_name}</p>
        </div>
        
        <nav className="mt-4">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-6 py-3 text-sm transition ${
                item.active
                  ? 'bg-white/10 border-l-4 border-purple-500 text-white'
                  : 'text-slate-300 hover:bg-white/5 border-l-4 border-transparent'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-4 left-0 right-0 px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
          >
            ← ポータルに戻る
          </Link>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 ml-64 p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">ダッシュボード</h2>
          <p className="text-gray-500 mt-1">SAA運営管理画面</p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">受講生数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Video className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">動画数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalVideos}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">講義数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalLectures}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">未確認課題</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingAssignments}</p>
              </div>
            </div>
          </div>
        </div>

        {/* クイックアクション */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">クイックアクション</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-left">
              <Users className="w-6 h-6 text-blue-600 mb-2" />
              <p className="font-medium text-gray-900">受講生追加</p>
              <p className="text-sm text-gray-500">新規受講生を登録</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-left">
              <Calendar className="w-6 h-6 text-green-600 mb-2" />
              <p className="font-medium text-gray-900">講義登録</p>
              <p className="text-sm text-gray-500">新しい講義を追加</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-left">
              <Bell className="w-6 h-6 text-purple-600 mb-2" />
              <p className="font-medium text-gray-900">通知送信</p>
              <p className="text-sm text-gray-500">受講生へ通知</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-left">
              <FileText className="w-6 h-6 text-orange-600 mb-2" />
              <p className="font-medium text-gray-900">レポート</p>
              <p className="text-sm text-gray-500">進捗レポート出力</p>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
