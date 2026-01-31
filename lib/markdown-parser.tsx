import React from 'react';

/**
 * Simple markdown parser for manual content
 * Supports: headings (# ## ###), lists (- item), bold (**text**), paragraphs
 */

interface ParsedElement {
  type: 'h1' | 'h2' | 'h3' | 'p' | 'li' | 'ul';
  content: React.ReactNode;
  items?: ParsedElement[];
}

/**
 * Parse inline elements (bold, etc.)
 */
function parseInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyCounter = 0;

  while (remaining.length > 0) {
    // Find bold text **text**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);

    if (boldMatch && boldMatch.index !== undefined) {
      // Add text before bold
      if (boldMatch.index > 0) {
        parts.push(remaining.slice(0, boldMatch.index));
      }

      // Add bold text
      parts.push(
        <strong key={`bold-${keyCounter++}`} className="font-semibold text-slate-800">
          {boldMatch[1]}
        </strong>
      );

      // Continue with remaining text
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
    } else {
      // No more bold, add remaining text
      parts.push(remaining);
      break;
    }
  }

  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : <>{parts}</>;
}

/**
 * Parse markdown content into structured elements
 */
function parseMarkdown(content: string): ParsedElement[] {
  const lines = content.split('\n');
  const elements: ParsedElement[] = [];
  let currentList: ParsedElement | null = null;
  let paragraphBuffer = '';

  const flushParagraph = () => {
    if (paragraphBuffer.trim()) {
      elements.push({
        type: 'p',
        content: parseInline(paragraphBuffer.trim()),
      });
      paragraphBuffer = '';
    }
  };

  const flushList = () => {
    if (currentList) {
      elements.push(currentList);
      currentList = null;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    // Heading 1
    if (trimmed.startsWith('# ')) {
      flushParagraph();
      flushList();
      elements.push({
        type: 'h1',
        content: parseInline(trimmed.slice(2)),
      });
      continue;
    }

    // Heading 2
    if (trimmed.startsWith('## ')) {
      flushParagraph();
      flushList();
      elements.push({
        type: 'h2',
        content: parseInline(trimmed.slice(3)),
      });
      continue;
    }

    // Heading 3
    if (trimmed.startsWith('### ')) {
      flushParagraph();
      flushList();
      elements.push({
        type: 'h3',
        content: parseInline(trimmed.slice(4)),
      });
      continue;
    }

    // List item
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      flushParagraph();

      if (!currentList) {
        currentList = {
          type: 'ul',
          content: null,
          items: [],
        };
      }

      currentList.items?.push({
        type: 'li',
        content: parseInline(trimmed.slice(2)),
      });
      continue;
    }

    // Numbered list item
    if (/^\d+\.\s/.test(trimmed)) {
      flushParagraph();

      if (!currentList) {
        currentList = {
          type: 'ul',
          content: null,
          items: [],
        };
      }

      const itemText = trimmed.replace(/^\d+\.\s/, '');
      currentList.items?.push({
        type: 'li',
        content: parseInline(itemText),
      });
      continue;
    }

    // Regular text - add to paragraph buffer
    flushList();
    if (paragraphBuffer) {
      paragraphBuffer += ' ';
    }
    paragraphBuffer += trimmed;
  }

  // Flush remaining content
  flushParagraph();
  flushList();

  return elements;
}

/**
 * Render parsed elements to React components
 */
function renderElements(elements: ParsedElement[]): React.ReactNode {
  return elements.map((element, index) => {
    switch (element.type) {
      case 'h1':
        return (
          <h1
            key={index}
            className="text-2xl font-bold text-slate-800 mt-6 mb-3 first:mt-0"
          >
            {element.content}
          </h1>
        );

      case 'h2':
        return (
          <h2
            key={index}
            className="text-lg font-semibold text-slate-700 mt-5 mb-2"
          >
            {element.content}
          </h2>
        );

      case 'h3':
        return (
          <h3
            key={index}
            className="text-base font-semibold text-slate-600 mt-4 mb-2"
          >
            {element.content}
          </h3>
        );

      case 'p':
        return (
          <p key={index} className="text-sm text-slate-600 leading-relaxed mb-3">
            {element.content}
          </p>
        );

      case 'ul':
        return (
          <ul key={index} className="space-y-2 mb-4 ml-4">
            {element.items?.map((item, itemIndex) => (
              <li
                key={itemIndex}
                className="text-sm text-slate-600 leading-relaxed flex items-start"
              >
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                <span>{item.content}</span>
              </li>
            ))}
          </ul>
        );

      default:
        return null;
    }
  });
}

interface MarkdownProps {
  content: string;
  className?: string;
}

/**
 * Markdown component - renders markdown content
 */
export function Markdown({ content, className = '' }: MarkdownProps) {
  const elements = parseMarkdown(content);

  return <div className={className}>{renderElements(elements)}</div>;
}

/**
 * Render FAQ list
 */
interface FaqItem {
  q: string;
  a: string;
}

interface FaqListProps {
  items: FaqItem[];
  className?: string;
}

export function FaqList({ items, className = '' }: FaqListProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {items.map((item, index) => (
        <div key={index} className="bg-slate-50 rounded-lg p-4">
          <p className="text-sm font-semibold text-slate-700 mb-2">{item.q}</p>
          <p className="text-sm text-slate-600">{item.a}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Render tips list
 */
interface TipsListProps {
  items: string[];
  className?: string;
}

export function TipsList({ items, className = '' }: TipsListProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((tip, index) => (
        <div
          key={index}
          className="flex items-start bg-amber-50 border border-amber-100 rounded-lg p-3"
        >
          <span className="text-amber-500 mr-2 text-sm">💡</span>
          <p className="text-sm text-amber-800">{tip}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Render step-by-step instructions
 */
interface StepsListProps {
  items: string[];
  className?: string;
}

export function StepsList({ items, className = '' }: StepsListProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((step, index) => (
        <div key={index} className="flex items-start">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-semibold flex items-center justify-center mr-3">
            {index + 1}
          </span>
          <p className="text-sm text-slate-600 leading-relaxed pt-0.5">
            {parseInline(step)}
          </p>
        </div>
      ))}
    </div>
  );
}
