'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function EmailSettingsPage() {
  const [currentEmail, setCurrentEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    fetchCurrentEmail();
  }, []);

  const fetchCurrentEmail = async () => {
    try {
      const res = await fetch('/api/mypage/profile');
      if (res.ok) {
        const data = await res.json();
        setCurrentEmail(data.profile?.email || '');
      }
    } catch (error) {
      console.error('Failed to fetch email:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // バリデーション
    if (!validateEmail(newEmail)) {
      setMessage({ type: 'error', text: '有効なメールアドレスを入力してください' });
      return;
    }

    if (newEmail !== confirmEmail) {
      setMessage({ type: 'error', text: 'メールアドレスが一致しません' });
      return;
    }

    if (newEmail === currentEmail) {
      setMessage({ type: 'error', text: '現在と同じメールアドレスです' });
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/mypage/email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ 
          type: 'info', 
          text: '確認メールを送信しました。メール内のリンクをクリックして変更を完了してください。' 
        });
        setNewEmail('');
        setConfirmEmail('');
      } else {
        setMessage({ type: 'error', text: data.error || 'メールアドレスの変更に失敗しました' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'エラーが発生しました' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">メールアドレス設定</h1>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 
          message.type === 'info' ? 'bg-blue-50 text-blue-700' :
          'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-md">
        {/* 現在のメールアドレス */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            現在のメールアドレス
          </label>
          <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
            {currentEmail || '未設定'}
          </div>
        </div>

        {/* 新しいメールアドレス */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            新しいメールアドレス
          </label>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="example@email.com"
          />
        </div>

        {/* 確認用 */}
        <div className="mb-8">
          <label className="block text-gray-700 font-medium mb-2">
            確認
          </label>
          <input
            type="email"
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              confirmEmail && confirmEmail !== newEmail
                ? 'border-red-500'
                : 'border-gray-300'
            }`}
            placeholder="確認のため再度入力"
          />
          {confirmEmail && confirmEmail !== newEmail && (
            <p className="mt-1 text-sm text-red-600">メールアドレスが一致しません</p>
          )}
        </div>

        {/* 送信ボタン */}
        <button
          type="submit"
          disabled={saving || !newEmail || newEmail !== confirmEmail}
          className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              送信中...
            </>
          ) : (
            '送信する'
          )}
        </button>

        <p className="mt-4 text-sm text-gray-500">
          ※ 新しいメールアドレスに確認メールが送信されます。<br />
          メール内のリンクをクリックすると変更が完了します。
        </p>
      </form>
    </div>
  );
}
