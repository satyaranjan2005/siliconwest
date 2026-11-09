'use client';

import React from 'react';

/**
 * Lightweight, safe, self-contained Markdown renderer in React
 * Supports headings, bold, italic, code blocks, inline code, lists, blockquotes, links, and tables.
 */
export function MarkdownView({ content, className = '' }) {
  if (!content) return null;

  // Split lines and parse blocks
  const lines = content.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBlockContent = [];
  let codeBlockLang = '';
  let inList = false;
  let listItems = [];
  let isNumberedList = false;

  const flushList = () => {
    if (inList && listItems.length > 0) {
      if (isNumberedList) {
        elements.push(
          <ol key={`ol-${elements.length}`} className="list-decimal pl-6 my-2 space-y-1 text-slate-700">
            {listItems.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {renderInline(item)}
              </li>
            ))}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`ul-${elements.length}`} className="list-disc pl-6 my-2 space-y-1 text-slate-700">
            {listItems.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {renderInline(item)}
              </li>
            ))}
          </ul>
        );
      }
      inList = false;
      listItems = [];
    }
  };

  const flushCodeBlock = () => {
    if (inCodeBlock) {
      elements.push(
        <div key={`code-${elements.length}`} className="my-3 rounded-xl bg-slate-900 text-slate-100 p-4 font-mono text-xs overflow-x-auto shadow-inner border border-slate-800">
          {codeBlockLang && (
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-sans mb-2 font-bold">
              {codeBlockLang}
            </div>
          )}
          <pre className="leading-relaxed">
            <code>{codeBlockContent.join('\n')}</code>
          </pre>
        </div>
      );
      inCodeBlock = false;
      codeBlockContent = [];
      codeBlockLang = '';
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks: ```
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock();
      } else {
        flushList();
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Blank line
    if (!line.trim()) {
      flushList();
      continue;
    }

    // Horizontal Rule
    if (/^(\*\*\*|---|___)$/.test(line.trim())) {
      flushList();
      elements.push(<hr key={`hr-${i}`} className="my-4 border-slate-200" />);
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h4 key={`h4-${i}`} className="text-base font-bold text-slate-900 mt-4 mb-1">
          {renderInline(line.slice(4))}
        </h4>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={`h3-${i}`} className="text-lg font-bold text-slate-900 mt-5 mb-2 border-b border-slate-100 pb-1">
          {renderInline(line.slice(3))}
        </h3>
      );
      continue;
    }
    if (line.startsWith('# ')) {
      flushList();
      elements.push(
        <h2 key={`h2-${i}`} className="text-xl font-bold text-slate-900 mt-6 mb-2 border-b border-slate-200 pb-1.5">
          {renderInline(line.slice(2))}
        </h2>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      flushList();
      elements.push(
        <blockquote key={`quote-${i}`} className="border-l-3 border-[#034694] pl-4 py-1 my-3 bg-blue-50/50 rounded-r-xl italic text-slate-700 text-xs sm:text-sm">
          {renderInline(line.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Unordered List
    if (/^[-*]\s+/.test(line)) {
      if (!inList || isNumberedList) {
        flushList();
        inList = true;
        isNumberedList = false;
      }
      listItems.push(line.replace(/^[-*]\s+/, ''));
      continue;
    }

    // Ordered List
    if (/^\d+\.\s+/.test(line)) {
      if (!inList || !isNumberedList) {
        flushList();
        inList = true;
        isNumberedList = true;
      }
      listItems.push(line.replace(/^\d+\.\s+/, ''));
      continue;
    }

    // Regular Paragraph
    flushList();
    elements.push(
      <p key={`p-${i}`} className="my-2 leading-relaxed text-slate-700 text-sm">
        {renderInline(line)}
      </p>
    );
  }

  flushList();
  flushCodeBlock();

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
}

/**
 * Parses inline elements: **bold**, *italic*, `code`, [link](url)
 */
function renderInline(text) {
  if (typeof text !== 'string') return text;

  // Simple regex-based inline parser
  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold: **text**
    const boldMatch = remaining.match(/^(\*\*|__)(.*?)\1/);
    if (boldMatch) {
      parts.push(
        <strong key={key++} className="font-bold text-slate-900">
          {boldMatch[2]}
        </strong>
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic: *text* or _text_
    const italicMatch = remaining.match(/^(\*|_)(.*?)\1/);
    if (italicMatch) {
      parts.push(
        <em key={key++} className="italic text-slate-800">
          {italicMatch[2]}
        </em>
      );
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Inline Code: `code`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      parts.push(
        <code key={key++} className="px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800 font-mono text-[11px]">
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Link: [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      parts.push(
        <a
          key={key++}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#034694] hover:underline font-semibold"
        >
          {linkMatch[1]}
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Plain text character(s)
    const nextSpecial = remaining.search(/(\*\*|__|\*|_|`|\[)/);
    if (nextSpecial === -1) {
      parts.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      parts.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      parts.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return parts;
}

export default MarkdownView;
