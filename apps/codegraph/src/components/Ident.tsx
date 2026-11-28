import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { splitIdentifiers } from '@/i18n/identifiers';

/**
 * Renders a UI string so identifiers, acronyms and numbers are LTR islands inside Hebrew text.
 * Code names get the monospace chip (.sci) in both languages; in Hebrew, Latin terms and
 * numbers are isolated too.
 */
export function Ident({ text }: { text: string }) {
  const { i18n } = useTranslation();
  const he = i18n.language === 'he';
  return (
    <>
      {splitIdentifiers(text, he).map((s, i) => {
        if (s.kind === 'code') return <bdi key={i} className="sci" dir="ltr">{s.text}</bdi>;
        if (s.kind === 'latin') return <bdi key={i} dir="ltr" className="inline-block">{s.text}</bdi>;
        if (s.kind === 'num') return <span key={i} className="num">{s.text}</span>;
        return <Fragment key={i}>{s.text}</Fragment>;
      })}
    </>
  );
}
