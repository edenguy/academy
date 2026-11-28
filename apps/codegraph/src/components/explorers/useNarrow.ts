import { useLayoutEffect, useState, type RefObject } from 'react';

/** The element's own content width in CSS px (0 until measured). */
export function useWidth(ref: RefObject<HTMLElement | null>): number {
  const [w, setW] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 0));
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.getBoundingClientRect().width);
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const e = entries[0];
      if (e) setW(e.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

/** True when the element's own width is below `breakpoint` CSS px. A container query, not a media query. */
export function useNarrow(ref: RefObject<HTMLElement | null>, breakpoint = 720): boolean {
  return useWidth(ref) < breakpoint;
}
