import { Fragment, type ReactNode } from 'react';

/**
 * Minimal inline markup for lesson text, kept deliberately small:
 *   **bold**   _italic_   {{x²}} → formula token rendered LTR in monospace
 *   [[18]] → number rendered LTR with tabular figures
 * Line breaks ("\n\n") become paragraphs.
 */
const TOKEN = /(\*\*[^*]+\*\*|_[^_]+_|\{\{[^}]+\}\}|\[\[[^\]]+\]\])/g;

export function renderInline(text: string): ReactNode[] {
  const parts = text.split(TOKEN);
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith('**')) return <strong key={i}>{renderInline(part.slice(2, -2))}</strong>;
    if (part.startsWith('_') && part.endsWith('_') && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
    if (part.startsWith('{{')) return <Sci key={i}>{part.slice(2, -2)}</Sci>;
    if (part.startsWith('[[')) return <span key={i} className="num font-semibold">{part.slice(2, -2)}</span>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function Sci({ children }: { children: ReactNode }) {
  return (
    <bdi className="sci" dir="ltr">
      {children}
    </bdi>
  );
}

export function Rich({ text, className }: { text: string; className?: string }) {
  const paragraphs = text.trim().split(/\n\s*\n/);
  if (paragraphs.length === 1) return <p className={className}>{renderInline(text.trim())}</p>;
  return (
    <div className={className}>
      {paragraphs.map((p, i) => (
        <p key={i} className={i > 0 ? 'mt-4' : undefined}>
          {renderInline(p)}
        </p>
      ))}
    </div>
  );
}
