'use client';

import { useState, useEffect } from 'react';
import { 
  X, User, Mail, Clock, Star, CreditCard,
  Bookmark, Play, Search, FileText, LogIn,
  TrendingUp, TrendingDown, AlertTriangle
} from 'lucide-react';

interface UserDetail {
  user: {
    id: string;
    email: string;
    display_name: string | null;
    role: string;
    created_at: string;
    plan_type: string;
    trial_ends_at: string;
    subscription_status: string;
    last_login_at: string | null;
    is_super_user: boolean;
  };
  stats: {
    bookmarkCount: number;
    watchHistoryCount: number;
    completedCount: number;
  };
  stats7Days: {
    login: number;
    videoView: number;
    articleView: number;
    search: number;
    bookmarkAdd: number;
  };
  stats30Days: {
    login: number;
    videoView: number;
    articleView: number;
    search: number;
    bookmarkAdd: number;
  };
  engagementScore: number;
  churnRisk: 'low' | 'medium' | 'high';
  churnReason: string;
  recentActivities: Array<{
    id: string;
    activity_type: string;
    target_title: string | null;
    created_at: string;
  }>;
}

interface Props {
  userId: string;
  onClose: () => void;
  onAction: (userId: string, action: string, value?: any) => Promise<void>;
}

export default function UserDetailModal({ userId, onClose, onAction }: Props) {
  const [data, setData] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity'>('overview');

  useEffect(() => {
    loadUserDetail();
  }, [userId]);

  async function loadUserDetail() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to load user detail:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const getDaysRemaining = (trialEndsAt: string) => {
    const now = new Date();
    const end = new Date(trialEndsAt);
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login': return <LogIn className="w-4 h-4 text-blue-500" />;
      case 'video_view': return <Play className="w-4 h-4 text-green-500" />;
      case 'article_view': return <FileText className="w-4 h-4 text-purple-500" />;
      case 'search': return <Search className="w-4 h-4 text-orange-500" />;
      case 'bookmark_add': return <Bookmark className="w-4 h-4 text-yellow-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'login': return 'ログイン';
      case 'video_view': return '動画視聴';
      case 'article_view': return '記事閲覧';
      case 'search': return '検索';
      case 'bookmark_add': return 'ブックマーク追加';
      case 'bookmark_remove': return 'ブックマーク削除';
      default: return type;
    }
  };

  const getRiskConfig = (risk: string, score: number) => {
    if (risk === 'high') {
      return {
        bg: 'bg-red-50 border-red-200',
        icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
        label: '高リスク',
        labelColor: 'text-red-700',
        description: '10点以下：早急な対応が必要',
        scoreBg: 'bg-red-100',
        scoreColor: 'text-red-700'
      };
    } else if (risk === 'medium') {
      return {
        bg: 'bg-yellow-50 border-yellow-200',
        icon: <TrendingDown className="w-5 h-5 text-yellow-500" />,
        label: '中リスク',
        labelColor: 'text-yellow-700',
        description: '11-20点：注意が必要',
        scoreBg: 'bg-yellow-100',
        scoreColor: 'text-yellow-700'
      };
    }
    return {
      bg: 'bg-green-50 border-green-200',
      icon: <TrendingUp className="w-5 h-5 text-green-500" />,
      label: '低リスク',
      labelColor: 'text-green-700',
      description: '21点以上：良好',
      scoreBg: 'bg-green-100',
      scoreColor: 'text-green-700'
    };
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <p className="text-red-600">ユーザー情報の取得に失敗しました</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-200 rounded">閉じる</button>
        </div>
      </div>
    );
  }

  const { user, stats, stats7Days, engagementScore, churnRisk, recentActivities } = data;
  const daysRemaining = getDaysRemaining(user.trial_ends_at);
  const riskConfig = getRiskConfig(churnRisk, engagementScore);

  // スコア内訳計算
  const scoreBreakdown = [
    { label: 'ログイン', icon: LogIn, count: stats7Days.login, unit: '回', multiplier: 10, color: 'text-blue-500' },
    { label: '動画視聴', icon: Play, count: stats7Days.videoView, unit: '本', multiplier: 5, color: 'text-green-500' },
    { label: '記事閲覧', icon: FileText, count: stats7Days.articleView, unit: '件', multiplier: 5, color: 'text-purple-500' },
    { label: '検索', icon: Search, count: stats7Days.search, unit: '回', multiplier: 2, color: 'text-orange-500' },
    { label: 'ブックマーク', icon: Bookmark, count: stats7Days.bookmarkAdd, unit: '件', multiplier: 3, color: 'text-yellow-500' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">ユーザー詳細</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 基本情報 */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-gray-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold">{user.display_name || user.email}</h3>
              <p className="text-gray-500 text-sm flex items-center gap-1">
                <Mail className="w-4 h-4" /> {user.email}
              </p>
            </div>
          </div>

          {/* プラン状態 */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
              {user.is_super_user ? (
                <><Star className="w-4 h-4 text-yellow-500" /> スーパーユーザー</>
              ) : user.plan_type === 'paid' ? (
                <><CreditCard className="w-4 h-4 text-green-500" /> 有料会員</>
              ) : (
                <><Clock className="w-4 h-4 text-blue-500" /> トライアル（残り{daysRemaining}日）</>
              )}
            </div>
            <span className="text-gray-400">登録: {formatDate(user.created_at)}</span>
          </div>

          {/* タブ */}
          <div className="border-b">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-2 px-1 text-sm font-medium border-b-2 transition ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                エンゲージメント分析
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`pb-2 px-1 text-sm font-medium border-b-2 transition ${
                  activeTab === 'activity'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                アクティビティ履歴
              </button>
            </div>
          </div>

          {activeTab === 'overview' ? (
            <>
              {/* エンゲージメントスコア & 解約リスク（統合表示） */}
              <div className={`rounded-lg border p-4 ${riskConfig.bg}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {riskConfig.icon}
                    <span className={`font-bold ${riskConfig.labelColor}`}>
                      解約リスク: {riskConfig.label}
                    </span>
                  </div>
                  <div className={`px-4 py-2 rounded-lg ${riskConfig.scoreBg}`}>
                    <span className={`text-2xl font-bold ${riskConfig.scoreColor}`}>{engagementScore}</span>
                    <span className={`text-sm ${riskConfig.scoreColor}`}>/100点</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{riskConfig.description}</p>
              </div>

              {/* スコア内訳 */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  📊 スコア内訳（過去7日間）
                </h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-2 px-4 font-medium text-gray-600">指標</th>
                        <th className="text-center py-2 px-4 font-medium text-gray-600">回数</th>
                        <th className="text-center py-2 px-4 font-medium text-gray-600">×</th>
                        <th className="text-center py-2 px-4 font-medium text-gray-600">点数</th>
                        <th className="text-right py-2 px-4 font-medium text-gray-600">得点</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scoreBreakdown.map((item, index) => {
                        const Icon = item.icon;
                        const score = item.count * item.multiplier;
                        return (
                          <tr key={item.label} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="py-2 px-4 flex items-center gap-2">
                              <Icon className={`w-4 h-4 ${item.color}`} />
                              {item.label}
                            </td>
                            <td className="py-2 px-4 text-center">{item.count}{item.unit}</td>
                            <td className="py-2 px-4 text-center text-gray-400">×</td>
                            <td className="py-2 px-4 text-center text-gray-500">{item.multiplier}点</td>
                            <td className="py-2 px-4 text-right font-medium">{score}点</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-100">
                      <tr>
                        <td colSpan={4} className="py-2 px-4 font-bold text-right">合計</td>
                        <td className="py-2 px-4 text-right font-bold text-blue-600">{engagementScore}点</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* 累計実績 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">📈 累計実績</h4>
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="text-gray-500">動画視聴: </span>
                    <span className="font-medium">{stats.watchHistoryCount}本</span>
                  </div>
                  <div>
                    <span className="text-gray-500">ブックマーク: </span>
                    <span className="font-medium">{stats.bookmarkCount}件</span>
                  </div>
                  <div>
                    <span className="text-gray-500">視聴完了: </span>
                    <span className="font-medium">{stats.completedCount}本</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* アクティビティタブ */
            <div>
              <h4 className="font-medium mb-3">最近のアクティビティ</h4>
              {recentActivities && recentActivities.length > 0 ? (
                <div className="space-y-2">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      {getActivityIcon(activity.activity_type)}
                      <div className="flex-1">
                        <span className="font-medium text-sm">{getActivityLabel(activity.activity_type)}</span>
                        {activity.target_title && (
                          <span className="text-gray-500 text-sm ml-2">- {activity.target_title}</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatDate(activity.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">アクティビティがありません</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
