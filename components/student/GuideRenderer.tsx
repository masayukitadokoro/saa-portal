'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, ExternalLink } from 'lucide-react';

interface TipTapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
}

function renderMarks(node: TipTapNode): React.ReactNode {
  if (node.type !== 'text' || !node.text) return null;

  let element: React.ReactNode = node.text;

  if (node.marks) {
    for (const mark of node.marks) {
      switch (mark.type) {
        case 'bold':
          element = <strong>{element}</strong>;
          break;
        case 'italic':
          element = <em>{element}</em>;
          break;
        case 'strike':
          element = <s>{element}</s>;
          break;
        case 'underline':
          element = <u>{element}</u>;
          break;
        case 'code':
          element = (
            <code className="bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded text-[13px] font-mono">
              {element}
            </code>
          );
          break;
        case 'link': {
          const href = (mark.attrs?.href as string) || '#';
          const isExternal =
            href.startsWith('http') && !href.includes('saa-portal');
          element = (
            <a
              href={href}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              className="text-indigo-600 hover:text-indigo-800 underline underline-offset-2 inline-flex items-center gap-0.5"
            >
              {element}
              {isExternal && <ExternalLink className="w-3 h-3 inline" />}
            </a>
          );
          break;
        }
      }
    }
  }

  return element;
}

function renderInline(content?: TipTapNode[]): React.ReactNode {
  if (!content) return null;
  return content.map((node, i) => {
    if (node.type === 'text') return <span key={i}>{renderMarks(node)}</span>;
    if (node.type === 'hardBreak') return <br key={i} />;
    return null;
  });
}

function ToggleBlock({
  summary,
  children,
}: {
  summary: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-lg my-2 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left font-medium text-gray-900 hover:bg-gray-50 transition"
      >
        {open ? (
          <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
        )}
        <span className="flex-1">{summary}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
}

function RenderNode({ node }: { node: TipTapNode }) {
  switch (node.type) {
    case 'paragraph':
      return (
        <p className="text-gray-700 leading-7 my-2">
          {renderInline(node.content)}
        </p>
      );

    case 'heading': {
      const level = (node.attrs?.level as number) || 2;
      const Tag = `h${level}` as keyof JSX.IntrinsicElements;
      const styles: Record<number, string> = {
        1: 'text-2xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200',
        2: 'text-xl font-bold text-gray-900 mt-6 mb-3',
        3: 'text-lg font-semibold text-gray-800 mt-5 mb-2',
      };
      return (
        <Tag className={styles[level] || styles[3]}>
          {renderInline(node.content)}
        </Tag>
      );
    }

    case 'bulletList':
      return (
        <ul className="list-disc list-outside pl-6 my-2 space-y-1">
          {node.content?.map((child, i) => (
            <RenderNode key={i} node={child} />
          ))}
        </ul>
      );

    case 'orderedList':
      return (
        <ol className="list-decimal list-outside pl-6 my-2 space-y-1">
          {node.content?.map((child, i) => (
            <RenderNode key={i} node={child} />
          ))}
        </ol>
      );

    case 'listItem':
      return (
        <li className="text-gray-700 leading-7">
          {node.content?.map((child, i) => (
            <RenderNode key={i} node={child} />
          ))}
        </li>
      );

    case 'details': {
      const summaryNode = node.content?.find(
        (c) => c.type === 'detailsSummary'
      );
      const contentNode = node.content?.find(
        (c) => c.type === 'detailsContent'
      );
      return (
        <ToggleBlock summary={renderInline(summaryNode?.content)}>
          {contentNode?.content?.map((child, i) => (
            <RenderNode key={i} node={child} />
          ))}
        </ToggleBlock>
      );
    }

    case 'callout': {
      const icon = (node.attrs?.icon as string) || 'ℹ️';
      return (
        <div className="flex gap-3 bg-gray-50 border border-gray-200 rounded-lg p-4 my-3">
          <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
          <div className="flex-1 text-gray-700 text-[15px] [&>p]:my-1">
            {node.content?.map((child, i) => (
              <RenderNode key={i} node={child} />
            ))}
          </div>
        </div>
      );
    }

    case 'table':
      return (
        <div className="overflow-x-auto my-4">
          <table className="w-full border-collapse text-sm">
            <tbody>
              {node.content?.map((row, ri) => (
                <tr
                  key={ri}
                  className={ri === 0 ? 'bg-gray-50' : 'border-t border-gray-200'}
                >
                  {row.content?.map((cell, ci) => {
                    const CellTag =
                      cell.type === 'tableHeader' ? 'th' : 'td';
                    return (
                      <CellTag
                        key={ci}
                        className={`px-3 py-2.5 text-left ${
                          cell.type === 'tableHeader'
                            ? 'font-semibold text-gray-900 border-b-2 border-gray-300'
                            : 'text-gray-700'
                        }`}
                      >
                        {cell.content?.map((child, i) => (
                          <RenderNode key={i} node={child} />
                        ))}
                      </CellTag>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'image': {
      const src = node.attrs?.src as string;
      const alt = (node.attrs?.alt as string) || '';
      if (!src) return null;
      return (
        <figure className="my-4">
          <img
            src={src}
            alt={alt}
            className="max-w-full rounded-lg border border-gray-200"
            loading="lazy"
          />
          {alt && (
            <figcaption className="text-sm text-gray-500 mt-1.5 text-center">
              {alt}
            </figcaption>
          )}
        </figure>
      );
    }

    case 'horizontalRule':
      return <hr className="my-6 border-gray-200" />;

    case 'blockquote':
      return (
        <blockquote className="border-l-4 border-indigo-300 pl-4 py-1 my-3 text-gray-600 italic">
          {node.content?.map((child, i) => (
            <RenderNode key={i} node={child} />
          ))}
        </blockquote>
      );

    case 'codeBlock': {
      const lang = (node.attrs?.language as string) || '';
      return (
        <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 my-3 overflow-x-auto text-sm font-mono">
          {lang && (
            <span className="text-gray-400 text-xs block mb-2">{lang}</span>
          )}
          <code>{node.content?.map((c) => c.text).join('')}</code>
        </pre>
      );
    }

    default:
      return null;
  }
}

export default function GuideRenderer({
  content,
}: {
  content: TipTapNode;
}) {
  if (!content?.content) return null;

  return (
    <div className="guide-content max-w-none">
      {content.content.map((node, i) => (
        <RenderNode key={i} node={node} />
      ))}
    </div>
  );
}
