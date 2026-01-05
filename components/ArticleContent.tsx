'use client';

import React from 'react';

interface ArticleContentProps {
  content: string;
  coverUrl?: string | null;
  title?: string;
  tags?: string[] | null;
}

// Markdownをパースして適切にレンダリング
export default function ArticleContent({ content, coverUrl, title, tags }: ArticleContentProps) {
  if (!content) return null;

  // ```markdown などのコードブロック記法を除去
  const cleanContent = content
    .replace(/^```markdown\s*/gm, '')
    .replace(/^```\s*$/gm, '')
    .replace(/^\*\*(.+?)\*\*$/gm, '<strong>$1</strong>') // **bold**
    .trim();

  const lines = cleanContent.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: { type: 'bullet' | 'numbered'; content: string }[] = [];
  
  const flushList = () => {
    if (listItems.length > 0) {
      const ListTag = listItems[0].type === 'numbered' ? 'ol' : 'ul';
      elements.push(
        <ListTag key={elements.length} className={listItems[0].type === 'numbered' ? 'list-decimal ml-6 mb-4 space-y-2' : 'list-disc ml-6 mb-4 space-y-2'}>
          {listItems.map((item, i) => (
            <li key={i} className="text-gray-700 leading-relaxed">
              {parseInlineMarkdown(item.content)}
            </li>
          ))}
        </ListTag>
      );
      listItems = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    if (!trimmed) {
      flushList();
      continue;
    }

    // 見出し
    if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={elements.length} className="text-2xl font-bold text-gray-900 mt-8 mb-4">
          {trimmed.slice(2)}
        </h2>
      );
    } else if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={elements.length} className="text-xl font-bold text-gray-900 mt-8 mb-4">
          {trimmed.slice(3)}
        </h2>
      );
    } else if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={elements.length} className="text-lg font-semibold text-gray-900 mt-6 mb-3">
          {trimmed.slice(4)}
        </h3>
      );
    }
    // 箇条書き
    else if (trimmed.startsWith('- ')) {
      listItems.push({ type: 'bullet', content: trimmed.slice(2) });
    }
    // 番号付きリスト
    else if (/^\d+\.\s/.test(trimmed)) {
      listItems.push({ type: 'numbered', content: trimmed.replace(/^\d+\.\s/, '') });
    }
    // 引用
    else if (trimmed.startsWith('> ')) {
      flushList();
      elements.push(
        <blockquote key={elements.length} className="border-l-4 border-blue-300 pl-4 py-2 my-4 bg-blue-50 rounded-r-lg">
          <p className="text-gray-700 italic">{parseInlineMarkdown(trimmed.slice(2))}</p>
        </blockquote>
      );
    }
    // 区切り線
    else if (trimmed === '---') {
      flushList();
      elements.push(<hr key={elements.length} className="my-8 border-gray-200" />);
    }
    // 画像
    else if (trimmed.startsWith('![')) {
      flushList();
      const match = trimmed.match(/!\[(.*?)\]\((.*?)\)/);
      if (match) {
        elements.push(
          <figure key={elements.length} className="my-6">
            <img src={match[2]} alt={match[1]} className="w-full rounded-lg" />
            {match[1] && <figcaption className="text-sm text-gray-500 text-center mt-2">{match[1]}</figcaption>}
          </figure>
        );
      }
    }
    // 通常のパラグラフ
    else {
      flushList();
      elements.push(
        <p key={elements.length} className="text-gray-700 leading-relaxed mb-4">
          {parseInlineMarkdown(trimmed)}
        </p>
      );
    }
  }
  
  flushList();

  return (
    <div className="article-content">
      {/* カバー画像 */}
      {coverUrl && (
        <div className="mb-6 -mx-4 sm:mx-0">
          <img 
            src={coverUrl} 
            alt={title || '記事カバー画像'} 
            className="w-full aspect-[2/1] object-cover sm:rounded-xl"
          />
        </div>
      )}
      
      {/* タグ */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map(tag => (
            <span key={tag} className="text-sm text-blue-600 hover:text-blue-800">
              #{tag}
            </span>
          ))}
        </div>
      )}
      
      {/* 記事本文 */}
      <div className="prose prose-gray max-w-none">
        {elements}
      </div>
    </div>
  );
}

// インラインMarkdownをパース
function parseInlineMarkdown(text: string): React.ReactNode {
  // **bold** と `code` をパース
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // **bold**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // `code`
    const codeMatch = remaining.match(/`([^`]+)`/);

    // 最初にマッチするものを見つける
    let firstMatchIndex = remaining.length;
    let firstMatchLength = 0;
    let firstMatchContent: React.ReactNode = null;

    if (boldMatch && boldMatch.index !== undefined && boldMatch.index < firstMatchIndex) {
      firstMatchIndex = boldMatch.index;
      firstMatchLength = boldMatch[0].length;
      firstMatchContent = <strong key={key++}>{boldMatch[1]}</strong>;
    }

    if (codeMatch && codeMatch.index !== undefined && codeMatch.index < firstMatchIndex) {
      firstMatchIndex = codeMatch.index;
      firstMatchLength = codeMatch[0].length;
      firstMatchContent = <code key={key++} className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">{codeMatch[1]}</code>;
    }

    if (firstMatchContent !== null) {
      if (firstMatchIndex > 0) {
        parts.push(remaining.slice(0, firstMatchIndex));
      }
      parts.push(firstMatchContent);
      remaining = remaining.slice(firstMatchIndex + firstMatchLength);
    } else {
      parts.push(remaining);
      break;
    }
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}
