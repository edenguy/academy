import { useLayoutEffect, useState, type RefObject } from 'react';

/** True when the element's own width is below `breakpoint` CSS px. A container query, not a media query. */
export function useNarrow(ref: RefObject<HTMLElement | null>, breakpoint = 720): boolean {
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.innerWidth < breakpoint);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = (w: number) => setNarrow(w < breakpoint);
    measure(el.getBoundingClientRect().width);
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const e = entries[0];
      if (e) measure(e.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, breakpoint]);
  return narrow;
}
