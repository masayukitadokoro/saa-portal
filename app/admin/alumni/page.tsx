'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  Upload,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  X
} from 'lucide-react';

interface Alumni {
  id: string;
  user_id: string;
  batch_number: number;
  status: 'pending' | 'approved' | 'rejected';
  applied_at: string;
  approved_at: string | null;
  rejection_reason: string | null;
  profiles: {
    display_name: string | null;
    email: string | null;
  } | null;
  saa_batches: {
    name: string;
  } | null;
}

interface AlumniMaster {
  id: string;
  email: string;
  name: string;
  batch_number: number;
  saa_batches: {
    name: string;
  } | null;
}

export default function AdminAlumniPage() {
  const [activeTab, setActiveTab] = useState<'applications' | 'master'>('applications');
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [masterData, setMasterData] = useState<AlumniMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === 'applications') {
      fetchAlumni();
    } else {
      fetchMasterData();
    }
  }, [activeTab, statusFilter, page]);

  const fetchAlumni = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/alumni?status=${statusFilter}&page=${page}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setAlumni(data.alumni);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch alumni:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/alumni/upload?page=${page}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setMasterData(data.data);
        setTotalPages(Math.ceil(data.total / 50));
      }
    } catch (error) {
      console.error('Failed to fetch master data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (alumni: Alumni) => {
    setProcessing(true);
    try {
      const res = await fetch('/api/admin/alumni', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: alumni.id, action: 'approve' }),
      });
      if (res.ok) {
        fetchAlumni();
        setSelectedAlumni(null);
      }
    } catch (error) {
      console.error('Failed to approve:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedAlumni) return;
    
    setProcessing(true);
    try {
      const res = await fetch('/api/admin/alumni', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: selectedAlumni.id, 
          action: 'reject',
          rejection_reason: rejectionReason || null,
        }),
      });
      if (res.ok) {
        fetchAlumni();
        setSelectedAlumni(null);
        setRejectionReason('');
      }
    } catch (error) {
      console.error('Failed to reject:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setUploadResult(null);

    try {
      const res = await fetch('/api/admin/alumni/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setUploadResult(data);
      if (res.ok) {
        fetchMasterData();
      }
    } catch (error) {
      console.error('Failed to upload:', error);
      setUploadResult({ error: 'Upload failed' });
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadTemplate = () => {
    const csv = 'email,name,batch_number\nexample@email.com,山田太郎,5\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alumni_template.csv';
    a.click();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">審査中</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">承認済み</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">却下</span>;
      default:
        return null;
    }
  };

  const getUserName = (alumni: Alumni) => {
    if (alumni.profiles?.display_name) return alumni.profiles.display_name;
    if (alumni.profiles?.email) return alumni.profiles.email.split('@')[0];
    return 'Unknown';
  };

  const getUserEmail = (alumni: Alumni) => {
    return alumni.profiles?.email || '-';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <GraduationCap className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">SAAアルムナイ管理</h1>
        </div>

        {/* タブ */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => { setActiveTab('applications'); setPage(1); }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'applications'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            申請一覧
          </button>
          <button
            onClick={() => { setActiveTab('master'); setPage(1); }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'master'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            マスターデータ
          </button>
        </div>

        {/* 申請一覧タブ */}
        {activeTab === 'applications' && (
          <div className="bg-white rounded-xl shadow-sm">
            {/* フィルター */}
            <div className="p-4 border-b flex items-center gap-4">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="pending">審査中</option>
                <option value="approved">承認済み</option>
                <option value="rejected">却下</option>
                <option value="all">すべて</option>
              </select>
            </div>

            {/* テーブル */}
            {loading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : alumni.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                該当する申請はありません
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">申請者</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">メール</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">バッチ</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">申請日</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ステータス</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">アクション</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {alumni.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{getUserName(item)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{getUserEmail(item)}</td>
                        <td className="px-4 py-3 text-sm">{item.saa_batches?.name || `第${item.batch_number}期`}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(item.applied_at).toLocaleDateString('ja-JP')}
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                        <td className="px-4 py-3">
                          {item.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(item)}
                                disabled={processing}
                                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                              >
                                承認
                              </button>
                              <button
                                onClick={() => setSelectedAlumni(item)}
                                disabled={processing}
                                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                              >
                                却下
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ページネーション */}
            {totalPages > 1 && (
              <div className="p-4 border-t flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-600">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* マスターデータタブ */}
        {activeTab === 'master' && (
          <div className="space-y-6">
            {/* アップロードセクション */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold mb-4">CSV一括アップロード</h2>
              <p className="text-sm text-gray-600 mb-4">
                アルムナイ情報をCSVファイルでアップロードできます。
                フォーマット: email, name, batch_number
              </p>
              
              <div className="flex gap-4 mb-4">
                <button
                  onClick={downloadTemplate}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  テンプレートをダウンロード
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  CSVをアップロード
                </button>
              </div>

              {uploadResult && (
                <div className={`p-4 rounded-lg ${uploadResult.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {uploadResult.error ? (
                    <p>{uploadResult.error}</p>
                  ) : (
                    <div>
                      <p className="font-medium">アップロード完了</p>
                      <p className="text-sm">
                        インポート: {uploadResult.imported}件 / スキップ: {uploadResult.skipped}件
                      </p>
                      {uploadResult.errors && uploadResult.errors.length > 0 && (
                        <div className="mt-2 text-sm">
                          <p className="font-medium">エラー:</p>
                          <ul className="list-disc list-inside">
                            {uploadResult.errors.map((err: string, i: number) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* マスターデータ一覧 */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-4 border-b">
                <h2 className="font-bold">登録済みマスターデータ</h2>
              </div>
              
              {loading ? (
                <div className="p-8 flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : masterData.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  マスターデータはありません
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">メール</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">名前</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">バッチ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {masterData.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">{item.email}</td>
                          <td className="px-4 py-3 text-sm">{item.name}</td>
                          <td className="px-4 py-3 text-sm">{item.saa_batches?.name || `第${item.batch_number}期`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 却下理由モーダル */}
        {selectedAlumni && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">申請を却下</h2>
                <button onClick={() => setSelectedAlumni(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                {getUserName(selectedAlumni)} さんの申請を却下します。
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  却下理由（任意）
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                  rows={3}
                  placeholder="却下理由を入力してください"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedAlumni(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleReject}
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {processing ? '処理中...' : '却下する'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
