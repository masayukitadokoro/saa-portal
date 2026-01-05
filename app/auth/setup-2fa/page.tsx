'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { useAuth } from '@/components/AuthProvider';

export default function Setup2FAPage() {
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [factorId, setFactorId] = useState('');
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    if (data?.totp && data.totp.length > 0) {
      setIsEnabled(true);
      setFactorId(data.totp[0].id);
    }
  };

  const startEnroll = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: '動画検索アプリ',
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data) {
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setFactorId(data.id);
      }
    } catch (err) {
      setError('2FA設定の開始に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data: challengeData, error: challengeError } = 
        await supabase.auth.mfa.challenge({ factorId });

      if (challengeError) {
        setError(challengeError.message);
        return;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode,
      });

      if (verifyError) {
        setError('認証コードが正しくありません');
        return;
      }

      setIsEnabled(true);
      setQrCode('');
      setSecret('');
    } catch (err) {
      setError('2FAの有効化に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const disable2FA = async () => {
    if (!confirm('2段階認証を無効にしますか？')) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) {
        setError(error.message);
      } else {
        setIsEnabled(false);
        setFactorId('');
      }
    } catch (err) {
      setError('2FAの無効化に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>ログインしてください</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
          2段階認証設定
        </h2>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
            {error}
          </div>
        )}

        {isEnabled ? (
          // 2FA有効時
          <div className="text-center">
            <div className="text-5xl mb-4">🔒</div>
            <p className="text-green-600 font-medium mb-6">
              2段階認証が有効です
            </p>
            <button
              onClick={disable2FA}
              disabled={isLoading}
              className="px-6 py-2 text-red-600 border border-red-300 rounded-lg 
                       hover:bg-red-50 disabled:opacity-50"
            >
              {isLoading ? '処理中...' : '2FAを無効にする'}
            </button>
          </div>
        ) : qrCode ? (
          // QRコード表示・確認
          <div>
            <p className="text-gray-600 mb-4 text-center">
              認証アプリ（Google Authenticator等）でQRコードをスキャンしてください
            </p>
            
            <div className="flex justify-center mb-6">
              <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
            </div>

            <div className="mb-6 p-3 bg-gray-100 rounded text-center">
              <p className="text-xs text-gray-500 mb-1">手動入力用シークレット</p>
              <code className="text-sm break-all">{secret}</code>
            </div>

            <form onSubmit={verifyAndEnable} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  認証アプリに表示された6桁のコード
                </label>
                <input
                  type="text"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 text-center text-xl tracking-widest 
                           border border-gray-300 rounded-lg 
                           focus:ring-2 focus:ring-blue-500"
                  placeholder="000000"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || verifyCode.length !== 6}
                className="w-full py-3 bg-blue-600 text-white rounded-lg 
                         hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isLoading ? '確認中...' : '2FAを有効にする'}
              </button>
            </form>
          </div>
        ) : (
          // 初期状態
          <div className="text-center">
            <div className="text-5xl mb-4">🔐</div>
            <p className="text-gray-600 mb-6">
              2段階認証を設定すると、ログイン時に認証アプリのコードが必要になり、
              セキュリティが向上します。
            </p>
            <button
              onClick={startEnroll}
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg 
                       hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? '準備中...' : '2FAを設定する'}
            </button>
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-gray-500 hover:text-gray-700"
          >
            ← ホームに戻る
          </button>
        </div>
      </div>
    </div>
  );
}
