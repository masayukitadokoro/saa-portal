'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, TrendingUp, Sparkles } from 'lucide-react';

export default function SearchSuggestions() {
  const router = useRouter();
  const [popularKeywords, setPopularKeywords] = useState<string[]>([]);
  const [personalizedKeywords, setPersonalizedKeywords] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setPopularKeywords([
      'PMF',
      'ビジネスモデル',
      'マーケットサイズ',
      'ピッチ',
      'スタートアップ',
      '資金調達'
    ]);
  }, []);

  function handleSearch(query: string) {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleSearch(searchQuery);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="キーワードで動画を検索..."
          className="w-full pl-12 pr-24 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={() => handleSearch(searchQuery)}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          検索
        </button>
      </div>

      {personalizedKeywords.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-purple-600 mb-2">
            <Sparkles className="w-4 h-4" />
            <span>あなたへのおすすめ</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {personalizedKeywords.map((keyword) => (
              <button
                key={keyword}
                onClick={() => handleSearch(keyword)}
                className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm hover:bg-purple-100 transition"
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>
      )}

      {popularKeywords.length > 0 && (
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span>人気のキーワード</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {popularKeywords.map((keyword) => (
              <button
                key={keyword}
                onClick={() => handleSearch(keyword)}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition"
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
