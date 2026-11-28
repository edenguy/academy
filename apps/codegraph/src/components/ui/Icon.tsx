import type { ReactNode, SVGProps } from 'react';

export type IconName =
  | 'check' | 'x' | 'arrow' | 'sun' | 'moon' | 'globe' | 'alert' | 'refresh' | 'speaker'
  | 'speakerMute' | 'paperclip' | 'handle' | 'pin' | 'envelope' | 'target' | 'lock' | 'trophy' | 'play'
  | 'repo' | 'gear' | 'stack' | 'server' | 'shield' | 'laptop' | 'doc' | 'cube' | 'puzzle' | 'approx' | 'emptyCircle' | 'pause';

const paths: Record<IconName, string> = {
  check: 'm5 12 5 5L20 7',
  x: 'M6 6l12 12M18 6 6 18',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-15v2m0 16v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M2 12h2m16 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  moon: 'M21 13.5A8.5 8.5 0 0 1 10.5 3 8.5 8.5 0 1 0 21 13.5Z',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.5-2.5 3.5-5.5 3.5-9S14.5 5.5 12 3m0 18c-2.5-2.5-3.5-5.5-3.5-9S9.5 5.5 12 3M3 12h18',
  alert: 'M12 9v4m0 4h.01M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5',
  speaker: 'M4 9v6h4l5 4V5L8 9H4Zm12.5-.5a5 5 0 0 1 0 7M19 5.5a9 9 0 0 1 0 13',
  speakerMute: 'M4 9v6h4l5 4V5L8 9H4Zm11 1 6 6m0-6-6 6',
  paperclip: 'M21.4 11.1 12.3 20a4.5 4.5 0 1 1-6.4-6.4l8.5-8.5a3 3 0 1 1 4.2 4.2L10 18a1.5 1.5 0 1 1-2.1-2.1l7.1-7.1',
  handle: 'M3 16 C 8 16, 10 7, 15 7 S 21 10 21 10',
  pin: 'M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10Z',
  envelope: 'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm0 1 9 6 9-6',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0V4Zm0 1H5a2 2 0 0 0 0 4h1M16 5h3a2 2 0 0 1 0 4h-1M10 16v2a2 2 0 0 0 4 0v-2M9 21h6',
  play: 'M7 4.5v15l12-7.5-12-7.5Z',
  repo: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Zm0 13a3 3 0 0 1 3-3h11',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0-12v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M18.4 5.6l-2.1 2.1m-8.6 8.6-2.1 2.1',
  stack: 'm12 3 9 4.5-9 4.5-9-4.5L12 3Zm-9 9 9 4.5 9-4.5m-18 4.5L12 21l9-4.5',
  server: 'M4 5h16v6H4V5Zm0 8h16v6H4v-6Zm3-5h.01M7 16h.01',
  shield: 'M12 3 5 6v5c0 4.5 3 8.2 7 10 4-1.8 7-5.5 7-10V6l-7-3Z',
  laptop: 'M5 6h14v9H5V6Zm-2 12h18',
  doc: 'M7 3h7l4 4v14H7V3Zm7 0v4h4M10 12h5m-5 3h5',
  cube: 'm12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 9 8-4.5M12 12v9M12 12 4 7.5',
  puzzle: 'M10 4a2 2 0 1 1 4 0v2h4v4h-2a2 2 0 1 0 0 4h2v4h-4v-2a2 2 0 1 0-4 0v2H6v-4h2a2 2 0 1 0 0-4H6V6h4V4Z',
  approx: 'M4 9c2-2 4-2 6 0s4 2 6 0 3-1 4 0M4 16c2-2 4-2 6 0s4 2 6 0 3-1 4 0',
  emptyCircle: 'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z',
  pause: 'M9 5v14M15 5v14',
};

/** A second, filled element some icons need (a dot on `handle`/`pin`/`target`) — Icon.tsx
 * supports one optional child shape per icon so callers don't have to compose two <Icon>s. */
const extras: Partial<Record<IconName, (key: string) => ReactNode>> = {
  handle: (key) => <circle key={key} cx="12" cy="10.6" r="2.6" fill="currentColor" stroke="none" />,
  pin: (key) => <circle key={key} cx="12" cy="11" r="2.2" fill="currentColor" stroke="none" />,
  target: (key) => <circle key={key} cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />,
};

export function Icon({ name, size = 20, className, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  const extra = extras[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      <path d={paths[name]} />
      {extra?.('extra')}
    </svg>
  );
}
