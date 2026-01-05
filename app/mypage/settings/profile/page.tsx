'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Camera, Check, Loader2 } from 'lucide-react';
import Image from 'next/image';

// プリセットアイコン定義
const presetAvatars = [
  { id: 'preset_1', label: 'ビジネスマン', color: 'bg-blue-500' },
  { id: 'preset_2', label: 'ビジネスウーマン', color: 'bg-pink-500' },
  { id: 'preset_3', label: 'クリエイター', color: 'bg-purple-500' },
  { id: 'preset_4', label: 'エンジニア', color: 'bg-green-500' },
  { id: 'preset_5', label: '起業家', color: 'bg-orange-500' },
  { id: 'preset_6', label: '研究者', color: 'bg-teal-500' },
  { id: 'preset_7', label: 'マーケター', color: 'bg-red-500' },
  { id: 'preset_8', label: 'デザイナー', color: 'bg-yellow-500' },
  { id: 'preset_9', label: 'コンサルタント', color: 'bg-indigo-500' },
  { id: 'preset_10', label: 'ニュートラル', color: 'bg-gray-500' },
];

interface Profile {
  user_id: string;
  display_name: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  avatar_preset: string | null;
  company: string | null;
  job_title: string | null;
  bio: string | null;
  current_stage: string | null;
}

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // フォームの状態
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    display_name: '',
    company: '',
    job_title: '',
    bio: '',
    avatar_preset: 'preset_10',
    avatar_url: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/mypage/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setFormData({
          first_name: data.profile.first_name || '',
          last_name: data.profile.last_name || '',
          display_name: data.profile.display_name || '',
          company: data.profile.company || '',
          job_title: data.profile.job_title || '',
          bio: data.profile.bio || '',
          avatar_preset: data.profile.avatar_preset || 'preset_10',
          avatar_url: data.profile.avatar_url || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/mypage/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setMessage({ type: 'success', text: 'プロフィールを更新しました' });
      } else {
        setMessage({ type: 'error', text: '更新に失敗しました' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'エラーが発生しました' });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarPresetSelect = (presetId: string) => {
    setFormData({ ...formData, avatar_preset: presetId, avatar_url: '' });
    setShowAvatarModal(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ファイルサイズチェック（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'ファイルサイズは5MB以下にしてください' });
      return;
    }

    setUploadingAvatar(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const res = await fetch('/api/mypage/profile/avatar', {
        method: 'POST',
        body: formDataUpload,
      });

      if (res.ok) {
        const data = await res.json();
        setFormData({ ...formData, avatar_url: data.url, avatar_preset: '' });
        setShowAvatarModal(false);
        setMessage({ type: 'success', text: 'アイコンをアップロードしました' });
      } else {
        setMessage({ type: 'error', text: 'アップロードに失敗しました' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'エラーが発生しました' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getCurrentAvatar = () => {
    if (formData.avatar_url) {
      return formData.avatar_url;
    }
    const preset = presetAvatars.find(p => p.id === formData.avatar_preset);
    return preset?.color || 'bg-gray-500';
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
      <h1 className="text-2xl font-bold text-gray-900 mb-8">アカウント設定</h1>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* アイコン */}
        <div className="mb-8 flex items-center gap-6">
          <div className="text-gray-600 w-32">アイコン</div>
          <div className="flex items-center gap-4">
            {formData.avatar_url ? (
              <div className="w-20 h-20 rounded-full overflow-hidden">
                <Image 
                  src={formData.avatar_url} 
                  alt="Avatar" 
                  width={80} 
                  height={80}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div className={`w-20 h-20 rounded-full ${getCurrentAvatar()} flex items-center justify-center text-white text-2xl font-bold`}>
                {formData.display_name?.[0] || formData.first_name?.[0] || 'U'}
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowAvatarModal(true)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              変更する
            </button>
          </div>
        </div>

        {/* 名前 */}
        <div className="mb-6 flex items-start gap-6">
          <div className="text-gray-600 w-32 pt-2">名前</div>
          <div className="flex-1 flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-500 mb-1">姓</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="田所"
                maxLength={30}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-500 mb-1">名</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="雅之"
                maxLength={30}
              />
            </div>
          </div>
        </div>

        {/* 表示名 */}
        <div className="mb-6 flex items-center gap-6">
          <div className="text-gray-600 w-32">表示名</div>
          <div className="flex-1">
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="表示名を入力"
              maxLength={30}
            />
            <p className="text-sm text-gray-500 mt-1">他のユーザーに表示される名前です</p>
          </div>
        </div>

        {/* メールアドレス（表示のみ） */}
        <div className="mb-6 flex items-center gap-6">
          <div className="text-gray-600 w-32">メールアドレス</div>
          <div className="flex-1">
            <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
              {profile?.email || '未設定'}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              変更は<a href="/mypage/settings/email" className="text-blue-600 hover:underline">メールアドレス設定</a>から
            </p>
          </div>
        </div>

        {/* 企業・団体名 */}
        <div className="mb-6 flex items-center gap-6">
          <div className="text-gray-600 w-32">企業・団体名</div>
          <div className="flex-1">
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="株式会社〇〇"
              maxLength={60}
            />
            <p className="text-sm text-gray-500 mt-1">最大60文字</p>
          </div>
        </div>

        {/* 肩書・役職 */}
        <div className="mb-6 flex items-center gap-6">
          <div className="text-gray-600 w-32">肩書・役職</div>
          <div className="flex-1">
            <input
              type="text"
              value={formData.job_title}
              onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="CEO"
              maxLength={60}
            />
            <p className="text-sm text-gray-500 mt-1">最大60文字</p>
          </div>
        </div>

        {/* 自己紹介 */}
        <div className="mb-8 flex items-start gap-6">
          <div className="text-gray-600 w-32 pt-2">プロフィール</div>
          <div className="flex-1">
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="自己紹介を入力してください"
              rows={4}
              maxLength={1024}
            />
            <p className="text-sm text-gray-500 mt-1">最大1024文字（{formData.bio.length}/1024）</p>
          </div>
        </div>

        {/* 保存ボタン */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                保存中...
              </>
            ) : (
              '保存する'
            )}
          </button>
        </div>
      </form>

      {/* アイコン選択モーダル */}
      {showAvatarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
            <h2 className="text-xl font-bold mb-4">アイコンを変更</h2>
            
            {/* プリセット選択 */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">プリセットから選ぶ</h3>
              <div className="grid grid-cols-5 gap-3">
                {presetAvatars.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleAvatarPresetSelect(preset.id)}
                    className={`relative w-12 h-12 rounded-full ${preset.color} flex items-center justify-center text-white text-lg font-bold hover:ring-2 hover:ring-offset-2 hover:ring-blue-500 transition-all ${
                      formData.avatar_preset === preset.id && !formData.avatar_url ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                    }`}
                    title={preset.label}
                  >
                    {preset.label[0]}
                    {formData.avatar_preset === preset.id && !formData.avatar_url && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 画像アップロード */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">画像をアップロード</h3>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                {uploadingAvatar ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    アップロード中...
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    画像を選択（5MB以下）
                  </>
                )}
              </button>
            </div>

            {/* 閉じるボタン */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
