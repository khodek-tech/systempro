import { ReactNode } from 'react';

const URL_REGEX = /(https?:\/\/[^\s<]+)/;

export function extractFirstUrl(text: string): string | null {
  const match = text.match(URL_REGEX);
  return match ? match[1] : null;
}

export function linkifyText(text: string, linkClassName?: string): ReactNode[] {
  const parts = text.split(URL_REGEX);

  return parts.map((part, i) => {
    if (URL_REGEX.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}
