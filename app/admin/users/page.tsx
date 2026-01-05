'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, Clock, CreditCard, Star, AlertTriangle, GraduationCap,
  Search, RefreshCw, ChevronUp, ChevronDown, ArrowLeft,
  Calendar, Mail, HelpCircle, X, Inbox
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  created_at: string;
  plan_type: string;
  subscription_type: string | null;
  trial_ends_at: string;
  paid_at: string | null;
  next_renewal_at: string | null;
  last_login_at: string | null;
  is_super_user: boolean;
  is_alumni: boolean;
  alumni_batch_number: number | null;
  alumni_approved_at: string | null;
  engagementScore: number | null;
  churnRisk: 'low' | 'medium' | 'high' | null;
}

interface KPIs {
  total: number;
  trial: number;
  paidMonthly: number;
  paidYearly: number;
  superUser: number;
  highRisk: number;
  alumniPending: number;
}

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            いいえ
          </button>
          <button onClick={onConfirm} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            はい
          </button>
        </div>
      </div>
    </div>
  );
}

// 日数調整ダイアログ
interface DaysAdjustDialogProps {
  isOpen: boolean;
  selectedCount: number;
  onConfirm: (days: number) => void;
  onCancel: () => void;
}

function DaysAdjustDialog({ isOpen, selectedCount, onConfirm, onCancel }: DaysAdjustDialogProps) {
  const [days, setDays] = useState<number>(30);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-lg font-bold mb-2">トライアル日数を調整</h3>
        <p className="text-gray-600 mb-4">選択中: {selectedCount}人のトライアルユーザー</p>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            新しい残り日数（1〜120日）
          </label>
          <input
            type="number"
            min={1}
            max={120}
            value={days}
            onChange={(e) => setDays(Math.min(120, Math.max(1, parseInt(e.target.value) || 1)))}
            className="w-full px-4 py-2 border rounded-lg text-lg text-center"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            キャンセル
          </button>
          <button 
            onClick={() => onConfirm(days)} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            適用する
          </button>
        </div>
      </div>
    </div>
  );
}

// ツールチップ
function Tooltip({ children, content }: { children: React.ReactNode; content: React.ReactNode }) {
  const [show, setShow] = useState(false);
  
  return (
    <div className="relative inline-flex items-center">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {show && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50">
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-[-1px]">
            <div className="border-4 border-transparent border-b-gray-900"></div>
          </div>
          <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg min-w-max">
            {content}
          </div>
        </div>
      )}
    </div>
  );
}

