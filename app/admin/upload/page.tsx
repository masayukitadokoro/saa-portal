'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

interface UploadResult {
  success: number;
  failed: number;
  errors: string[];
}

export default function AdminUpload() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (data.profile?.role !== 'admin') {
        router.push('/');
        return;
      }
      setIsAdmin(true);
      setIsLoading(false);
    }
    checkAdmin();
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setResult(null);
    } else {
      alert('CSVファイルを選択してください');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: 0,
        failed: 1,
        errors: ['アップロードに失敗しました'],
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <a href="/admin" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" />
            管理者ダッシュボードに戻る
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">動画一括アップロード</h1>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <h2 className="font-semibold text-blue-900 mb-2">CSVフォーマット</h2>
          <p className="text-sm text-blue-800 mb-2">
            以下の形式のCSVファイルを準備してください：
          </p>
          <code className="block bg-white p-3 rounded text-xs overflow-x-auto">
            title,video_url,script_text,tags<br/>
            "動画タイトル","https://youtube.com/watch?v=xxx","書き起こしテキスト","タグ1,タグ2"
          </code>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                <span className="text-gray-900">{file.name}</span>
                <button
                  onClick={() => setFile(null)}
                  className="text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">CSVファイルをドラッグ＆ドロップ</p>
                <label className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
                  ファイルを選択
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </>
            )}
          </div>

          {file && (
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="mt-6 w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isUploading ? 'アップロード中...' : 'アップロード開始'}
            </button>
          )}

          {result && (
            <div className="mt-6 p-4 rounded-lg bg-gray-50">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span>成功: {result.success}件</span>
                </div>
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-5 h-5" />
                  <span>失敗: {result.failed}件</span>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="text-sm text-red-600">
                  <p className="font-semibold mb-1">エラー:</p>
                  <ul className="list-disc list-inside">
                    {result.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
