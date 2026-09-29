import { useCallback, useMemo, useState } from 'react';

import { HOLIDAY_TYPE_LABEL, type Holiday, type HolidayType } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { useResource } from '../hooks/useResource';
import { Badge, type BadgeTone } from '../components/ui/Badge';
import { PageHeader, SectionCard } from '../components/ui/Card';
import { SelectField } from '../components/ui/Field';
import { DataTable, type Column } from '../components/ui/DataTable';
import { StatCard } from '../components/ui/StatCard';

const TYPE_TONE: Record<HolidayType, BadgeTone> = {
  public: 'primary',
  restricted: 'warning',
  company: 'success',
};

const TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All types' },
  ...(Object.keys(HOLIDAY_TYPE_LABEL) as HolidayType[]).map((value) => ({
    value,
    label: HOLIDAY_TYPE_LABEL[value],
  })),
];

function daysUntil(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${isoDate}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function HolidaysPage() {
  const { client, accessToken } = useAuth();
  const [type, setType] = useState('all');

  const loader = useCallback((token: string) => client.listHolidays(token), [client]);
  const { data, error, loading, reload } = useResource(loader, accessToken);

  const sorted = useMemo(
    () => [...(data ?? [])].sort((left, right) => (left.date < right.date ? -1 : 1)),
    [data],
  );

  const upcoming = useMemo(() => sorted.filter((holiday) => daysUntil(holiday.date) >= 0), [sorted]);
  const filtered = useMemo(
    () => (type === 'all' ? sorted : sorted.filter((holiday) => holiday.type === type)),
    [sorted, type],
  );

  const columns: Array<Column<Holiday>> = useMemo(
    () => [
      { key: 'name', header: 'Holiday', render: (row) => row.name },
      { key: 'date', header: 'Date', render: (row) => row.date },
      {
        key: 'type',
        header: 'Type',
        render: (row) => <Badge tone={TYPE_TONE[row.type]}>{HOLIDAY_TYPE_LABEL[row.type]}</Badge>,
      },
      { key: 'regions', header: 'Applies to', render: (row) => row.regions.join(', ') },
      {
        key: 'countdown',
        header: 'Countdown',
        align: 'right',
        render: (row) => {
          const days = daysUntil(row.date);
          if (days === 0) {
            return <Badge tone="primary">Today</Badge>;
          }
          return days > 0 ? `${days} day${days === 1 ? '' : 's'}` : 'Passed';
        },
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Holidays"
        description="Public, restricted and company holidays with the regions they apply to."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Holidays listed" value={sorted.length} icon="calendar" staggerIndex={0} />
        <StatCard label="Upcoming" value={upcoming.length} icon="clock" staggerIndex={1} />
        <StatCard
          label="Next holiday"
          value={upcoming[0]?.name ?? 'None scheduled'}
          icon="bell"
          staggerIndex={2}
        />
        <StatCard label="Next holiday date" value={upcoming[0]?.date ?? '—'} icon="calendar" staggerIndex={3} />
      </div>

      <SectionCard title="Holiday calendar" description="Filter by holiday type.">
        <div className="max-w-xs">
          <SelectField
            label="Type"
            name="holidayType"
            value={type}
            onChange={setType}
            options={TYPE_OPTIONS}
          />
        </div>

        <div className="mt-4">
          <DataTable
            caption="Holiday calendar"
            columns={columns}
            rows={filtered}
            rowKey={(row) => row.id}
            loading={loading}
            error={error}
            {...(error ? { onRetry: reload } : {})}
            emptyTitle="No holidays listed"
            emptyDescription="No holiday matches the selected type."
          />
        </div>
      </SectionCard>
    </div>
  );
}
