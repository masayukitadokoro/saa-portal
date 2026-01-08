'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Users, BarChart3, GraduationCap, Video, Calendar, 
  ClipboardList, FileText, Bell, Settings,
  Search, Plus, Filter
} from 'lucide-react';

interface Student {
  id: string;
  user_id: string;
  batch_id: number;
  status: string;
  engagement_score: number;
  engagement_status: string;
  subsidy_eligible: boolean;
  payment_status: string;
  enrolled_at: string;
  profiles: {
    display_name: string;
    email: string;
    avatar_url?: string;
  };
  ta: {
    display_name: string;
  } | null;
}

export default function StudentsPage() {
  const { profile, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/');
    }
  }, [loading, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchStudents();
    }
  }, [isAdmin]);

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/admin/students');
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
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
    { icon: BarChart3, label: 'ダッシュボード', href: '/admin', active: false },
    { icon: Users, label: '受講生管理', href: '/admin/students', active: true },
    { icon: GraduationCap, label: 'TA管理', href: '/admin/tas', active: false },
    { icon: Video, label: '動画管理', href: '/admin/videos', active: false },
    { icon: Calendar, label: '講義管理', href: '/admin/lectures', active: false },
    { icon: ClipboardList, label: '課題管理', href: '/admin/assignments', active: false },
    { icon: FileText, label: '出席管理', href: '/admin/attendance', active: false },
    { icon: Bell, label: '通知管理', href: '/admin/notifications', active: false },
    { icon: Settings, label: '設定', href: '/admin/settings', active: false },
  ];

  const filteredStudents = students.filter(student => 
    student.profiles?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      dropped: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: '受講中',
      completed: '修了',
      dropped: '中退',
      pending: '保留',
    };
    return labels[status] || status;
  };

  const getEngagementBadge = (status: string) => {
    const styles: Record<string, string> = {
      excellent: 'bg-emerald-100 text-emerald-800',
      good: 'bg-blue-100 text-blue-800',
      warning: 'bg-yellow-100 text-yellow-800',
      danger: 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getEngagementLabel = (status: string) => {
    const labels: Record<string, string> = {
      excellent: '優秀',
      good: '順調',
      warning: '要注意',
      danger: '危険',
    };
    return labels[status] || status;
  };

  const handleRowClick = (studentId: string) => {
    router.push(`/admin/students/${studentId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
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
          <Link href="/" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition">
            ← ポータルに戻る
          </Link>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">受講生管理</h2>
            <p className="text-gray-500 mt-1">全 {students.length} 名の受講生</p>
          </div>
          <button className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
            <Plus className="w-5 h-5" />
            受講生を追加
          </button>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="名前またはメールで検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              <Filter className="w-5 h-5" />
              フィルター
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">受講生</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">バッチ</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">担当TA</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">ステータス</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">エンゲージメント</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">入学日</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {students.length === 0 ? '受講生がいません' : '該当する受講生が見つかりません'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr 
                    key={student.id} 
                    onClick={() => handleRowClick(student.id)}
                    className="border-b border-gray-50 hover:bg-purple-50 transition cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 font-semibold">
                            {student.profiles?.display_name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{student.profiles?.display_name || '未設定'}</p>
                          <p className="text-sm text-gray-500">{student.profiles?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900">第{student.batch_id}期</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900">{student.ta?.display_name || '未割当'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(student.status)}`}>
                        {getStatusLabel(student.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEngagementBadge(student.engagement_status)}`}>
                          {getEngagementLabel(student.engagement_status)}
                        </span>
                        <span className="text-sm text-gray-500">{student.engagement_score}点</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {student.enrolled_at ? new Date(student.enrolled_at).toLocaleDateString('ja-JP') : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
