'use client';

import { useState } from 'react';
import { X, Smartphone, Monitor, Info } from 'lucide-react';

interface PipGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PipGuideModal({ isOpen, onClose }: PipGuideModalProps) {
  const [activeTab, setActiveTab] = useState<'iphone' | 'android' | 'desktop'>('iphone');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">バックグラウンド再生の方法</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* タブ */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('iphone')}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === 'iphone' 
                ? 'text-rose-600 border-b-2 border-rose-600' 
                : 'text-gray-500'
            }`}
          >
            iPhone
          </button>
          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === 'android' 
                ? 'text-rose-600 border-b-2 border-rose-600' 
                : 'text-gray-500'
            }`}
          >
            Android
          </button>
          <button
            onClick={() => setActiveTab('desktop')}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === 'desktop' 
                ? 'text-rose-600 border-b-2 border-rose-600' 
                : 'text-gray-500'
            }`}
          >
            PC
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-4 overflow-y-auto max-h-[50vh]">
          {activeTab === 'iphone' && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Safari</strong>でのみ利用可能です
                </p>
              </div>
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>動画を<strong>フルスクリーン</strong>で再生開始</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>再生中に<strong>ホーム画面に戻る</strong>（スワイプアップ or ホームボタン）</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>小さい画面で再生が継続します</span>
                </li>
              </ol>
              <div className="bg-amber-50 p-3 rounded-lg">
                <p className="text-xs text-amber-800">
                  ※ iOS 14以降が必要です<br/>
                  ※ 設定 → 一般 → ピクチャインピクチャ が有効になっていることを確認
                </p>
              </div>
            </div>
          )}

          {activeTab === 'android' && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Chrome</strong>でのみ利用可能です
                </p>
              </div>
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>動画を<strong>フルスクリーン</strong>で再生開始</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>再生中に<strong>ホームボタン</strong>を押す</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>小窓で再生が継続します</span>
                </li>
              </ol>
              <div className="bg-amber-50 p-3 rounded-lg">
                <p className="text-xs text-amber-800">
                  ※ Android 8.0以降が必要です<br/>
                  ※ 設定 → アプリ → Chrome → ピクチャインピクチャ を許可
                </p>
              </div>
            </div>
          )}

          {activeTab === 'desktop' && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Chrome / Edge / Safari</strong>で利用可能
                </p>
              </div>
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>動画プレーヤー上で<strong>右クリックを2回</strong></span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>メニューから「<strong>ピクチャー イン ピクチャー</strong>」を選択</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>他のタブやアプリを使いながら再生できます</span>
                </li>
              </ol>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">
                  💡 1回目の右クリック：YouTube独自メニュー<br/>
                  💡 2回目の右クリック：ブラウザメニュー（PiPあり）
                </p>
              </div>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-2 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

export default PipGuideModal;
