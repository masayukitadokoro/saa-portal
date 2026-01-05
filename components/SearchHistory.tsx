'use client';

import { Clock, Search, Trash2 } from 'lucide-react';

interface HistoryItem {
  id: string;
  query: string;
  results_count: number;
  searched_at: string;
}

interface SearchHistoryProps {
  history: HistoryItem[];
  onSelect: (query: string) => void;
  onClear: () => void;
  isLoggedIn: boolean;
}

// 日付をフォーマット (YYYY/MM/DD)
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

export default function SearchHistory({ 
  history, 
  onSelect, 
  onClear,
  isLoggedIn 
}: SearchHistoryProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-gray-900">検索履歴</span>
          <Search className="w-4 h-4 text-gray-400" />
        </div>
        {isLoggedIn && history.length > 0 && (
          <button
            onClick={onClear}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
            title="履歴をクリア"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 履歴リスト */}
      {!isLoggedIn ? (
        <p className="text-sm text-gray-500">
          ログインすると検索履歴が保存されます
        </p>
      ) : history.length === 0 ? (
        <p className="text-sm text-gray-500">
          検索履歴はありません
        </p>
      ) : (
        <div className="space-y-1">
          {history.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item.query)}
              className="w-full flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 
                       transition-colors text-left group"
            >
              <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 truncate">
                  {item.query}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(item.searched_at)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
