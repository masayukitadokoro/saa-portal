import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold">利用規約</h1>
        </div>
      </header>

      {/* コンテンツ */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8">
        <div className="prose prose-gray max-w-none">
          <p className="text-sm text-gray-500 mb-8">最終更新日: 2026年1月2日</p>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">第1条（適用）</h2>
            <p>本規約は、ユニコーンファーム株式会社（以下「当社」）が提供する「起業の科学ポータル」（以下「本サービス」）の利用条件を定めるものです。登録ユーザーの皆様には、本規約に従って本サービスをご利用いただきます。</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">第2条（利用登録）</h2>
            <p>本サービスの利用を希望する方は、当社の定める方法により利用登録を申請し、当社がこれを承認することで、利用登録が完了するものとします。</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">第3条（アカウント管理）</h2>
            <p>ユーザーは、自己の責任においてアカウント情報を管理するものとします。アカウントの不正利用により生じた損害について、当社は一切の責任を負いません。</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">第4条（禁止事項）</h2>
            <p>ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>法令または公序良俗に違反する行為</li>
              <li>当社または第三者の知的財産権を侵害する行為</li>
              <li>本サービスのコンテンツを無断で複製、転載、配布する行為</li>
              <li>本サービスの運営を妨害する行為</li>
              <li>他のユーザーに不利益を与える行為</li>
              <li>不正アクセスまたはこれを試みる行為</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">第5条（コンテンツの権利）</h2>
            <p>本サービスで提供されるコンテンツ（動画、記事、資料等）の著作権は、当社または正当な権利者に帰属します。ユーザーは、私的利用の範囲を超えてコンテンツを使用することはできません。</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">第6条（サービスの変更・停止）</h2>
            <p>当社は、ユーザーに通知することなく、本サービスの内容を変更、または提供を停止することができるものとします。</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">第7条（免責事項）</h2>
            <p>当社は、本サービスに関してユーザーに生じた損害について、故意または重過失がある場合を除き、一切の責任を負いません。</p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold mb-4">第8条（準拠法・管轄裁判所）</h2>
            <p>本規約の解釈は日本法に準拠し、本サービスに関する紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。</p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
