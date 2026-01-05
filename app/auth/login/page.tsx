'use client';

import { useState } from 'react';
import { track } from '@/lib/tracking';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [needsMFA, setNeedsMFA] = useState(false);
  const [factorId, setFactorId] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }

      // MFAが必要かチェック
      if (data.session) {
        const { data: factorsData } = await supabase.auth.mfa.listFactors();
        
        if (factorsData?.totp && factorsData.totp.length > 0) {
          // MFA認証が必要
          const factor = factorsData.totp[0];
          setFactorId(factor.id);
          setNeedsMFA(true);
          setIsLoading(false);
          return;
        }
      }

      // MFA不要の場合はホームへ
      track.login();
      router.push('/');
      router.refresh();
    } catch (err) {
      setError('ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMFAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data: challengeData, error: challengeError } = 
        await supabase.auth.mfa.challenge({ factorId });

      if (challengeError) {
        setError(challengeError.message);
        setIsLoading(false);
        return;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: totpCode,
      });

      if (verifyError) {
        setError('認証コードが正しくありません');
        setIsLoading(false);
        return;
      }

      track.login();
      router.push('/');
      router.refresh();
    } catch (err) {
      setError('2段階認証に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 2段階認証フォーム
  if (needsMFA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
            2段階認証
          </h2>
          <p className="text-center text-gray-600 mb-8">
            認証アプリに表示されている6桁のコードを入力してください
          </p>

          <form onSubmit={handleMFAVerify} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                {error}
              </div>
            )}

            <div>
              <input
                type="text"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                className="w-full px-4 py-4 text-center text-2xl tracking-widest 
                         border border-gray-300 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="000000"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || totpCode.length !== 6}
              className="w-full py-3 bg-blue-600 text-white rounded-lg 
                       hover:bg-blue-700 disabled:bg-gray-400 
                       transition-colors font-medium"
            >
              {isLoading ? '確認中...' : '確認'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 通常ログインフォーム
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
          ログイン
        </h2>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg 
                     hover:bg-blue-700 disabled:bg-gray-400 
                     transition-colors font-medium"
          >
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          アカウントをお持ちでないですか？{' '}
          <Link href="/auth/signup" className="text-blue-600 hover:underline">
            サインアップ
          </Link>
        </p>
      </div>
    </div>
  );
}
