'use client';
import { formatVideoTitle } from '@/lib/formatTitle';

import React, { useState, useEffect, use } from 'react';
import { track } from '@/lib/tracking';
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { 
  Eye, 
  Calendar, 
  BookOpen,
  User,
  Loader2,
  Play
} from 'lucide-react';

interface Article {
  id: string;
  video_id: string;
  title: string;
  content?: string;
  summary?: string;
  thumbnail_url?: string;
  view_count?: number;
  display_order?: number;
  published_at?: string;
  category?: string;
}

interface UserInfo {
  name?: string;
  avatar?: string;
}

export default function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [showFloatingButton, setShowFloatingButton] = useState(false);

  useEffect(() => {
    fetchArticle();
    fetchUserInfo();
  }, [resolvedParams.id]);

  // スクロール監視
  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingButton(window.scrollY > 200);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchArticle = async () => {
    try {
      const res = await fetch(`/api/articles/${resolvedParams.id}`);
      if (res.ok) {
        const data = await res.json();
        setArticle(data.article);
        track.articleView(resolvedParams.id, data.article?.title || '');
      }
    } catch (error) {
      console.error('Failed to fetch article:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserInfo = async () => {
    try {
      const res = await fetch('/api/mypage/profile');
      if (res.ok) {
        const data = await res.json();
        setUserInfo({
          name: data.display_name || data.email?.split('@')[0],
          avatar: data.avatar_url,
        });
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">記事が見つかりませんでした</p>
        <Link href="/articles" className="text-rose-600 hover:text-rose-700">
          記事一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* 左: ロゴ */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">🔬</span>
            </div>
            <span className="hidden sm:block font-bold text-gray-900">
              起業の科学<span className="text-rose-500">ポータル</span>
            </span>
          </Link>

          {/* 中央: ページタイトル */}
          <h1 className="flex items-center gap-2 text-base sm:text-lg font-bold text-gray-800">
            <BookOpen className="w-5 h-5" />
            <span>解説記事</span>
          </h1>

          {/* 右: ユーザー */}
          <Link
            href="/mypage"
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {userInfo?.avatar ? (
              <Image
                src={userInfo.avatar}
                alt={userInfo.name || 'User'}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {userInfo?.name ? userInfo.name[0].toUpperCase() : <User className="w-4 h-4" />}
              </div>
            )}
            {userInfo?.name && (
              <span className="hidden md:block text-sm font-medium text-gray-700">
                {userInfo.name}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* サムネイル */}
        {article.thumbnail_url && (
          <div className="relative aspect-video bg-gray-200 rounded-xl overflow-hidden mb-8">
            <Image
              src={article.thumbnail_url}
              alt={formatVideoTitle(article.title, article.display_order)}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* タイトル */}
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
          {formatVideoTitle(article.title, article.display_order)}
        </h1>

        {/* メタ情報 */}
        <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
          {article.view_count !== undefined && (
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {article.view_count.toLocaleString()}回視聴
            </span>
          )}
          {article.published_at && (
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(article.published_at)}
            </span>
          )}
        </div>

        {/* サマリー */}
        {article.summary && (
          <div className="mt-8 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-100">
            <h2 className="flex items-center gap-2 font-bold text-gray-900 mb-2">
              📝 この記事で学べること
            </h2>
            <p className="text-gray-700">{article.summary}</p>
          </div>
        )}

        {/* 本文 - ReactMarkdownでレンダリング */}
        {article.content && (
          <article className="mt-8">
            <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-h2:text-xl prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-lg prose-h3:font-bold prose-h3:mt-6 prose-h3:mb-3 prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4 prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4 prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-4 prose-li:text-gray-700 prose-li:mb-1 prose-strong:text-gray-900 prose-strong:font-bold">
              <ReactMarkdown>
                {article.content}
              </ReactMarkdown>
            </div>
          </article>
        )}

        {/* 記事一覧へ戻るリンク */}
        <div className="mt-12 pt-8 border-t text-center">
          <Link
            href="/articles"
            className="text-rose-600 hover:text-rose-700 font-medium"
          >
            ← 記事一覧に戻る
          </Link>
        </div>
      </main>

      {/* フローティング「動画を見る」ボタン */}
      {article.video_id && (
        <Link
          href={`/videos/${article.video_id}`}
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 bg-rose-600 text-white rounded-full shadow-lg hover:bg-rose-700 hover:shadow-xl transition-all duration-300 ${
            showFloatingButton 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          <Play className="w-5 h-5 fill-white" />
          <span className="font-medium">動画を見る</span>
        </Link>
      )}
    </div>
  );
}
