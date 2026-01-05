import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Footer from '@/components/Footer';

export default function TokushohoPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold">特定商取引法に基づく表記</h1>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8">
        <div className="prose prose-gray max-w-none">
          <table className="w-full border-collapse">
            <tbody>
              <tr className="border-b">
                <th className="py-4 px-4 text-left bg-gray-50 w-1/3 align-top">販売事業者</th>
                <td className="py-4 px-4">株式会社ユニコーンファーム</td>
              </tr>
              <tr className="border-b">
                <th className="py-4 px-4 text-left bg-gray-50 align-top">代表者</th>
                <td className="py-4 px-4">田所 雅之</td>
              </tr>
              <tr className="border-b">
                <th className="py-4 px-4 text-left bg-gray-50 align-top">所在地</th>
                <td className="py-4 px-4">
                  〒150-0012<br />
                  東京都渋谷区広尾5丁目4-16 EAT PLAY WORKS 3F
                </td>
              </tr>
              <tr className="border-b">
                <th className="py-4 px-4 text-left bg-gray-50 align-top">電話番号</th>
                <td className="py-4 px-4">お問い合わせフォームよりご連絡ください</td>
              </tr>
              <tr className="border-b">
                <th className="py-4 px-4 text-left bg-gray-50 align-top">メールアドレス</th>
                <td className="py-4 px-4">tadokoro@unicornfarm.co</td>
              </tr>
              <tr className="border-b">
                <th className="py-4 px-4 text-left bg-gray-50 align-top">販売価格</th>
                <td className="py-4 px-4">各サービス・商品ページに記載</td>
              </tr>
              <tr className="border-b">
                <th className="py-4 px-4 text-left bg-gray-50 align-top">支払方法</th>
                <td className="py-4 px-4">クレジットカード決済</td>
              </tr>
              <tr className="border-b">
                <th className="py-4 px-4 text-left bg-gray-50 align-top">支払時期</th>
                <td className="py-4 px-4">サービス申込時</td>
              </tr>
              <tr className="border-b">
                <th className="py-4 px-4 text-left bg-gray-50 align-top">サービス提供時期</th>
                <td className="py-4 px-4">決済完了後、即時</td>
              </tr>
              <tr className="border-b">
                <th className="py-4 px-4 text-left bg-gray-50 align-top">返品・キャンセル</th>
                <td className="py-4 px-4">
                  デジタルコンテンツの性質上、購入後の返品・キャンセルはお受けできません。<br />
                  ただし、サービスに重大な瑕疵がある場合は個別に対応いたします。
                </td>
              </tr>
              <tr className="border-b">
                <th className="py-4 px-4 text-left bg-gray-50 align-top">動作環境</th>
                <td className="py-4 px-4">
                  最新版のChrome、Safari、Edge、Firefoxを推奨<br />
                  インターネット接続環境が必要です
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>

      <Footer />
    </div>
  );
}
