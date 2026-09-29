/**
 * Icon set — Lucide outline geometry (ISC), inlined as SVG so the app ships no
 * runtime icon dependency. Icons are decorative: every icon button also carries
 * an accessible name, and the SVGs themselves are hidden from screen readers.
 */
export type IconName =
  | 'alert'
  | 'arrow-up'
  | 'book'
  | 'check'
  | 'check-circle'
  | 'chevron-down'
  | 'circle-x'
  | 'clock'
  | 'database'
  | 'expand'
  | 'history'
  | 'loader'
  | 'message'
  | 'minus'
  | 'plus'
  | 'rotate'
  | 'shield-check'
  | 'shield-x'
  | 'sparkles'
  | 'trash'
  | 'user'
  | 'x';

const PATHS: Record<IconName, string[]> = {
  alert: [
    'M21.73 18l-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3',
    'M12 9v4',
    'M12 17h.01',
  ],
  'arrow-up': ['M12 19V5', 'm5 12 7-7 7 7'],
  book: [
    'M12 7v14',
    'M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z',
  ],
  check: ['M20 6 9 17l-5-5'],
  'check-circle': ['M21.8 10a10 10 0 1 1-5.9-9.1', 'm9 11 3 3L22 4'],
  'chevron-down': ['m6 9 6 6 6-6'],
  'circle-x': ['M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18', 'm15 9-6 6', 'm9 9 6 6'],
  clock: ['M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18', 'M12 7v5l3 2'],
  database: [
    'M12 8c4.97 0 9-1.34 9-3s-4.03-3-9-3-9 1.34-9 3 4.03 3 9 3z',
    'M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5',
    'M3 12c0 1.66 4 3 9 3s9-1.34 9-3',
  ],
  expand: ['M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4', 'm10 17 5-5-5-5', 'M15 12H3'],
  history: ['M3 12a9 9 0 1 0 3-6.7L3 8', 'M3 3v5h5', 'M12 7v5l4 2'],
  loader: ['M21 12a9 9 0 1 1-6.22-8.56'],
  message: ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],
  minus: ['M5 12h14'],
  plus: ['M5 12h14', 'M12 5v14'],
  rotate: ['M3 12a9 9 0 1 0 2.64-6.36L3 8', 'M3 3v5h5'],
  'shield-check': [
    'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
    'm9 12 2 2 4-4',
  ],
  'shield-x': [
    'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
    'm14.5 9.5-5 5',
    'm9.5 9.5 5 5',
  ],
  sparkles: [
    'M12 3l1.6 4.9 4.9 1.6-4.9 1.6L12 16l-1.6-4.9L5.5 9.5l4.9-1.6z',
    'M18 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z',
  ],
  trash: [
    'M3 6h18',
    'M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2',
    'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6',
    'M10 11v6',
    'M14 11v6',
  ],
  user: ['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0'],
  x: ['M18 6 6 18', 'm6 6 12 12'],
};

export interface IconProps {
  name: IconName;
  className?: string;
}

export function Icon({ name, className = 'h-5 w-5' }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      height={20}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      width={20}
    >
      {PATHS[name].map((d) => (
        <path d={d} key={d} />
      ))}
    </svg>
  );
}
