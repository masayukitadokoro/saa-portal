'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function PasswordSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // パスワード強度チェック
  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const maxLength = password.length <= 20;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return { minLength, maxLength, hasLetter, hasNumber, isValid: minLength && maxLength && hasLetter && hasNumber };
  };

  const passwordValidation = validatePassword(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // バリデーション
    if (!currentPassword) {
      setMessage({ type: 'error', text: '現在のパスワードを入力してください' });
      return;
    }

    if (!passwordValidation.isValid) {
      setMessage({ type: 'error', text: 'パスワードの要件を満たしていません' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: '新しいパスワードが一致しません' });
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/mypage/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'パスワードを変更しました' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: data.error || 'パスワードの変更に失敗しました' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'エラーが発生しました' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <Link 
        href="/mypage/settings/profile" 
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        ユーザ情報
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">パスワード設定</h1>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-md">
        {/* 現在のパスワード */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            現在のパスワード
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
              placeholder="現在のパスワードを入力"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <div className="mt-2 text-right">
            <Link href="/auth/reset-password" className="text-sm text-blue-600 hover:underline">
              パスワード未登録、または忘れた方はこちら
            </Link>
          </div>
        </div>

        {/* 新しいパスワード */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            新しいパスワード
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
              placeholder="新しいパスワードを入力"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            <p className={passwordValidation.minLength && passwordValidation.maxLength ? 'text-green-600' : ''}>
              ※半角英数含む8-20文字
            </p>
          </div>
          {/* パスワード強度インジケーター */}
          {newPassword && (
            <div className="mt-2 space-y-1">
              <div className="flex gap-2 text-xs">
                <span className={passwordValidation.minLength ? 'text-green-600' : 'text-gray-400'}>
                  ✓ 8文字以上
                </span>
                <span className={passwordValidation.maxLength ? 'text-green-600' : 'text-gray-400'}>
                  ✓ 20文字以下
                </span>
                <span className={passwordValidation.hasLetter ? 'text-green-600' : 'text-gray-400'}>
                  ✓ 英字を含む
                </span>
                <span className={passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-400'}>
                  ✓ 数字を含む
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 新しいパスワード（確認用） */}
        <div className="mb-8">
          <label className="block text-gray-700 font-medium mb-2">
            新しいパスワード（確認用）
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 ${
                confirmPassword && confirmPassword !== newPassword
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
              placeholder="新しいパスワードを入力（確認用）"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {confirmPassword && confirmPassword !== newPassword && (
            <p className="mt-1 text-sm text-red-600">パスワードが一致しません</p>
          )}
        </div>

        {/* 保存ボタン */}
        <button
          type="submit"
          disabled={saving || !passwordValidation.isValid || newPassword !== confirmPassword}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              保存中...
            </>
          ) : (
            '保存する'
          )}
        </button>
      </form>
    </div>
  );
}
