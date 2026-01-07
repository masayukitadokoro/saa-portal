'use client';

import { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronRight, BookOpen, Calendar, GraduationCap, FileText, Users, BarChart3, Sparkles, Rocket } from 'lucide-react';
import { StudentLayout } from '@/components/student/StudentLayout';
import { Card } from '@/components/student/ui';

interface GuideItem {
  emoji: string;
  title: string;
  url: string;
}

interface GuideSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  items: GuideItem[];
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'getting_started',
    title: 'はじめに',
    icon: <BookOpen className="w-5 h-5" />,
    color: 'bg-blue-500',
    items: [
      { emoji: '📘', title: 'SAA（スタートアップアドバイザーアカデミー）について', url: '#' },
      { emoji: '📋', title: '参加ルール', url: '#' },
      { emoji: '💬', title: 'Slackの使い方', url: '#' },
      { emoji: '🔧', title: 'SAAで使うツールについて', url: '#' },
      { emoji: '📧', title: 'メールアドレス変更をご希望の方はこちら', url: '#' },
      { emoji: '💰', title: '助成金', url: '#' },
    ],
  },
  {
    id: 'schedule',
    title: 'スケジュール',
    icon: <Calendar className="w-5 h-5" />,
    color: 'bg-green-500',
    items: [
      { emoji: '📄', title: 'シラバス', url: '#' },
      { emoji: '📄', title: 'SAAの講義の全体像', url: '#' },
      { emoji: '📅', title: 'SAA Batch9 講義スケジュール一覧', url: '#' },
    ],
  },
  {
    id: 'graduation',
    title: '卒業要件',
    icon: <GraduationCap className="w-5 h-5" />,
    color: 'bg-purple-500',
    items: [
      { emoji: '🎓', title: '卒業要件について', url: '#' },
      { emoji: '🎓', title: '卒業制作資料について', url: '#' },
      { emoji: '🎓', title: '卒業制作インデックスについて', url: '#' },
      { emoji: '🎓', title: '認定式について', url: '#' },
      { emoji: '🎓', title: 'SAA奨学金制度について', url: '#' },
    ],
  },
  {
    id: 'karte',
    title: '起業参謀カルテ（My学習カルテ）',
    icon: <FileText className="w-5 h-5" />,
    color: 'bg-orange-500',
    items: [
      { emoji: '📊', title: 'View of 受講生DB', url: '#' },
    ],
  },
  {
    id: 'resources',
    title: '各種資料など',
    icon: <FileText className="w-5 h-5" />,
    color: 'bg-amber-500',
    items: [
      { emoji: '🎬', title: '動画コンテンツ（エアコース）', url: '#' },
      { emoji: '📚', title: '参考図書', url: '#' },
      { emoji: '📚', title: '良いメンタリングを行うための参考資料', url: '#' },
      { emoji: '📁', title: '受講生向けGoogleフォルダ', url: '#' },
      { emoji: '📄', title: 'Batch9 定例講義 講義録', url: '#' },
      { emoji: '📍', title: '参考資料：画像サイト', url: '#' },
      { emoji: '📝', title: 'note（ノート） ユニコーンファームSAA運営', url: 'https://note.com/unicornfarm' },
    ],
  },
  {
    id: 'team',
    title: 'チームメンバー',
    icon: <Users className="w-5 h-5" />,
    color: 'bg-pink-500',
    items: [
      { emoji: '👥', title: 'メンバー自己紹介', url: '#' },
      { emoji: '🏠', title: 'チーム制度・TAについて', url: '#' },
      { emoji: '👥', title: 'TA チーム分け名簿', url: '#' },
    ],
  },
  {
    id: 'scm',
    title: 'SCM（アセスメント）',
    icon: <BarChart3 className="w-5 h-5" />,
    color: 'bg-indigo-500',
    items: [
      { emoji: '📊', title: 'SCM（Startup Capability Metrics）', url: '/student/scm' },
    ],
  },
  {
    id: 'saa_plus',
    title: 'SAA +',
    icon: <Sparkles className="w-5 h-5" />,
    color: 'bg-rose-500',
    items: [
      { emoji: '🤝', title: 'バディ制度', url: '#' },
      { emoji: '🤖', title: '募集中：生成AI新規事業ブートキャンプ', url: '#' },
      { emoji: '🤝', title: 'モック起業家メンタリング添削', url: '#' },
    ],
  },
];

export default function GuidePage() {
  const [expandedSections, setExpandedSections] = useState<string[]>(
    GUIDE_SECTIONS.map(s => s.id) // 初期状態で全て展開
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const isExpanded = (sectionId: string) => expandedSections.includes(sectionId);

  return (
    <StudentLayout pageTitle="ガイド">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-6">
          <p className="text-gray-600">
            SAAの各種ガイド・資料へのリンク集です。
          </p>
        </div>

        {/* セクション一覧 */}
        <div className="space-y-4">
          {GUIDE_SECTIONS.map((section) => (
            <Card key={section.id} className="overflow-hidden">
              {/* セクションヘッダー */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${section.color} flex items-center justify-center text-white`}>
                    {section.icon}
                  </div>
                  <h2 className="font-bold text-gray-900">{section.title}</h2>
                  <span className="text-sm text-gray-500">({section.items.length})</span>
                </div>
                {isExpanded(section.id) ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {/* アイテム一覧 */}
              {isExpanded(section.id) && (
                <div className="border-t border-gray-100">
                  {section.items.map((item, idx) => (
                    <a
                      key={idx}
                      href={item.url}
                      target={item.url.startsWith('http') ? '_blank' : undefined}
                      rel={item.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{item.emoji}</span>
                        <span className="text-gray-700">{item.title}</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </a>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* フッター */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-sm text-gray-500">
            📌 各リンクはNotionページに移動します。
            <br />
            ご不明点はSlackの #質問 チャンネルまでお問い合わせください。
          </p>
        </div>
      </div>
    </StudentLayout>
  );
}
