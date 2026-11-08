import type { SVGProps } from 'react';

export type IconName =
  | 'home' | 'book' | 'check' | 'x' | 'chevron' | 'play' | 'arrow' | 'sun' | 'moon'
  | 'globe' | 'sparkle' | 'star' | 'alert' | 'lightbulb' | 'refresh' | 'trophy' | 'speaker' | 'speakerMute';

const paths: Record<IconName, string> = {
  home: 'M3 11.5 12 4l9 7.5M5 10v10h14V10',
  book: 'M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Zm4 2h8M8 11h8',
  check: 'm5 12 5 5L20 7',
  x: 'M6 6l12 12M18 6 6 18',
  chevron: 'm9 6 6 6-6 6',
  play: 'M8 5v14l11-7-11-7Z',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-15v2m0 16v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M2 12h2m16 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  moon: 'M21 13.5A8.5 8.5 0 0 1 10.5 3 8.5 8.5 0 1 0 21 13.5Z',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.5-2.5 3.5-5.5 3.5-9S14.5 5.5 12 3m0 18c-2.5-2.5-3.5-5.5-3.5-9S9.5 5.5 12 3M3 12h18',
  sparkle: 'M12 3v4m0 10v4m-9-9h4m10 0h4M6 6l2 2m8 8 2 2M6 18l2-2m8-8 2-2',
  star: 'M12 3.5l2.6 5.6 6.1.6-4.6 4.2 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.2 6.1-.6Z',
  alert: 'M12 9v4m0 4h.01M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  lightbulb: 'M9 18h6m-5 3h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3Z',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0V4Zm-4 1h4v3a3 3 0 0 1-3-3H4Zm16 0h-4v3a3 3 0 0 0 3-3h1ZM12 13v4m-4 4h8m-6 0 1-4h2l1 4',
  speaker: 'M4 9v6h4l5 4V5L8 9H4Zm12.5-.5a5 5 0 0 1 0 7M19 5.5a9 9 0 0 1 0 13',
  speakerMute: 'M4 9v6h4l5 4V5L8 9H4Zm11 1 6 6m0-6-6 6',
};

export function Icon({ name, size = 20, className, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
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
    </svg>
  );
}
