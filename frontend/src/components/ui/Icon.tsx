import type { SVGProps } from 'react';

/**
 * Inline Lucide-style stroke icons. Icons are decorative by default and are
 * hidden from assistive technology; pass `title` when an icon is the only
 * content of a control.
 */
const PATHS = {
  search: ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z', 'm20 20-3.6-3.6'],
  plus: ['M12 5v14', 'M5 12h14'],
  pencil: ['M12 20h9', 'M16.4 3.6a2.1 2.1 0 0 1 3 3L7.5 18.5 3 20l1.5-4.5Z'],
  trash: [
    'M3 6h18',
    'M8 6V4h8v2',
    'M19 6l-1 14H6L5 6',
    'M10 11v6',
    'M14 11v6',
  ],
  close: ['M18 6 6 18', 'm6 6 12 12'],
  check: ['m20 6-11 11-5-5'],
  'chevron-left': ['m15 18-6-6 6-6'],
  'chevron-right': ['m9 18 6-6-6-6'],
  'chevron-down': ['m6 9 6 6 6-6'],
  calendar: ['M4 6h16a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z', 'M16 3v4', 'M8 3v4', 'M3 11h18'],
  clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 7v5l3 2'],
  users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M22 21v-2a4 4 0 0 0-3-3.9'],
  user: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z'],
  'file-text': [
    'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z',
    'M14 2v6h6',
    'M16 13H8',
    'M16 17H8',
    'M10 9H8',
  ],
  megaphone: [
    'M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1Z',
    'M16 8.5a5 5 0 0 1 0 7',
  ],
  dashboard: ['M4 4h7v8H4z', 'M13 4h7v5h-7z', 'M13 12h7v8h-7z', 'M4 15h7v5H4z'],
  shield: ['M12 21s7-3.2 7-9V5.6L12 3 5 5.6V12c0 5.8 7 9 7 9Z', 'm9 12 2 2 4-4'],
  'log-out': ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'm16 17 5-5-5-5', 'M21 12H9'],
  menu: ['M3 6h18', 'M3 12h18', 'M3 18h18'],
  alert: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 8v4', 'M12 16h.01'],
  refresh: ['M20 12a8 8 0 1 1-2.5-5.8', 'M20 4v5h-5'],
  inbox: [
    'M22 12h-5l-1.5 3h-3L11 12H2',
    'M5.4 5h13.2L22 12v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7Z',
  ],
  'user-plus': [
    'M15 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
    'M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
    'M19 8v6',
    'M22 11h-6',
  ],
  filter: ['M3 4h18l-7 8.5V20l-4-2.2v-5.3Z'],
  eye: ['M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'],
  'arrow-left': ['M19 12H5', 'm12 19-7-7 7-7'],
  send: ['M22 2 11 13', 'M22 2l-7 20-4-9-9-4Z'],
  history: ['M3 3v6h6', 'M3.5 13a9 9 0 1 0 2.5-6.3L3 9', 'M12 7v5l4 2'],
  briefcase: ['M4 7h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z', 'M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2'],
  bell: ['M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9', 'M13.7 21a2 2 0 0 1-3.4 0'],
  book: ['M4 19.5A2.5 2.5 0 0 1 6.5 17H20', 'M6.5 2H20v20H6.5A2.5 2.0 0 0 1 4 19.5Z'],
  info: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 11v5', 'M12 8h.01'],
} as const;

export type IconName = keyof typeof PATHS;

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children' | 'name'> {
  name: IconName;
  size?: number;
  title?: string;
  className?: string;
}

export function Icon({ name, size = 20, title, className = '', ...rest }: IconProps) {
  return (
    <svg
      {...rest}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`.trim()}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
