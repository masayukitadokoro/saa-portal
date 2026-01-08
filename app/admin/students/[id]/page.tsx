'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface StudentDetail {
  id: string;
  user_id: string;
  batch_id: number;
  status: 'active' | 'completed' | 'dropped';
  engagement_score: number;
  engagement_status: 'danger' | 'warning' | 'good' | 'excellent';
  subsidy_eligible: boolean;
  payment_status: 'paid' | 'pending';
  enrolled_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  profile: {
    id: string;
    display_name: string;
    email: string;
    avatar_url: string | null;
  } | null;
  batch: {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
  } | null;
  ta: {
    id: string;
    display_name: string;
    email: string;
    avatar_url: string | null;
  } | null;
}

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await fetch(`/api/admin/students/${params.id}`);
        if (!res.ok) {
          throw new Error('受講生が見つかりません');
        }
        const data = await res.json();
        setStudent(data.student);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchStudent();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">{error || '受講生が見つかりません'}</p>
          <Link href="/admin/students" className="text-indigo-600 hover:underline mt-4 inline-block">
            ← 受講生一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'dropped': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return '受講中';
      case 'completed': return '修了';
      case 'dropped': return '中退';
      default: return status;
    }
  };

  const getEngagementColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-emerald-500';
      case 'good': return 'bg-blue-500';
      case 'warning': return 'bg-yellow-500';
      case 'danger': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getEngagementLabel = (status: string) => {
    switch (status) {
      case 'excellent': return '優秀';
      case 'good': return '順調';
      case 'warning': return '要注意';
      case 'danger': return '危険';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getInitial = (name: string) => {
    return name?.charAt(0) || '?';
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* ヘッダー */}
      <div className="mb-8">
        <Link 
          href="/admin/students" 
          className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1 mb-4"
        >
          ← 受講生一覧に戻る
        </Link>
        
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {getInitial(student.profile?.display_name || '')}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {student.profile?.display_name || '名前未設定'}
              </h1>
              <p className="text-gray-500">{student.profile?.email}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(student.status)}`}>
              {getStatusLabel(student.status)}
            </span>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
              編集
            </button>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="grid grid-cols-3 gap-6">
        {/* 左カラム - 基本情報 */}
        <div className="col-span-2 space-y-6">
          {/* エンゲージメント状況 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              📊 エンゲージメント状況
            </h2>
            
            <div className="flex items-center gap-8">
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-gray-900">{student.engagement_score}</span>
                  <span className="text-gray-500">/ 100</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getEngagementColor(student.engagement_status)} transition-all`}
                    style={{ width: `${student.engagement_score}%` }}
                  />
                </div>
              </div>
              
              <div className="text-center">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                  student.engagement_status === 'excellent' ? 'bg-emerald-100 text-emerald-800' :
                  student.engagement_status === 'good' ? 'bg-blue-100 text-blue-800' :
                  student.engagement_status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${getEngagementColor(student.engagement_status)}`}></span>
                  <span className="font-medium">{getEngagementLabel(student.engagement_status)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 受講情報 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              📚 受講情報
            </h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-gray-500">バッチ</label>
                <p className="text-lg font-medium text-gray-900">
                  {student.batch?.name || `第${student.batch_id}期`}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">入学日</label>
                <p className="text-lg font-medium text-gray-900">
                  {formatDate(student.enrolled_at)}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">給付金対象</label>
                <p className="text-lg font-medium">
                  {student.subsidy_eligible ? (
                    <span className="text-green-600">✓ 対象</span>
                  ) : (
                    <span className="text-gray-400">対象外</span>
                  )}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">支払い状況</label>
                <p className="text-lg font-medium">
                  {student.payment_status === 'paid' ? (
                    <span className="text-green-600">✓ 支払済</span>
                  ) : (
                    <span className="text-yellow-600">⏳ 未払い</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* 学習進捗（将来拡張用） */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              🎯 学習進捗
            </h2>
            <div className="text-center py-8 text-gray-400">
              <p>学習進捗データは今後実装予定です</p>
            </div>
          </div>
        </div>

        {/* 右カラム - サイドバー */}
        <div className="space-y-6">
          {/* 担当TA */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              👤 担当TA
            </h3>
            
            {student.ta ? (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-white font-bold">
                  {getInitial(student.ta.display_name)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{student.ta.display_name}</p>
                  <p className="text-sm text-gray-500">{student.ta.email}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400 text-sm mb-3">未割当</p>
                <button className="text-sm text-indigo-600 hover:underline">
                  + TAを割り当てる
                </button>
              </div>
            )}
          </div>

          {/* クイックアクション */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">⚡ クイックアクション</h3>
            
            <div className="space-y-2">
              <button className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-left text-sm font-medium text-gray-700 transition">
                💬 Slackで連絡
              </button>
              <button className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-left text-sm font-medium text-gray-700 transition">
                📧 メールを送信
              </button>
              <button className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-left text-sm font-medium text-gray-700 transition">
                📝 メモを追加
              </button>
            </div>
          </div>

          {/* メタ情報 */}
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-500">
            <div className="flex justify-between mb-2">
              <span>作成日</span>
              <span>{formatDate(student.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span>更新日</span>
              <span>{formatDate(student.updated_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
