'use client';

import React, { useState, useEffect } from 'react';
import { GraduationCap, CheckCircle, Clock, XCircle, Loader2, AlertCircle } from 'lucide-react';

interface Batch {
  batch_number: number;
  name: string;
}

interface AlumniStatus {
  id: string;
  batch_number: number;
  status: 'pending' | 'approved' | 'rejected';
  applied_at: string;
  approved_at: string | null;
  rejection_reason: string | null;
}

interface Profile {
  is_alumni: boolean;
  alumni_batch_number: number | null;
  signed_up_at: string;
}

export default function AlumniSettingsPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [alumniStatus, setAlumniStatus] = useState<AlumniStatus | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // バッチ一覧を取得
      const batchRes = await fetch('/api/alumni/batches');
      if (batchRes.ok) {
        const batchData = await batchRes.json();
        setBatches(batchData.batches);
      }

      // アルムナイステータスを取得
      const statusRes = await fetch('/api/alumni/status');
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setAlumniStatus(statusData.alumni);
        setProfile(statusData.profile);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!selectedBatch) {
      setMessage({ type: 'error', text: '卒業バッチを選択してください' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/alumni/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch_number: selectedBatch }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: '申請を送信しました。審査結果をお待ちください。' });
        fetchData(); // データを再取得
      } else {
        setMessage({ type: 'error', text: data.error || '申請に失敗しました' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'エラーが発生しました' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800">
            <Clock className="w-4 h-4" />
            審査中
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4" />
            承認済み
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-800">
            <XCircle className="w-4 h-4" />
            却下
          </span>
        );
      default:
        return null;
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
      <div className="flex items-center gap-3 mb-6">
        <GraduationCap className="w-8 h-8 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">SAAアルムナイ</h1>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-700' :
          message.type === 'info' ? 'bg-blue-50 text-blue-700' :
          'bg-red-50 text-red-700'
        }`}>
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* 既にアルムナイ認定済みの場合 */}
      {profile?.is_alumni && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-200">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">SAAアルムナイ認定済み</h2>
              <p className="text-gray-600">
                {batches.find(b => b.batch_number === profile.alumni_batch_number)?.name || `第${profile.alumni_batch_number}期`} 卒業
              </p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-white rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">特典</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ サインアップから3ヶ月間無料（条件あり）</li>
              <li>✓ アルムナイ限定コンテンツへのアクセス</li>
              <li>✓ コミュニティイベントへの優先参加</li>
            </ul>
          </div>
        </div>
      )}

      {/* 申請済みの場合 */}
      {alumniStatus && !profile?.is_alumni && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">申請状況</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">ステータス</span>
              {getStatusBadge(alumniStatus.status)}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">申請バッチ</span>
              <span className="font-medium">
                {batches.find(b => b.batch_number === alumniStatus.batch_number)?.name || `第${alumniStatus.batch_number}期`}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">申請日</span>
              <span>{new Date(alumniStatus.applied_at).toLocaleDateString('ja-JP')}</span>
            </div>

            {alumniStatus.status === 'approved' && alumniStatus.approved_at && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">承認日</span>
                <span>{new Date(alumniStatus.approved_at).toLocaleDateString('ja-JP')}</span>
              </div>
            )}

            {alumniStatus.status === 'rejected' && alumniStatus.rejection_reason && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg">
                <p className="text-sm font-medium text-red-800">却下理由</p>
                <p className="text-sm text-red-700 mt-1">{alumniStatus.rejection_reason}</p>
              </div>
            )}
          </div>

          {alumniStatus.status === 'rejected' && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600 mb-4">
                却下された場合でも、再度申請することができます。
              </p>
              <button
                onClick={() => setAlumniStatus(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                再申請する
              </button>
            </div>
          )}
        </div>
      )}

      {/* 未申請の場合：申請フォーム */}
      {!alumniStatus && !profile?.is_alumni && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">SAAアルムナイ申請</h2>
          <p className="text-gray-600 mb-6">
            Startup Accelerator Academy（SAA）の卒業生の方は、アルムナイ特典を受けることができます。
          </p>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2">アルムナイ特典</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• サインアップから3ヶ月間無料でご利用いただけます</li>
              <li>• ※ サインアップから1ヶ月以内にアルムナイ認定された場合は対象外</li>
            </ul>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              卒業バッチを選択 <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedBatch || ''}
              onChange={(e) => setSelectedBatch(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">選択してください</option>
              {batches.map((batch) => (
                <option key={batch.batch_number} value={batch.batch_number}>
                  {batch.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">
              申請後、管理者による審査が行われます。審査には数日かかる場合があります。
              ご登録のメールアドレスに結果をお知らせします。
            </p>
          </div>

          <button
            onClick={handleApply}
            disabled={submitting || !selectedBatch}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                申請中...
              </>
            ) : (
              '申請する'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
