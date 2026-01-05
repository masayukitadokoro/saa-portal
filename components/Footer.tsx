'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* リンク */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
          <Link href="/terms" className="hover:text-gray-700 transition">
            利用規約
          </Link>
          <Link href="/privacy" className="hover:text-gray-700 transition">
            プライバシーポリシー
          </Link>
          <Link href="/tokushoho" className="hover:text-gray-700 transition">
            特定商取引法に基づく表記
          </Link>
          <Link href="/contact" className="hover:text-gray-700 transition">
            お問い合わせ
          </Link>
        </div>

        {/* コピーライト */}
        <div className="mt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} 起業の科学ポータル All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
