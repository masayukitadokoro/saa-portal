import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold">プライバシーポリシー</h1>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8">
        <div className="prose prose-gray max-w-none">
          <p className="text-sm text-gray-500 mb-8">最終更新日: 2026年1月2日</p>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">1. はじめに</h2>
            <p>ユニコーンファーム株式会社（以下「当社」）は、「起業の科学ポータル」（以下「本サービス」）において、ユーザーの個人情報を適切に保護することが社会的責務であると考え、以下のプライバシーポリシーに基づき個人情報の保護に努めます。</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">2. 収集する情報</h2>
            <p>当社は、以下の情報を収集することがあります。</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>氏名、メールアドレス等の登録情報</li>
              <li>視聴履歴、ブックマーク等の利用データ</li>
              <li>アクセスログ、IPアドレス、ブラウザ情報</li>
              <li>Cookie等による識別情報</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">3. 情報の利用目的</h2>
            <p>収集した情報は、以下の目的で利用します。</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>本サービスの提供・運営</li>
              <li>ユーザーサポート対応</li>
              <li>サービス改善のための分析</li>
              <li>新機能やお知らせの通知</li>
              <li>不正利用の防止</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">4. 情報の第三者提供</h2>
            <p>当社は、以下の場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>法令に基づく場合</li>
              <li>人の生命、身体または財産の保護に必要な場合</li>
              <li>業務委託先に必要な範囲で提供する場合</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">5. 情報の管理</h2>
            <p>当社は、個人情報の漏洩、滅失、毀損を防止するため、適切なセキュリティ対策を講じます。</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">6. Cookieの使用</h2>
            <p>本サービスでは、ユーザー体験向上のためCookieを使用しています。ブラウザの設定によりCookieを無効にすることも可能ですが、一部機能が利用できなくなる場合があります。</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">7. お問い合わせ</h2>
            <p>プライバシーポリシーに関するお問い合わせは、<Link href="/contact" className="text-rose-600 hover:underline">お問い合わせページ</Link>よりご連絡ください。</p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