type SortField = 'display_name' | 'plan_type' | 'trial_ends_at' | 'engagementScore' | 'churnRisk' | 'is_alumni' | 'last_login_at';
type SortOrder = 'asc' | 'desc';

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [kpis, setKpis] = useState<KPIs>({ total: 0, trial: 0, paidMonthly: 0, paidYearly: 0, superUser: 0, highRisk: 0, alumniPending: 0 });
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('engagementScore');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({ isOpen: false, title: '', message: '', action: () => {} });

  const [daysAdjustDialog, setDaysAdjustDialog] = useState(false);

  const [UserDetailModal, setUserDetailModal] = useState<any>(null);

  useEffect(() => {
    import('@/components/UserDetailModal').then(mod => {
      setUserDetailModal(() => mod.default);
    });
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setKpis(data.kpis || { total: 0, trial: 0, paidMonthly: 0, paidYearly: 0, superUser: 0, highRisk: 0, alumniPending: 0 });
        setCurrentUserId(data.currentUserId || '');
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedUsers = users
    .filter(user => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!user.email.toLowerCase().includes(query) && 
            !(user.display_name?.toLowerCase().includes(query))) {
          return false;
        }
      }
      switch (activeFilter) {
        case 'trial': return user.plan_type === 'trial' && !user.is_super_user;
        case 'paidMonthly': return user.plan_type === 'paid' && user.subscription_type === 'monthly' && !user.is_super_user;
        case 'paidYearly': return user.plan_type === 'paid' && user.subscription_type === 'yearly' && !user.is_super_user;
        case 'super': return user.is_super_user;
        case 'highRisk': return user.churnRisk === 'high';
        case 'alumniPending': return user.is_alumni && !user.alumni_approved_at;
        default: return true;
      }
    })
    .sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortField) {
        case 'display_name':
          aVal = a.display_name || a.email;
          bVal = b.display_name || b.email;
          break;
        case 'plan_type':
          const planOrder = { super: 0, paid: 1, trial: 2 };
          aVal = a.is_super_user ? planOrder.super : planOrder[a.plan_type as keyof typeof planOrder] || 3;
          bVal = b.is_super_user ? planOrder.super : planOrder[b.plan_type as keyof typeof planOrder] || 3;
          break;
        case 'trial_ends_at':
          aVal = a.is_super_user ? Infinity : new Date(a.trial_ends_at).getTime();
          bVal = b.is_super_user ? Infinity : new Date(b.trial_ends_at).getTime();
          break;
        case 'engagementScore':
          aVal = a.engagementScore ?? -1;
          bVal = b.engagementScore ?? -1;
          break;
        case 'churnRisk':
          const riskOrder = { high: 0, medium: 1, low: 2, null: 3 };
          aVal = riskOrder[a.churnRisk || 'null'];
          bVal = riskOrder[b.churnRisk || 'null'];
          break;
        case 'is_alumni':
          aVal = a.is_alumni ? (a.alumni_batch_number || 0) : 999;
          bVal = b.is_alumni ? (b.alumni_batch_number || 0) : 999;
          break;
        case 'last_login_at':
          aVal = a.last_login_at ? new Date(a.last_login_at).getTime() : 0;
          bVal = b.last_login_at ? new Date(b.last_login_at).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const toggleSelectUser = (userId: string) => {
    const newSet = new Set(selectedUserIds);
    if (newSet.has(userId)) {
      newSet.delete(userId);
    } else {
      newSet.add(userId);
    }
    setSelectedUserIds(newSet);
  };

  const toggleSelectAll = () => {
    const selectableUsers = filteredAndSortedUsers.filter(u => !u.is_super_user);
    if (selectedUserIds.size === selectableUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(selectableUsers.map(u => u.id)));
    }
  };

  const showConfirmAndExecute = (title: string, message: string, action: () => Promise<void>) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      action: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        await action();
      }
    });
  };

  const handleBulkAction = async (action: string, value?: any) => {
    if (selectedUserIds.size === 0) return;
    
    const count = selectedUserIds.size;
    let title = '';
    let message = '';
    
    switch (action) {
      case 'extendTrial':
        title = 'トライアル30日延長';
        message = `選択した${count}人のユーザーのトライアル期間を30日延長しますか？`;
        break;
      case 'approveAlumni':
        title = 'SAAアルムナイ認定';
        message = `選択した${count}人のユーザーをSAAアルムナイとして認定し、90日延長しますか？`;
        break;
      default:
        return;
    }
    
    showConfirmAndExecute(title, message, async () => {
      setActionLoading(true);
      try {
        const res = await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: Array.from(selectedUserIds), action, value }),
        });
        if (res.ok) {
          await fetchUsers();
          setSelectedUserIds(new Set());
        }
      } catch (error) {
        console.error('Failed to perform bulk action:', error);
      } finally {
        setActionLoading(false);
      }
    });
  };

  const handleSetTrialDays = async (days: number) => {
    setDaysAdjustDialog(false);
    if (selectedUserIds.size === 0) return;
    
    const count = selectedUserIds.size;
    showConfirmAndExecute(
      'トライアル日数を調整',
      `選択した${count}人のユーザーの残り日数を${days}日に設定しますか？`,
      async () => {
        setActionLoading(true);
        try {
          const res = await fetch('/api/admin/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userIds: Array.from(selectedUserIds), action: 'setTrialDays', value: days }),
          });
          if (res.ok) {
            await fetchUsers();
            setSelectedUserIds(new Set());
          }
        } catch (error) {
          console.error('Failed to set trial days:', error);
        } finally {
          setActionLoading(false);
        }
      }
    );
  };

  const handleAction = async (userId: string, action: string, value?: any) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, value }),
      });
      if (res.ok) {
        await fetchUsers();
      }
    } catch (error) {
      console.error('Failed to perform action:', error);
    }
  };

  const getDaysRemaining = (trialEndsAt: string) => {
    const now = new Date();
    const end = new Date(trialEndsAt);
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ja-JP', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShortDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getRiskBadge = (risk: string | null) => {
    switch (risk) {
      case 'high':
        return <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">🔴 高</span>;
      case 'medium':
        return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">🟡 中</span>;
      case 'low':
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">🟢 低</span>;
      default:
        return <span className="text-gray-400 text-xs">-</span>;
    }
  };

  const getPlanBadge = (user: User) => {
    if (user.is_super_user) {
      return <span className="text-yellow-600 font-medium">⭐ スーパー</span>;
    }
    if (user.plan_type === 'paid') {
      if (user.subscription_type === 'yearly') {
        return <span className="text-purple-600 font-medium">🟣 年額</span>;
      }
      return <span className="text-green-600 font-medium">🟢 月額</span>;
    }
    return <span className="text-blue-600 font-medium">🔵 トライアル</span>;
  };

  const getPeriodInfo = (user: User) => {
    if (user.is_super_user) {
      return <span className="text-gray-400">-</span>;
    }
    
    if (user.plan_type === 'paid') {
      return (
        <div className="text-xs">
          <div>転換: {formatShortDate(user.paid_at)}</div>
          <div className="text-gray-500">更新: {formatShortDate(user.next_renewal_at)}</div>
        </div>
      );
    }
    
    const daysRemaining = getDaysRemaining(user.trial_ends_at);
    return (
      <div className="text-xs">
        <div className={daysRemaining <= 7 ? 'text-red-600 font-medium' : ''}>
          残り{daysRemaining}日
        </div>
        <div className="text-gray-500">終了: {formatShortDate(user.trial_ends_at)}</div>
      </div>
    );
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronUp className="w-3 h-3 text-gray-300" />;
    }
    return sortOrder === 'asc' 
      ? <ChevronUp className="w-3 h-3 text-blue-500" />
      : <ChevronDown className="w-3 h-3 text-blue-500" />;
  };

  const HeaderWithTooltip = ({ 
    label, 
    tooltip, 
    field,
    center = false 
  }: { 
    label: string; 
    tooltip: React.ReactNode; 
    field: SortField;
    center?: boolean;
  }) => (
    <th 
      className="py-3 px-2 cursor-pointer hover:bg-gray-100"
      onClick={() => handleSort(field)}
    >
      <div className={`flex items-center gap-1 ${center ? 'justify-center' : ''}`}>
        <span className="text-xs whitespace-nowrap">{label}</span>
        <Tooltip content={tooltip}>
          <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
        </Tooltip>
        <SortIcon field={field} />
      </div>
    </th>
  );

  // 選択中のトライアルユーザー数
  const selectedTrialCount = Array.from(selectedUserIds).filter(id => {
    const user = users.find(u => u.id === id);
    return user && user.plan_type === 'trial' && !user.is_super_user;
  }).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> 管理者ダッシュボードに戻る
            </Link>
            <Link 
              href="/admin/email" 
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Inbox className="w-4 h-4" /> メール管理
            </Link>
          </div>
          <h1 className="text-2xl font-bold">ユーザー管理ダッシュボード</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* KPIカード */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <button
            onClick={() => setActiveFilter('all')}
            className={`p-3 rounded-lg border text-left transition ${
              activeFilter === 'all' ? 'bg-blue-50 border-blue-300' : 'bg-white hover:bg-gray-50'
            }`}
            title="クリックでフィルター"
          >
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <Users className="w-3 h-3" /> 全ユーザー
            </div>
            <div className="text-xl font-bold">{kpis.total}</div>
          </button>

          <button
            onClick={() => setActiveFilter('trial')}
            className={`p-3 rounded-lg border text-left transition ${
              activeFilter === 'trial' ? 'bg-blue-50 border-blue-300' : 'bg-white hover:bg-gray-50'
            }`}
            title="クリックでフィルター"
          >
            <div className="flex items-center gap-1 text-xs text-blue-600 mb-1">
              <Clock className="w-3 h-3" /> トライアル
            </div>
            <div className="text-xl font-bold">{kpis.trial}</div>
          </button>

          <button
            onClick={() => setActiveFilter('paidMonthly')}
            className={`p-3 rounded-lg border text-left transition ${
              activeFilter === 'paidMonthly' ? 'bg-green-50 border-green-300' : 'bg-white hover:bg-gray-50'
            }`}
            title="クリックでフィルター"
          >
            <div className="flex items-center gap-1 text-xs text-green-600 mb-1">
              <CreditCard className="w-3 h-3" /> 月額有料
            </div>
            <div className="text-xl font-bold">{kpis.paidMonthly}</div>
          </button>

          <button
            onClick={() => setActiveFilter('paidYearly')}
            className={`p-3 rounded-lg border text-left transition ${
              activeFilter === 'paidYearly' ? 'bg-purple-50 border-purple-300' : 'bg-white hover:bg-gray-50'
            }`}
            title="クリックでフィルター"
          >
            <div className="flex items-center gap-1 text-xs text-purple-600 mb-1">
              <CreditCard className="w-3 h-3" /> 年額有料
            </div>
            <div className="text-xl font-bold">{kpis.paidYearly}</div>
          </button>

          <button
            onClick={() => setActiveFilter('super')}
            className={`p-3 rounded-lg border text-left transition ${
              activeFilter === 'super' ? 'bg-yellow-50 border-yellow-300' : 'bg-white hover:bg-gray-50'
            }`}
            title="クリックでフィルター"
          >
            <div className="flex items-center gap-1 text-xs text-yellow-600 mb-1">
              <Star className="w-3 h-3" /> スーパー
            </div>
            <div className="text-xl font-bold">{kpis.superUser}</div>
          </button>

          <button
            onClick={() => setActiveFilter('highRisk')}
            className={`p-3 rounded-lg border text-left transition ${
              activeFilter === 'highRisk' ? 'bg-red-50 border-red-300' : 'bg-white hover:bg-gray-50'
            }`}
            title="クリックでフィルター"
          >
            <div className="flex items-center gap-1 text-xs text-red-600 mb-1">
              <AlertTriangle className="w-3 h-3" /> 解約リスク高
            </div>
            <div className="text-xl font-bold">{kpis.highRisk}</div>
            {kpis.highRisk > 0 && <div className="text-xs text-red-500">要対応!</div>}
          </button>

          <button
            onClick={() => setActiveFilter('alumniPending')}
            className={`p-3 rounded-lg border text-left transition ${
              activeFilter === 'alumniPending' ? 'bg-purple-50 border-purple-300' : 'bg-white hover:bg-gray-50'
            }`}
            title="クリックでフィルター"
          >
            <div className="flex items-center gap-1 text-xs text-purple-600 mb-1">
              <GraduationCap className="w-3 h-3" /> SAA申請
            </div>
            <div className="text-xl font-bold">{kpis.alumniPending}</div>
            {kpis.alumniPending > 0 && <div className="text-xs text-purple-500">承認待ち</div>}
          </button>
        </div>

        {/* 一括操作バー */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              {/* 選択件数バッジ */}
              <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                selectedUserIds.size > 0 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {selectedUserIds.size > 0 ? `${selectedUserIds.size}件選択中` : '選択なし'}
              </div>
              
              <div className="h-6 w-px bg-gray-200"></div>
              
              {/* アクションボタン */}
              <button
                onClick={() => setDaysAdjustDialog(true)}
                disabled={selectedTrialCount === 0 || actionLoading}
                className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 border transition ${
                  selectedTrialCount > 0 
                    ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50' 
                    : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" /> トライアル日数調整
              </button>
              <button
                onClick={() => handleBulkAction('extendTrial', 30)}
                disabled={selectedTrialCount === 0 || actionLoading}
                className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 border transition ${
                  selectedTrialCount > 0 
                    ? 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100' 
                    : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" /> トライアル30日延長
              </button>
              <button
                onClick={() => handleBulkAction('approveAlumni')}
                disabled={selectedUserIds.size === 0 || actionLoading}
                className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 border transition ${
                  selectedUserIds.size > 0 
                    ? 'border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100' 
                    : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" /> SAAアルムナイ認定（90日延長）
              </button>
              
              <div className="h-6 w-px bg-gray-200"></div>
              
              {/* 新規メール作成ボタン - 目立つように */}
              <button
                onClick={() => {
                  if (selectedUserIds.size > 0) {
                    window.location.href = `/admin/email/compose?userIds=${Array.from(selectedUserIds).join(',')}`;
                  }
                }}
                disabled={selectedUserIds.size === 0 || actionLoading}
                className={`px-4 py-1.5 rounded-lg text-xs flex items-center gap-1.5 font-medium transition ${
                  selectedUserIds.size > 0 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Mail className="w-3.5 h-3.5" /> 新規メール作成
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-1.5 border rounded-lg text-sm w-40"
                />
              </div>
              <button
                onClick={fetchUsers}
                disabled={isLoading}
                className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm flex items-center gap-1 hover:bg-gray-200"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> 更新
              </button>
            </div>
          </div>
        </div>

        {/* ユーザーテーブル */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="py-3 px-2 text-left w-10">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.size === filteredAndSortedUsers.filter(u => !u.is_super_user).length && filteredAndSortedUsers.filter(u => !u.is_super_user).length > 0}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th 
                    className="py-3 px-2 text-left cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('display_name')}
                  >
                    <div className="flex items-center gap-1 text-xs">
                      ユーザー <SortIcon field="display_name" />
                    </div>
                  </th>
                  <th 
                    className="py-3 px-2 text-left cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('plan_type')}
                  >
                    <div className="flex items-center gap-1 text-xs">
                      プラン <SortIcon field="plan_type" />
                    </div>
                  </th>
                  <HeaderWithTooltip
                    label="期間情報"
                    tooltip={
                      <div className="text-left max-w-xs">
                        <div className="font-bold mb-1">期間情報</div>
                        <div className="text-xs">
                          <div className="mb-1">【トライアル】</div>
                          <div>• 残り日数と終了日</div>
                          <div className="mt-1 mb-1">【有料会員】</div>
                          <div>• 転換日: 有料会員になった日</div>
                          <div>• 更新日: 次回自動更新日</div>
                        </div>
                      </div>
                    }
                    field="trial_ends_at"
                  />
                  <HeaderWithTooltip
                    label="スコア"
                    tooltip={
                      <div className="text-left max-w-xs">
                        <div className="font-bold mb-1">エンゲージメントスコア</div>
                        <div className="text-xs">
                          過去7日間のアクティビティから算出<br/>
                          • ログイン: 10点/回<br/>
                          • 動画視聴: 5点/本<br/>
                          • 記事閲覧: 5点/件<br/>
                          • 検索: 2点/回<br/>
                          • ブックマーク: 3点/件
                        </div>
                      </div>
                    }
                    field="engagementScore"
                    center
                  />
                  <HeaderWithTooltip
                    label="解約リスク"
                    tooltip={
                      <div className="text-left">
                        <div className="font-bold mb-1">解約リスク判定</div>
                        <div className="text-xs">
                          🔴 高: 10点以下<br/>
                          🟡 中: 11〜20点<br/>
                          🟢 低: 21点以上
                        </div>
                      </div>
                    }
                    field="churnRisk"
                    center
                  />
                  <HeaderWithTooltip
                    label="SAAアルムナイ"
                    tooltip={
                      <div className="text-left">
                        <div className="font-bold mb-1">SAAアルムナイ</div>
                        <div className="text-xs">
                          Startup Accelerator Academy卒業生<br/>
                          • 期: 卒業期<br/>
                          • ✓: 認定済み<br/>
                          • 申請中: 承認待ち
                        </div>
                      </div>
                    }
                    field="is_alumni"
                    center
                  />
                  <th 
                    className="py-3 px-2 text-center cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('last_login_at')}
                  >
                    <div className="flex items-center justify-center gap-1 text-xs">
                      最終ログイン <SortIcon field="last_login_at" />
                    </div>
                  </th>
                  <th className="py-3 px-2 text-center text-xs">詳細</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2">
                      {!user.is_super_user ? (
                        <input
                          type="checkbox"
                          checked={selectedUserIds.has(user.id)}
                          onChange={() => toggleSelectUser(user.id)}
                          className="rounded"
                        />
                      ) : (
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <div>
                        <div className="font-medium flex items-center gap-2 text-sm">
                          {user.display_name || '(名前未設定)'}
                          {user.id === currentUserId && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">自分</span>
                          )}
                        </div>
                        <div className="text-gray-500 text-xs">{user.email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      {getPlanBadge(user)}
                    </td>
                    <td className="py-3 px-2">
                      {getPeriodInfo(user)}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {user.engagementScore !== null ? (
                        <span className={`font-medium ${
                          user.engagementScore <= 10 ? 'text-red-600' :
                          user.engagementScore <= 20 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {user.engagementScore}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {getRiskBadge(user.churnRisk)}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {user.is_alumni ? (
                        <div className="flex flex-col items-center">
                          <span className="text-purple-600 flex items-center gap-1 text-xs">
                            <GraduationCap className="w-3 h-3" />
                            {user.alumni_batch_number}期
                          </span>
                          {user.alumni_approved_at ? (
                            <span className="text-green-600 text-xs">✓</span>
                          ) : (
                            <span className="text-orange-500 text-xs">申請中</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center text-xs text-gray-500">
                      {formatDate(user.last_login_at)}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => setSelectedUserId(user.id)}
                        className="px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-xs whitespace-nowrap"
                      >
                        詳細を見る
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAndSortedUsers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              該当するユーザーがいません
            </div>
          )}
        </div>
      </div>

      {/* 確認ダイアログ */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />

      {/* 日数調整ダイアログ */}
      <DaysAdjustDialog
        isOpen={daysAdjustDialog}
        selectedCount={selectedTrialCount}
        onConfirm={handleSetTrialDays}
        onCancel={() => setDaysAdjustDialog(false)}
      />

      {/* ユーザー詳細モーダル */}
      {selectedUserId && UserDetailModal && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
}
