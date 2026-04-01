'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StudentLayout } from '@/components/student/StudentLayout';
import {
  User,
  Shield,
  Loader2,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

type TabType = 'profile' | 'security';

export default function MyPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="flex min-h-[calc(100vh-64px)]">
        <aside className="w-56 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
          <div className="py-3 px-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">
              マイページ
            </p>
            <nav className="space-y-0.5">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-2 px-2 py-2 text-[13px] rounded-md transition ${
                  activeTab === 'profile'
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <User className="w-3.5 h-3.5 flex-shrink-0" />
                <span>プロフィール</span>
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center gap-2 px-2 py-2 text-[13px] rounded-md transition ${
                  activeTab === 'security'
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Shield className="w-3.5 h-3.5 flex-shrink-0" />
                <span>セキュリティ</span>
              </button>
            </nav>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-8 py-8">
            {activeTab === 'profile' && <ProfileTab user={user} profile={profile} />}
            {activeTab === 'security' && <SecurityTab />}
          </div>
        </main>
      </div>
    </StudentLayout>
  );
}

function ProfileTab({ user, profile }: { user: any; profile: any }) {
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'プロフィールを更新しました' });
      } else {
        setMessage({ type: 'error', text: '更新に失敗しました' });
      }
    } catch {
      setMessage({ type: 'error', text: '更新に失敗しました' });
    }
    setSaving(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">プロフィール</h1>
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl font-bold">
          {(profile?.display_name || user?.email || '?').charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900">{profile?.display_name || '名前未設定'}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
      </div>
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">表示名</label>
          <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">メールアドレス</label>
          <input type="email" value={user?.email || ''} disabled className="w-full px-3 py-2.5 border border-gray-100 rounded-lg text-sm bg-gray-50 text-gray-500" />
          <p className="text-xs text-gray-400 mt-1">メールアドレスは変更できません</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">ロール</label>
          <input type="text" value={profile?.saa_role === 'admin' ? '管理者' : profile?.saa_role === 'ta' ? 'TA' : '受講生'} disabled className="w-full px-3 py-2.5 border border-gray-100 rounded-lg text-sm bg-gray-50 text-gray-500" />
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition text-sm font-medium">
          <Save className="w-4 h-4" />
          {saving ? '保存中...' : '保存する'}
        </button>
        {message && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}

function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) { setMessage({ type: 'error', text: '新しいパスワードが一致しません' }); return; }
    if (newPassword.length < 6) { setMessage({ type: 'error', text: 'パスワードは6文字以上にしてください' }); return; }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/profile/password', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: newPassword }) });
      if (res.ok) { setMessage({ type: 'success', text: 'パスワードを変更しました' }); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }
      else { setMessage({ type: 'error', text: '変更に失敗しました' }); }
    } catch { setMessage({ type: 'error', text: '変更に失敗しました' }); }
    setSaving(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">セキュリティ</h1>
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">現在のパスワード</label>
          <div className="relative">
            <input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 pr-10" />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">新しいパスワード</label>
          <div className="relative">
            <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 pr-10" />
            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">新しいパスワード（確認）</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400" />
        </div>
        <button onClick={handleChangePassword} disabled={saving || !newPassword || !confirmPassword} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition text-sm font-medium">
          <Shield className="w-4 h-4" />
          {saving ? '変更中...' : 'パスワードを変更'}
        </button>
        {message && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
