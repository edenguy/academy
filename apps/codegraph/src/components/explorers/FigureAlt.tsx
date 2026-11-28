import { useId, type ReactNode } from 'react';

export interface FigureAria {
  role: 'group';
  'aria-labelledby': string;
  'aria-describedby': string;
}

/**
 * A figure with a visible caption and a visually hidden list, generated from the same data
 * as the drawing (the text alternative, CODEGRAPH_LLD.md section 4.0 rule 4).
 */
export function FigureAlt({
  caption,
  items,
  children,
  className,
}: {
  caption: string;
  items: string[];
  children: (aria: FigureAria) => ReactNode;
  className?: string;
}) {
  const id = useId();
  const capId = `${id}-cap`;
  const listId = `${id}-list`;
  return (
    <figure className={className} style={{ margin: 0 }}>
      {children({ role: 'group', 'aria-labelledby': capId, 'aria-describedby': listId })}
      <figcaption id={capId} className="mt-1.5 text-[13px] text-muted">
        {caption}
      </figcaption>
      <ol id={listId} className="sr-only" data-alt-list>
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ol>
    </figure>
  );
}
