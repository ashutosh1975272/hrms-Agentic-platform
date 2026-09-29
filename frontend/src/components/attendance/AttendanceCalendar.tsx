import { ATTENDANCE_STATUS_LABEL, type AttendanceDay } from '../../api/types';
import { Badge } from '../ui/Badge';
import { ATTENDANCE_TONE } from './attendanceMeta';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

interface Cell {
  isoDate: string;
  dayNumber: number;
  day: AttendanceDay | null;
}

function buildCells(month: string, days: readonly AttendanceDay[]): Cell[] {
  const [year, monthPart] = month.split('-').map((part) => Number.parseInt(part, 10));
  const total = new Date(year, monthPart, 0).getDate();
  const firstWeekday = (new Date(year, monthPart - 1, 1).getDay() + 6) % 7;
  const byDate = new Map(days.map((day) => [day.date, day]));

  const cells: Cell[] = [];
  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push({ isoDate: '', dayNumber: 0, day: null });
  }
  for (let dayNumber = 1; dayNumber <= total; dayNumber += 1) {
    const isoDate = `${`${year}`.padStart(4, '0')}-${`${monthPart}`.padStart(2, '0')}-${`${dayNumber}`.padStart(2, '0')}`;
    cells.push({ isoDate, dayNumber, day: byDate.get(isoDate) ?? null });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ isoDate: '', dayNumber: 0, day: null });
  }
  return cells;
}

export interface AttendanceCalendarProps {
  month: string;
  days: readonly AttendanceDay[];
}

export function AttendanceCalendar({ month, days }: AttendanceCalendarProps) {
  const cells = buildCells(month, days);
  const [year, monthPart] = month.split('-');
  const label = new Date(Number.parseInt(year, 10), Number.parseInt(monthPart, 10) - 1, 1).toLocaleString(
    'en-IN',
    { month: 'long', year: 'numeric' },
  );
  const rows: Cell[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    rows.push(cells.slice(index, index + 7));
  }

  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
        <caption className="sr-only">Daily attendance for {label}</caption>
        <thead>
          <tr className="border-b border-border">
            {WEEKDAYS.map((weekday) => (
              <th
                key={weekday}
                scope="col"
                className="px-2 py-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
              >
                {weekday}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((week, weekIndex) => (
            <tr key={weekIndex} className="border-b border-border/70 last:border-0">
              {week.map((cell) => (
                <td key={cell.isoDate || `blank-${weekIndex}-${cell.dayNumber}`} className="px-2 py-2 align-top">
                  {cell.dayNumber === 0 ? (
                    <span className="block min-h-14" aria-hidden="true" />
                  ) : (
                    <div className="min-h-14 rounded-control border border-border/70 p-1.5">
                      <span className="block font-heading text-sm font-semibold text-foreground">
                        {cell.dayNumber}
                      </span>
                      {cell.day ? (
                        <span className="mt-1 block">
                          <Badge tone={ATTENDANCE_TONE[cell.day.status]}>
                            {ATTENDANCE_STATUS_LABEL[cell.day.status]}
                          </Badge>
                          {cell.day.checkIn ? (
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {cell.day.checkIn}
                              {cell.day.checkOut ? ` – ${cell.day.checkOut}` : ''}
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        <span className="mt-1 block text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
